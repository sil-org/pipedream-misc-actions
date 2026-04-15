import { google } from 'googleapis@^144'

export default {
  name: "Update Metric (Google Sheet)",
  description: "Add a new row OR increment the counter for how many records of a given type were processed, in a Google Sheet",
  key: "update_metric_in_google_sheet",
  version: "0.2.1",
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
      description: "The unique ID for this run (to prevent double-counting when the same file is processed more than once). The Dispatcher should set this to 'NEW' (to add a row with a new Run ID). Sub-workflows should provide the value given them by the Dispatcher."
    },
    record_type: {
      type: "string",
      label: "Record Type",
      description: "The type of the record being processed. Do not provide when Run ID is 'NEW'.",
      optional: true,
      default: '',
    },
    number_of_items: {
      type: "integer",
      label: "Number of Items",
      description: "How many items there were (i.e. how much to increment the recorded metrics by)",
      optional: true,
      default: 1,
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
      this.number_of_items,
      this.google_sheet_id,
      this.google_service_account_key,
      steps?.trigger?.event?.id,
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

/**
 * @param {string} sourceFileName
 * @param {string} runID
 * @param {string} recordType
 * @param {number} numberOfItems
 * @param {string} googleSheetId
 * @param {string} googleServiceAccountKey
 * @param {string} fullEventId
 * @return {Promise<Object>}
 */
const updateMetric = async (
  sourceFileName,
  runID,
  recordType,
  numberOfItems,
  googleSheetId,
  googleServiceAccountKey,
  fullEventId
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
  let previousCount

  if (runID === 'NEW') {
    if (!fullEventId) {
      return { error: 'No event.id was found/provided (to use as the new Run ID)' }
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetId,
      range: 'B:C',
    })
    const fileNamesAndRunIDs = response.data.values || []

    runID = fullEventId
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

    const rowNumber = rowToUpdateIndex + 1 // Row indexes start at 0. Row numbers start at 1.
    const columnLetterForRecordType = getColumnLetter(colIndexForRecordType)
    const cellRange = `${columnLetterForRecordType}${rowNumber}`
    
    const getCellResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetId,
      range: cellRange,
    })
    previousCount = parseInt((getCellResponse.data.values || [[]])[0][0] || 0)
    newCount = previousCount + numberOfItems
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
    previousCount,
    newCount,
    runID,
  }
}

export {
  updateMetric,
}
