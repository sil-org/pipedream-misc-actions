import assert from 'node:assert/strict'
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

const { default: component } = await import('./update_metric_in_google_sheet.js')

describe(component.name, () => {
  it('should report an error if no column is found for that record type', async (testContext) => {
    const googleServiceAccountKey = process.env.TEST_GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
      return
    }
    const googleSheetId = process.env.TEST_GOOGLE_SHEET_ID
    assert.ok(googleSheetId, 'No GOOGLE_SHEET_ID provided')

    component.run_id = 'abcd1234'
    component.source_file_name = 'test.csv'
    component.record_type = 'bad'
    component.google_sheet_id = googleSheetId
    component.google_service_account_key = googleServiceAccountKey

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.debug(response)
    assert.ok(
      String(response.error).includes('No column found for'),
      'Expected an error that no column was found for that record type'
    )
  })

  it('should report an error if not given a Run ID (nor told to generate a new one)', async (testContext) => {
    const googleServiceAccountKey = process.env.TEST_GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
      return
    }
    const googleSheetId = process.env.TEST_GOOGLE_SHEET_ID
    assert.ok(googleSheetId, 'No GOOGLE_SHEET_ID provided')

    component.run_id = ''
    component.source_file_name = 'test.csv'
    component.record_type = 'ICJEs'
    component.google_sheet_id = googleSheetId
    component.google_service_account_key = googleServiceAccountKey

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.debug(response)
    assert.ok(
      String(response.error).includes('Run ID'),
      'Expected an error about the Run ID'
    )
  })

  it('should report an error if given a Record Type when generating a new row', async (testContext) => {
    const googleServiceAccountKey = process.env.TEST_GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
      return
    }
    const googleSheetId = process.env.TEST_GOOGLE_SHEET_ID
    assert.ok(googleSheetId, 'No GOOGLE_SHEET_ID provided')

    component.run_id = 'NEW'
    component.source_file_name = 'test.csv'
    component.record_type = 'ICJEs'
    component.google_sheet_id = googleSheetId
    component.google_service_account_key = googleServiceAccountKey

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.debug(response)
    const errorMessage = String(response.error)
    assert.ok(
      errorMessage.includes('Record Type') && errorMessage.includes('new'),
      'Expected an error about providing a Record Type when generating a new Run ID'
    )
  })

  it('should return an error if no row has the given the File Name and Run ID', async (testContext) => {
    const googleServiceAccountKey = process.env.TEST_GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
      return
    }
    const googleSheetId = process.env.TEST_GOOGLE_SHEET_ID
    assert.ok(googleSheetId, 'No GOOGLE_SHEET_ID provided')

    component.run_id = 'zzzzzzzz'
    component.source_file_name = 'test.csv'
    component.record_type = 'ICJEs'
    component.google_sheet_id = googleSheetId
    component.google_service_account_key = googleServiceAccountKey

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.debug(response)
    assert.ok(
      String(response.error).includes('No row found for'),
      'Expected an error that no row was found for that run id'
    )
  })

  it('should add a row (and use the event.id prefix as the actual Run ID) if given a Run ID of "NEW"', async (testContext) => {
    const googleServiceAccountKey = process.env.TEST_GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
      return
    }
    const googleSheetId = process.env.TEST_GOOGLE_SHEET_ID
    assert.ok(googleSheetId, 'No GOOGLE_SHEET_ID provided')

    component.run_id = 'NEW'
    component.source_file_name = 'test.csv'
    component.record_type = ''
    component.google_sheet_id = googleSheetId
    component.google_service_account_key = googleServiceAccountKey

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.debug(response)
    assert.equal(response.error, undefined)
    assert.ok(response.insertedNewRow)
    assert.ok(response.runID)
    assert.notEqual(response.runID, 'NEW')
    assert.equal(response.newCount, undefined)
  })

  it('should update the existing row if one matches the File Name and Run ID', async (testContext) => {
    const googleServiceAccountKey = process.env.TEST_GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
      return
    }
    const googleSheetId = process.env.TEST_GOOGLE_SHEET_ID
    assert.ok(googleSheetId, 'No GOOGLE_SHEET_ID provided')

    component.run_id = 'abcd1234'
    component.source_file_name = 'test.csv'
    component.record_type = 'ICJEs'
    component.google_sheet_id = googleSheetId
    component.google_service_account_key = googleServiceAccountKey

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.debug(response)
    assert.equal(response.error, undefined)
    assert.equal(response.insertedNewRow, false)
    assert.equal(response.runID, component.run_id)
    assert.ok(response.newCount > 0)
  })
})
