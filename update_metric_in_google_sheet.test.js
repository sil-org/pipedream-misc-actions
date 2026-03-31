import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

const mockGoogle = {
  auth: {
    GoogleAuth: class {
      constructor() {
      }
      async getClient() {
        return {}
      }
    }
  },
  sheets: () => ({
    spreadsheets: {
      values: {
        get: async ({ spreadsheetId, range }) => {
          globalThis.__googleSheetsGetCalls = globalThis.__googleSheetsGetCalls || []
          globalThis.__googleSheetsGetCalls.push({ spreadsheetId, range })
          return {
            data: {
              values: globalThis.__googleSheetsMockValues || []
            }
          }
        },
        append: async ({ spreadsheetId, range, valueInputOption, resource }) => {
          globalThis.__googleSheetsAppendCalls = globalThis.__googleSheetsAppendCalls || []
          globalThis.__googleSheetsAppendCalls.push({ spreadsheetId, range, valueInputOption, resource })
          return {
            data: {}
          }
        }
      }
    }
  })
}

// Register a loader to mock googleapis
register('data:text/javascript,' + encodeURIComponent(`
  export async function resolve(specifier, context, defaultResolve) {
    if (specifier === 'googleapis') {
      return {
        url: 'data:text/javascript,' + encodeURIComponent('export const google = globalThis.__googleMock;'),
        shortCircuit: true
      };
    }
    return defaultResolve(specifier, context, defaultResolve);
  }
`), pathToFileURL('./update_metric_in_google_sheet.js'))

globalThis.__googleMock = mockGoogle

const { default: component } = await import('./update_metric_in_google_sheet.js')

describe.only(component.name, () => {
  beforeEach(() => {
    globalThis.__googleSheetsGetCalls = []
    globalThis.__googleSheetsAppendCalls = []
    globalThis.__googleSheetsMockValues = []
  })

  it.only('should add a row if none matches the filename', async () => {
    component.source_file_name = 'test.csv'
    component.google_sheet_id = 'sheet123'
    component.google_service_account_key = JSON.stringify({ project_id: 'test', client_email: 'test@example.com', private_key: 'test' })

    globalThis.__googleSheetsMockValues = [
      ['other.csv'],
      ['another.csv']
    ]

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    assert.ok(response.insertedNewRow)
    assert.equal(globalThis.__googleSheetsGetCalls[0].spreadsheetId, 'sheet123')
    assert.equal(globalThis.__googleSheetsGetCalls[0].range, 'A:A')

    assert.equal(globalThis.__googleSheetsAppendCalls.length, 1)
    assert.equal(globalThis.__googleSheetsAppendCalls[0].spreadsheetId, 'sheet123')
    assert.equal(globalThis.__googleSheetsAppendCalls[0].range, 'A:A')
    assert.equal(globalThis.__googleSheetsAppendCalls[0].valueInputOption, 'USER_ENTERED')
    assert.deepEqual(globalThis.__googleSheetsAppendCalls[0].resource.values, [['test.csv', 1]])
  })

  it('should NOT add a row if one matches the filename', async () => {
    component.source_file_name = 'test.csv'
    component.google_sheet_id = 'sheet123'
    component.google_service_account_key = JSON.stringify({ project_id: 'test', client_email: 'test@example.com', private_key: 'test' })

    globalThis.__googleSheetsMockValues = [
      ['other.csv'],
      ['test.csv'],
      ['another.csv']
    ]

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    assert.strictEqual(response.insertedNewRow, false)
    assert.equal(globalThis.__googleSheetsAppendCalls.length, 0)
  })
})
