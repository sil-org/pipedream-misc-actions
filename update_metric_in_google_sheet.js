import { google } from 'googleapis@^144'

export default {
  name: "Update Metric (Google Sheet)",
  description: "Increment the counter for how many records of a given type were processed, in a Google Sheet",
  key: "update_metric_in_google_sheet",
  version: "0.1.0",
  type: "action",

  props: {
    source_file_name: {
      type: "string",
      label: "File Name",
      description: "The name of the file being processed"
    },
    run_id: {
      type: "string",
      label: "Run ID",
      description: "The unique ID for this run (to prevent double-counting when the same file is processed more than once). The Dispatcher should set this to 'NEW' (to generate a new value). Subworkflows should provide the value given them by the Dispatcher."
    },
    record_type: {
      type: "string",
      label: "Record Type",
      description: "The type of the record being processed. Do not provide when Run ID is 'NEW'.",
      optional: true,
      default: '',
    },
    google_sheet_id: {
      type: "string",
      label: "Google Sheet ID",
      description: "The ID of the Google Sheet for the metrics (get from the URL, between `/d/` and `/edit`)"
    },
    google_service_account_key: {
      type: "string",
      label: "Google Service Account Key",
      description: "The JSON string of the Google Service Account Key",
      secret: true,
    },
  },
  async run({ steps, $ }) {
    return await updateMetric(
      this.source_file_name,
      this.run_id,
      this.record_type,
      this.google_sheet_id,
      this.google_service_account_key,
    )
  },
}

const getColumnLetter = (index) => {
  let letter = ''
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter
    index = Math.floor(index / 26) - 1
  }
  return letter
}

/**
 * Find which column (in the header row) is for the given type of record.
 *
 * @param {string} recordType
 * @param sheets
 * @param {string} googleSheetId
 * @return {Promise<number>}
 */
const getIndexOfColumnFor = async (recordType, sheets, googleSheetId) => {
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: googleSheetId,
    range: '1:1',
  })
  const headers = (headerRes.data.values || [])[0] || []
  return headers.indexOf(recordType)
}

const updateMetric = async (
  sourceFileName,
  runID,
  recordType,
  googleSheetId,
  googleServiceAccountKey
) => {
  if (!runID) {
    return { error: 'No Run ID was provided' }
  }

  if (runID === 'NEW') {
    if (recordType) {
      return {error: 'Do not provide a Record Type when generating a new Run ID'}
    }
  } else {
    if (!recordType) {
      return { error: 'A Record Type is required when updating metrics for a given Run ID' }
    }
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(googleServiceAccountKey),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  let insertedNewRow = false
  let newCount

  if (runID === 'NEW') {
    runID = generateNewRunID()
    const jobRunDateTime = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    const values = [
      jobRunDateTime,
      sourceFileName,
      runID,
    ]
    await sheets.spreadsheets.values.append({
      spreadsheetId: googleSheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [values]
      }
    })
    insertedNewRow = true
  } else {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetId,
      range: 'B:C',
    })
    const fileNamesAndRunIDs = response.data.values || []

    let rowToUpdateIndex = fileNamesAndRunIDs.findIndex(row => row[0] === sourceFileName && row[1] === runID)
    if (rowToUpdateIndex === -1) {
      return { error: `No row found for File Name: ${sourceFileName} and Run ID: ${runID}` }
    }

    const colIndexForRecordType = await getIndexOfColumnFor(
      recordType,
      sheets,
      googleSheetId
    )
    if (colIndexForRecordType === -1) {
      return { error: `No column found for record type: ${recordType}` }
    }

    const fileNameRowNumber = rowToUpdateIndex + 1 // Row indexes start at 0. Row numbers start at 1.
    const columnLetterForRecordType = getColumnLetter(colIndexForRecordType)
    const cellRange = `${columnLetterForRecordType}${fileNameRowNumber}`
    
    const getCellResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetId,
      range: cellRange,
    })
    const previousCount = parseInt((getCellResponse.data.values || [[]])[0][0] || 0)
    newCount = previousCount + 1
    await sheets.spreadsheets.values.update({
      spreadsheetId: googleSheetId,
      range: cellRange,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[newCount]]
      }
    })
  }

  return {
    insertedNewRow,
    newCount,
    runID,
  }
}

const generateNewRunID = () => Math.random().toString(36).substring(2, 10)

export {
  updateMetric,
}
