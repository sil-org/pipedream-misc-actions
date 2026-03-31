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
      this.google_sheet_id,
      this.google_service_account_key,
    )
  },
}

const updateMetric = async (sourceFileName, googleSheetId, googleServiceAccountKey) => {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(googleServiceAccountKey),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: googleSheetId,
    range: 'A:A',
  })

  const rows = res.data.values || []
  const foundRow = rows.find(row => row[0] === sourceFileName)

  const insertedNewRow = !foundRow

  if (insertedNewRow) {
    // ... do stuff to insert row
  }

  return {
    insertedNewRow,
  }
}

export {
  updateMetric,
}
