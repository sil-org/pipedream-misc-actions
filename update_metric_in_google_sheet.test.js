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
    const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
      return
    }
    const googleSheetId = process.env.GOOGLE_SHEET_ID
    assert.ok(googleSheetId, 'No GOOGLE_SHEET_ID provided')

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
      response.error !== undefined,
      'Expected an error, but none returned'
    )
  })

  it('should add a row if none matches the filename', async (testContext) => {
    const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
      return
    }
    const googleSheetId = process.env.GOOGLE_SHEET_ID
    assert.ok(googleSheetId, 'No GOOGLE_SHEET_ID provided')

    component.source_file_name = 'TEST_' + Date.now() + '.csv'
    component.record_type = 'ICJEs'
    component.google_sheet_id = googleSheetId
    component.google_service_account_key = googleServiceAccountKey

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.debug(response)
    assert.ok(response.insertedNewRow)
    assert.equal(response.newCount, 1)
    assert.equal(response.error, undefined)
  })

  it('should update the existing row if one matches the filename', async (testContext) => {
    const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
      return
    }
    const googleSheetId = process.env.GOOGLE_SHEET_ID
    assert.ok(googleSheetId, 'No GOOGLE_SHEET_ID provided')

    component.source_file_name = 'test.csv'
    component.record_type = 'ICJEs'
    component.google_sheet_id = googleSheetId
    component.google_service_account_key = googleServiceAccountKey

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.debug(response)
    assert.equal(response.insertedNewRow, false)
    assert.ok(response.newCount > 0)
    assert.equal(response.error, undefined)
  })
})
