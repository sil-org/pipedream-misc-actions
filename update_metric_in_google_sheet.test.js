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

describe.only(component.name, () => {
  it.only('should report an error if no column is found for that record type', async (testContext) => {
    const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
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

    assert.ok(
      response.error !== undefined,
      'Expected an error, but none returned'
    )
  })

  it.only('should add a row if none matches the filename', async (testContext) => {
    const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
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

    if (response.error) {
       console.log("Response error in test:", response.error)
    }

    assert.ok(response.insertedNewRow)
    assert.equal(response.error, undefined)
  })

  it.only('should update the existing row if one matches the filename', async (testContext) => {
    const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!googleServiceAccountKey) {
      testContext.skip('Lacking GOOGLE_SERVICE_ACCOUNT_KEY, skipping test')
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

    assert.equal(response.insertedNewRow, false)
    assert.equal(response.error, undefined)
  })
})
