import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  default: component,
} = await import('./is_prod_dispatcher.js')

describe(component.name, () => {
  it('should return false if not triggered by the prod trigger, even not in build mode', async () => {
    component.was_prod_trigger = false
    const context = { 'test': false } // `test: false` means not in build mode.

    const returnValue = await component.run({
      $: { context }
    })

    assert.equal(returnValue, false)
  })

  it('should return false if triggered by the prod trigger while in build mode', async () => {
    component.was_prod_trigger = true
    const context = { 'test': true } // `test: true` means in build mode.

    const returnValue = await component.run({
      $: { context }
    })

    assert.equal(returnValue, false)
  })

  it('should return true if triggered by the prod trigger and not in build mode', async () => {
    component.was_prod_trigger = true
    const context = { 'test': false } // `test: false` means not in build mode.

    const returnValue = await component.run({
      $: { context }
    })

    assert.equal(returnValue, true)
  })
})
