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
    record_type: {
      type: "string",
      label: "Record Type",
      description: "The type of the record being processed"
    },
    google_sheet_id: {
      type: "string",
      label: "Google Sheet ID",
      description: "The ID of the Google Sheet for the metrics (get from the URL, between `/d/` and `/edit`)"
    },
    google_service_account_key: {
      type: "string",
      label: "Google Service Account Key",
      description: "The JSON string of the Google Service Account Key"
    },
  },
  async run({ steps, $ }) {
    return await updateMetric(
      this.source_file_name,
      this.record_type,
      this.google_sheet_id,
      this.google_service_account_key,
    )
  },
}

const updateMetric = async (
  sourceFileName,
  recordType,
  googleSheetId,
  googleServiceAccountKey
) => {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(googleServiceAccountKey),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  // Find which column is for the type of record being processed.
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: googleSheetId,
    range: '1:1',
  })
  const headers = (headerRes.data.values || [])[0] || []
  let colIndex = headers.indexOf(recordType)

  if (colIndex === -1) {
    return {
      error: `No column found for record type: ${recordType}`
    }
  }

  // See if there is an existing row for this file
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: googleSheetId,
    range: 'A:A',
  })
  const rows = res.data.values || []
  const foundRow = rows.find(row => row[0] === sourceFileName)

  // Either insert a new row or update the existing row to count this record.
  let insertedNewRow = false
  let newCount
  if (!foundRow) {
    newCount = 1
    const values = new Array(colIndex + 1).fill("")
    values[0] = sourceFileName
    values[colIndex] = newCount
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
    const rowIndex = rows.indexOf(foundRow) + 1
    const getColumnLetter = (index) => {
      let letter = ''
      while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter
        index = Math.floor(index / 26) - 1
      }
      return letter
    }
    const colLetter = getColumnLetter(colIndex)
    const cellRange = `${colLetter}${rowIndex}`
    
    const cellRes = await sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetId,
      range: cellRange,
    })
    const currentVal = parseInt((cellRes.data.values || [[]])[0][0] || 0)
    newCount = currentVal + 1
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
  }
}

export {
  updateMetric,
}
