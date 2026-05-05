import { google } from 'googleapis@^171'

export default {
  name: "Update Metric (Google Sheet)",
  description: "Add a new row OR increment the counter for how many records of a given type were processed, in a Google Sheet",
  key: "update_metric_in_google_sheet",
  version: "2.0.2",
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
    was_dry_run: {
      type: "boolean",
      label: "Was a Dry Run?",
      description: "Whether this was a dry run (for recording when adding a new row). Example: `{{steps.Is_Dry_Run.$return_value}}`",
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
    event_id: {
      type: "string",
      label: "Event ID",
      description: "The Event ID, used for calculating a Run ID when adding a new row. Example: `{{steps.trigger.event.id}}`",
      optional: true,
      default: "",
    }
  },
  async run() {
    const googleSheet = new GoogleSheet(this.google_service_account_key, this.google_sheet_id)

    return await updateMetric(
      this.source_file_name,
      this.run_id,
      this.was_dry_run,
      this.record_type,
      this.number_of_items,
      googleSheet,
      this.event_id,
    )
  },
}

/**
 * Interface for interacting with spreadsheets
 * @interface SpreadsheetInterface
 */

/**
 * @function
 * @name SpreadsheetInterface#appendRow
 * @param {Array<string>} cellValues
 * @returns {Promise}
 */

/**
 * @function
 * @name SpreadsheetInterface#getCell
 * @param {string} cellIdentifier -- Example: `'A1'`
 * @returns {Promise<any>} -- The value of that cell (often as a string)
 */

/**
 * @function
 * @name SpreadsheetInterface#getColumn
 * @param {string} columnLetter
 * @returns {Promise<Array<Array>>} -- An array (column) of arrays (cell values in that row)
 */

/**
 * @function
 * @name SpreadsheetInterface#getRanges
 * @param {Array<string>} ranges -- Example: `['B:C', '1:1']`
 * @returns {Promise<Array<Array<Array>>>} -- A list of the results for each range, in the order specified in `ranges`. Each range's results will be a nested array.
 */

/**
 * @function
 * @name SpreadsheetInterface#update
 * @param {string} range (e.g. `'1:1'`)
 * @param {Array<Array>} values
 * @returns {Promise}
 */

/**
 * Google Sheet adapter
 *
 * @constructor
 * @param {string} serviceAccountKeyJson
 * @param {string} googleSheetId
 * @implements {SpreadsheetInterface}
 */
function GoogleSheet(serviceAccountKeyJson, googleSheetId) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(serviceAccountKeyJson),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  this.appendRow = async (cellValues) => {
    await sheets.spreadsheets.values.append({
      spreadsheetId: googleSheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [cellValues]
      }
    })
  }

  this.getColumn = async (columnLetter) => {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetId,
      range: columnLetter + ':' + columnLetter,
    })
    return response.data.values || []
  }

  this.getRanges = async (ranges) => {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: googleSheetId,
      ranges: ranges,
    })
    return response.data.valueRanges.map(valueRange => valueRange.values)
  }

  this.update = async (range, values) => {
    await sheets.spreadsheets.values.update({
      spreadsheetId: googleSheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      }
    })
  }

  this.getCell = async (cellIdentifier) => {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetId,
      range: cellIdentifier,
    })
    return (response.data.values || [[]])[0][0]
  }
}

/**
 * Add a column for the given record type and return the new column's index.
 *
 * @param {string} recordType
 * @param {SpreadsheetInterface} spreadsheet
 * @param {Array} headers -- The current array of header values
 * @return {Promise<number>}
 */
const addColumnFor = async (recordType, spreadsheet, headers) => {
  const newColumnIndex = headers.length
  headers.push(recordType)
  await spreadsheet.update('1:1', [headers])
  return newColumnIndex
}

/**
 * @param {string} givenRunID
 * @param {string[]} existingRunIDs
 * @return {string}
 */
const calculateUniqueRunID = (givenRunID, existingRunIDs) => {
  let calculatedRunID = givenRunID
  for (let i = 2; existingRunIDs.includes(calculatedRunID); i++) {
    calculatedRunID = givenRunID + '-' + i
  }
  return calculatedRunID
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
 * @param {string} sourceFileName
 * @param {string} runID
 * @param {boolean} wasDryRun
 * @param {string} recordType
 * @param {number} numberOfItems
 * @param {SpreadsheetInterface} spreadsheet
 * @param {string} eventId
 * @return {Promise<Object>}
 */
const updateMetric = async (
  sourceFileName,
  runID,
  wasDryRun,
  recordType,
  numberOfItems,
  spreadsheet,
  eventId
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

  let dryRun = wasDryRun ? 'Yes' : 'No'
  let insertedNewColumn = false
  let insertedNewRow = false
  let newCount
  let previousCount
  let warnings = []

  if (runID === 'NEW') {
    if (!eventId) {
      return { error: 'No Event ID was provided (to use in the new Run ID)' }
    }

    const existingRunIdRows = await spreadsheet.getColumn('C')
    const existingRunIDs = existingRunIdRows.map(row => row[0])

    runID = calculateUniqueRunID(eventId, existingRunIDs)
    const jobRunDateTime = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    const values = [
      jobRunDateTime,
      sourceFileName,
      runID,
      dryRun,
    ]
    await spreadsheet.appendRow(values)
    insertedNewRow = true
  } else {
    const batchedValues = await spreadsheet.getRanges(['B:C', '1:1'])
    const fileNamesAndRunIDs = batchedValues[0] || []

    let rowToUpdateIndex = fileNamesAndRunIDs.findIndex(row => row[0] === sourceFileName && row[1] === runID)
    if (rowToUpdateIndex === -1) {
      return { error: `No row found for File Name: ${sourceFileName} and Run ID: ${runID}` }
    }

    const headersNestedArray = batchedValues[1] || []
    const headers = headersNestedArray[0] || []
    let colIndexForRecordType = headers.indexOf(recordType)

    if (colIndexForRecordType === -1) {
      warnings.push(`No column found for record type "${recordType}". Adding as a new column.`)
      colIndexForRecordType = await addColumnFor(recordType, spreadsheet, headers)
      insertedNewColumn = true
    }

    const rowNumber = rowToUpdateIndex + 1 // Row indexes start at 0. Row numbers start at 1.
    const columnLetterForRecordType = getColumnLetter(colIndexForRecordType)
    const cellIdentifier = `${columnLetterForRecordType}${rowNumber}`
    
    const previousCellValue = await spreadsheet.getCell(cellIdentifier)
    previousCount = parseInt(previousCellValue || 0)
    newCount = previousCount + numberOfItems
    await spreadsheet.update(cellIdentifier, [[newCount]])
  }

  return {
    dryRun,
    insertedNewColumn,
    insertedNewRow,
    previousCount,
    newCount,
    runID,
    warnings,
  }
}

export {
  calculateUniqueRunID,
  updateMetric,
}
