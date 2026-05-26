import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { loadEnvFile } from 'node:process'
import { describe, it } from 'node:test'

try {
  loadEnvFile('.env')
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('No env file found, proceeding without it')
  } else {
    throw error
  }
}

const {
  default: component,
  updateMetric,
  calculateUniqueRunID,
} = await import('./update_metric_in_google_sheet.js')

/**
 * Mock spreadsheet adapter
 *
 * @constructor
 * @param {Array[]} initialData
 * @implements {SpreadsheetInterface}
 */
function MockSpreadsheet(initialData = [[]]) {
  this.data = initialData; // 2D array: this.data[row][col]

  this.appendRow = async (cellValues) => {
    this.data.push(cellValues);
  }

  this.getCell = async (cellIdentifier) => {
    // Basic 'A1' notation parser for the mock
    const col = cellIdentifier.match(/[A-Z]+/)[0].charCodeAt(0) - 65;
    const row = parseInt(cellIdentifier.match(/\d+/)[0]) - 1;
    return (this.data[row] && this.data[row][col]) || '';
  }

  this.getColumn = async (columnLetter) => {
    const colIndex = columnLetter.charCodeAt(0) - 65;
    return this.data.map(row => [row[colIndex]]);
  }

  this.getRanges = async (ranges) => {
    return ranges.map(range => {
      if (range === '1:1') return [this.data[0]];
      if (range === 'B:C') return this.data.map(row => [row[1], row[2]]);
      return [];
    });
  }

  this.update = async (range, values) => {
    if (range === '1:1') {
      this.data[0] = values[0];
    } else {
      const col = range.match(/[A-Z]+/)[0].charCodeAt(0) - 65;
      const row = parseInt(range.match(/\d+/)[0]) - 1;
      if (!this.data[row]) {
        // Fill rows if they don't exist
        for (let i = this.data.length; i <= row; i++) {
          this.data[i] = [];
        }
      }
      this.data[row][col] = values[0][0];
    }
  }
}

describe(component.name, () => {
  describe('updateMetric', () => {
    it('should add a column if no column is found for that record type', async () => {
      const recordType = 'New Metric'
      const mockSheet = new MockSpreadsheet([
        ['Date', 'File Name', 'Run ID', 'Dry Run'], // Headers
        ['2026-05-20', 'test.csv', 'abcd1234', 'No'] // Existing Row
      ]);

      const response = await updateMetric(
        'test.csv',
        'abcd1234',
        false,
        recordType,
        1,
        mockSheet
      );

      assert.equal(response.error, undefined)
      assert.ok(
        String(response.warnings?.join("\n")).includes('No column found for'),
        'Expected a warning that no column was found for that record type'
      )
      assert.ok(response.insertedNewColumn)
      assert.equal(response.newCount, 1)
      assert.equal(mockSheet.data[0][4], recordType)
      assert.equal(mockSheet.data[1][4], 1)
    })

    it('should report an error if not given a Run ID (nor told to generate a new one)', async () => {
      const mockSheet = new MockSpreadsheet()
      const response = await updateMetric(
        'test.csv',
        '', // runID
        false,
        'ICJEs',
        1,
        mockSheet
      )

      assert.ok(
        String(response.error).includes('Run ID'),
        'Expected an error about the Run ID'
      )
    })

    it('should report an error if given a Record Type when generating a new row', async () => {
      const mockSheet = new MockSpreadsheet()
      const response = await updateMetric(
        'test.csv',
        'NEW',
        false,
        'ICJE Lines',
        1,
        mockSheet
      )

      const errorMessage = String(response.error)
      assert.ok(
        errorMessage.includes('Record Type') && errorMessage.includes('new'),
        'Expected an error about providing a Record Type when generating a new Run ID'
      )
    })

    it('should return an error if no row has the given File Name and Run ID', async () => {
      const mockSheet = new MockSpreadsheet([
        ['Date', 'File Name', 'Run ID', 'Dry Run', 'ICJE Lines'],
        ['2026-05-20', 'test.csv', 'abcd1234', 'No', '']
      ])
      const response = await updateMetric(
        'test.csv',
        'zzzzzzzz',
        false,
        'ICJE Lines',
        1,
        mockSheet
      )

      assert.ok(
        String(response.error).includes('No row found for'),
        'Expected an error that no row was found for that run id'
      )
    })

    it('should add a row (and use the Event ID as the actual Run ID) if given a Run ID of "NEW"', async () => {
      const mockSheet = new MockSpreadsheet([
        ['Date', 'File Name', 'Run ID', 'Dry Run']
      ])
      const exampleEventId = randomUUID()

      const response = await updateMetric(
        'test.csv',
        'NEW',
        false,
        '',
        1,
        mockSheet,
        exampleEventId
      )

      assert.equal(response.error, undefined)
      assert.ok(response.insertedNewRow)
      assert.equal(response.runID, exampleEventId)
      assert.notEqual(response.runID, 'NEW')
      assert.equal(response.newCount, undefined)
      assert.equal(mockSheet.data.length, 2)
      assert.equal(mockSheet.data[1][1], 'test.csv')
      assert.equal(mockSheet.data[1][2], exampleEventId)
    })

    it('should indicate that it was a dry run (when adding a new row during a dry run)', async () => {
      const mockSheet = new MockSpreadsheet([
        ['Date', 'File Name', 'Run ID', 'Dry Run']
      ])
      const exampleEventId = randomUUID()

      const response = await updateMetric(
        'test.csv',
        'NEW',
        true,
        '',
        1,
        mockSheet,
        exampleEventId
      )

      assert.equal(response.error, undefined)
      assert.ok(response.insertedNewRow)
      assert.equal(response.dryRun, 'Yes')
      assert.equal(mockSheet.data[1][3], 'Yes')
    })

    it('should indicate that it was not a dry run (when adding a new row during a non-dry-run)', async () => {
      const mockSheet = new MockSpreadsheet([
        ['Date', 'File Name', 'Run ID', 'Dry Run']
      ])
      const exampleEventId = randomUUID()

      const response = await updateMetric(
        'test.csv',
        'NEW',
        false,
        '',
        1,
        mockSheet,
        exampleEventId
      )

      assert.equal(response.error, undefined)
      assert.ok(response.insertedNewRow)
      assert.equal(response.dryRun, 'No')
      assert.equal(mockSheet.data[1][3], 'No')
    })

    it('should add a row and calculate a unique Run ID if given an existing Run ID when adding a row', async () => {
      const existingEventId = 'abcd1234'
      const mockSheet = new MockSpreadsheet([
        ['Date', 'File Name', 'Run ID', 'Dry Run'],
        ['2026-05-20', 'test.csv', existingEventId, 'No']
      ])

      const response = await updateMetric(
        'test.csv',
        'NEW',
        false,
        '',
        1,
        mockSheet,
        existingEventId
      )

      assert.equal(response.error, undefined)
      assert.ok(response.insertedNewRow)
      assert.ok(response.runID.startsWith(existingEventId))
      assert.notEqual(response.runID, existingEventId)
      assert.notEqual(response.runID, 'NEW')
      assert.equal(mockSheet.data.length, 3)
      assert.equal(mockSheet.data[2][2], response.runID)
    })

    it('should update the existing row if one matches the File Name and Run ID', async () => {
      const mockSheet = new MockSpreadsheet([
        ['Date', 'File Name', 'Run ID', 'Dry Run', 'ICJE Lines'],
        ['2026-05-20', 'test.csv', 'abcd1234', 'No', '5']
      ])

      const response = await updateMetric(
        'test.csv',
        'abcd1234',
        false,
        'ICJE Lines',
        1,
        mockSheet
      )

      assert.equal(response.error, undefined)
      assert.equal(response.insertedNewRow, false)
      assert.equal(response.runID, 'abcd1234')
      assert.equal(response.previousCount, 5)
      assert.equal(response.newCount, 6)
      assert.equal(mockSheet.data[1][4], 6)
    })

    it('should update by the specified amount', async () => {
      const mockSheet = new MockSpreadsheet([
        ['Date', 'File Name', 'Run ID', 'Dry Run', 'Invoice Lines'],
        ['2026-05-20', 'test.csv', 'abcd1234', 'No', '10']
      ])

      const response = await updateMetric(
        'test.csv',
        'abcd1234',
        false,
        'Invoice Lines',
        3,
        mockSheet
      )

      assert.equal(response.error, undefined)
      assert.equal(response.insertedNewRow, false)
      assert.equal(response.previousCount, 10)
      assert.equal(response.newCount, 13)
      assert.equal(mockSheet.data[1][4], 13)
    })
  })

  describe('run', () => {
    it('should gracefully handle any Errors thrown', async () => {
      component.google_service_account_key = 'NOT a valid JSON string, to trigger an error'

      const response = await component.run()

      console.debug(response)
      assert.notEqual(response.error, undefined)
    })

    it('should be able to update a real Google Sheet', async (testContext) => {
      const googleServiceAccountKey = process.env.TEST_GOOGLE_SERVICE_ACCOUNT_KEY
      const googleSheetId = process.env.TEST_GOOGLE_SHEET_ID
      if (!googleServiceAccountKey || !googleSheetId) {
        testContext.skip('Missing credentials for integration test')
        return
      }

      component.run_id = 'abcd1234'
      component.source_file_name = 'test.csv'
      component.record_type = 'Invoice Lines'
      component.number_of_items = 1
      component.google_sheet_id = googleSheetId
      component.google_service_account_key = googleServiceAccountKey

      const response = await component.run()
      assert.equal(response.error, undefined)
      assert.ok(response.newCount > response.previousCount)
    })
  })

  describe('calculateUniqueRunID', () => {
    it('should return the given Run ID if it is not in the list of existing Run IDs', async () => {
      const givenRunID = 'abcd1234'
      const existingRunIDs = []
      const result = calculateUniqueRunID(givenRunID, existingRunIDs)

      assert.equal(result, givenRunID)
    })

    it('should return a modified Run ID if the given one is in the list of existing Run IDs', async () => {
      const givenRunID = 'abcd1234'
      const existingRunIDs = ['abcd1234']

      const result = calculateUniqueRunID(givenRunID, existingRunIDs)

      assert.notEqual(result, givenRunID)
    })

    it('should return a unique Run ID even if the given one and what it would change it to are in the list of existing Run IDs', async () => {
      const givenRunID = 'abcd1234'
      const existingRunIDs = ['abcd1234']
      const nextRunID = calculateUniqueRunID(givenRunID, existingRunIDs)
      existingRunIDs.push(nextRunID)

      const result = calculateUniqueRunID(givenRunID, existingRunIDs)

      assert.notEqual(result, givenRunID)
      for (const existingRunID of existingRunIDs) {
        assert.notEqual(result, existingRunID)
      }
    })
  })
})
