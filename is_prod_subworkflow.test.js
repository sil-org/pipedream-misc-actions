import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  default: component,
} = await import('./is_prod_subworkflow.js')

describe(component.name, () => {
  it('should return not-prod if in build mode', async () => {
    const headers = { 'user-agent': 'dummy-value' }
    const context = { 'test': true } // `test: true` means build mode.

    const returnValue = await component.run({
      steps: { trigger: { event: { headers } } },
      $: { context }
    })

    assert.equal(returnValue, false)
  })
})
