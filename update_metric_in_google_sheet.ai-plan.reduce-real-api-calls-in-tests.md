### Revised Plan for Refactoring Tests in `update_metric_in_google_sheet.test.js`

This revised plan incorporates a `MockSpreadsheet` class to allow for fast, reliable unit testing of the core logic, while maintaining the environment-dependent integration tests to ensure real-world compatibility with the Google Sheets API.

#### 1. Define a `MockSpreadsheet` Class
Add a `MockSpreadsheet` class to the test file. This class will simulate the `SpreadsheetInterface` in-memory.

```javascript
class MockSpreadsheet {
  constructor(initialData = [[]]) {
    this.data = initialData; // 2D array: this.data[row][col]
  }

  async appendRow(cellValues) {
    this.data.push(cellValues);
  }

  async getCell(cellIdentifier) {
    // Basic 'A1' notation parser for the mock
    const col = cellIdentifier.match(/[A-Z]+/)[0].charCodeAt(0) - 65;
    const row = parseInt(cellIdentifier.match(/\d+/)[0]) - 1;
    return (this.data[row] && this.data[row][col]) || '';
  }

  async getColumn(columnLetter) {
    const colIndex = columnLetter.charCodeAt(0) - 65;
    return this.data.map(row => [row[colIndex]]);
  }

  async getRanges(ranges) {
    return ranges.map(range => {
      if (range === '1:1') return [this.data[0]];
      if (range === 'B:C') return this.data.map(row => [row[1], row[2]]);
      return [];
    });
  }

  async update(range, values) {
    if (range === '1:1') {
      this.data[0] = values[0];
    } else {
      const col = range.match(/[A-Z]+/)[0].charCodeAt(0) - 65;
      const row = parseInt(range.match(/\d+/)[0]) - 1;
      if (!this.data[row]) this.data[row] = [];
      this.data[row][col] = values[0][0];
    }
  }
}
```

#### 2. Import `updateMetric` Directly
Update the imports to access the internal `updateMetric` function, allowing tests to bypass the `component.run()` wrapper when using the mock.

```javascript
const {
  default: component,
  updateMetric,
  calculateUniqueRunID,
} = await import('./update_metric_in_google_sheet.js');
```

#### 3. Transition Logic Tests to Unit Tests (using `MockSpreadsheet`)
Refactor most test cases (validation, column addition logic, unique ID calculation) to use `updateMetric` and `MockSpreadsheet`. These tests will run instantly and won't require credentials.

**Example Unit Test:**
```javascript
it('should add a column if no column is found for that record type', async () => {
  const mockSheet = new MockSpreadsheet([
    ['Date', 'File Name', 'Run ID', 'Dry Run'], // Headers
    ['2026-05-20', 'test.csv', 'abcd1234', 'No'] // Existing Row
  ]);

  const response = await updateMetric(
    'test.csv', 'abcd1234', false, 'New Metric', 1, mockSheet
  );

  assert.equal(response.insertedNewColumn, true);
  assert.equal(mockSheet.data[0][4], 'New Metric'); // New header added
});
```

#### 4. Retain "True Integration Tests"
Keep the existing environment variable checks and at least one test case that uses `component.run()` with the real `GoogleSheet` adapter. This ensures that the code still works with the actual Google API.

*   **Keep**: `loadEnvFile('.env')`.
*   **Keep**: The `if (!googleServiceAccountKey) testContext.skip(...)` logic.
*   **Keep**: One test, such as `'should update by the specified amount'`, as a full integration test.

```javascript
it('INTEGRATION: should update the real Google Sheet', async (testContext) => {
  const googleServiceAccountKey = process.env.TEST_GOOGLE_SERVICE_ACCOUNT_KEY;
  const googleSheetId = process.env.TEST_GOOGLE_SHEET_ID;
  if (!googleServiceAccountKey || !googleSheetId) {
    testContext.skip('Missing credentials for integration test');
    return;
  }
  
  // Use component.run() to exercise the real GoogleSheet adapter
  component.run_id = 'abcd1234';
  component.source_file_name = 'test.csv';
  component.record_type = 'Invoice Lines';
  component.number_of_items = 1;
  component.google_sheet_id = googleSheetId;
  component.google_service_account_key = googleServiceAccountKey;

  const response = await component.run();
  assert.equal(response.error, undefined);
  assert.ok(response.newCount > response.previousCount);
});
```

#### 5. Benefits of this Approach
*   **Speed**: 90% of tests will run in milliseconds without network I/O.
*   **Reliability**: Logic tests won't fail due to Google API quotas or intermittent connectivity.
*   **Safety**: One true integration test remains to verify that the `googleapis` library integration and authentication flow are still functioning correctly.
*   **Environment Flexibility**: Developers without access to the test spreadsheet can still run the unit tests locally.