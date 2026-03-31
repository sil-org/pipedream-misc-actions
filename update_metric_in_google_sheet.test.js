import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

const mockGoogle = {
  auth: {
    GoogleAuth: class {
      constructor() {
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
`), pathToFileURL('./'))

globalThis.__googleMock = mockGoogle

const { default: component } = await import('./update_metric_in_google_sheet.js')

describe.only(component.name, () => {
  before(() => {
    globalThis.__googleSheetsGetCalls = []
    globalThis.__googleSheetsMockValues = []
  })

  it('should add a row if none matches the filename', async () => {
    component.source_file_name = 'test.csv'
    component.google_sheet_id = 'sheet123'
    component.google_service_account_key = JSON.stringify({ project_id: 'test' })

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
  })

  it('should NOT add a row if one matches the filename', async () => {
    component.source_file_name = 'test.csv'
    component.google_sheet_id = 'sheet123'
    component.google_service_account_key = JSON.stringify({ project_id: 'test' })

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
  })
})
