import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { default: component } = await import('./update_metric_in_google_sheet.js')

describe.only(component.name, () => {
  it('should add a row if none matches the filename', async () => {
    component.file_name = Math.random() + '.csv'

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    assert.ok(response.insertedNewRow)
  })
})
