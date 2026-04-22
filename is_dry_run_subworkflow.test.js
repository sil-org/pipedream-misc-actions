import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  default: component,
} = await import('./is_dry_run_subworkflow.js')

describe(component.name, () => {
  it('should return true if header says it is a dry run', async () => {
    component.headers = { 'x-is-dry-run': 'true' }
    const returnValue = await component.run()
    assert.equal(returnValue, true)
  })

  it('should return false if header says it is not a dry run', async () => {
    component.headers = { 'x-is-dry-run': 'false' }
    const returnValue = await component.run()
    assert.equal(returnValue, false)
  })

  it('should return false if header is absent', async () => {
    component.headers = {}
    const returnValue = await component.run()
    assert.equal(returnValue, false)
  })
})
