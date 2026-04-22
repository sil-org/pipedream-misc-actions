import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  default: component,
} = await import('./is_dry_run.js')

describe(component.name, () => {
  it('should return true in dry-run mode', async () => {
    component.is_dry_run = true
    const returnValue = await component.run()
    assert.equal(returnValue, true)
  })

  it('should return false when not in dry-run mode', async () => {
    component.is_dry_run = false
    const returnValue = await component.run()
    assert.equal(returnValue, false)
  })
})
