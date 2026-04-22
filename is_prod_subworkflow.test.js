import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  default: component,
} = await import('./is_prod_subworkflow.js')

describe(component.name, () => {
  it('should return not-prod if in build mode, even with production header', async () => {
    const headers = { 'x-is-production': 'true' }
    const context = { 'test': true } // `test: true` means build mode.

    const returnValue = await component.run({
      steps: { trigger: { event: { headers } } },
      $: { context }
    })

    assert.equal(returnValue, false)
  })

  it('should return not-prod if lacking production header, even if not in build mode', async () => {
    const headers = { 'user-agent': 'dummy-value' }
    const context = { 'test': false } // `test: false` means not in build mode.

    const returnValue = await component.run({
      steps: { trigger: { event: { headers } } },
      $: { context }
    })

    assert.equal(returnValue, false)
  })

  it('should return prod if given production header and not in build mode', async () => {
    const headers = { 'x-is-production': 'true' }
    const context = { 'test': false } // `test: false` means not in build mode.

    const returnValue = await component.run({
      steps: { trigger: { event: { headers } } },
      $: { context }
    })

    assert.equal(returnValue, true)
  })

  it('should throw an error if not given any headers', async () => {
    const headers = {}
    const context = { 'test': false } // `test: false` means not in build mode.

    let errorThrown
    try {
      const returnValue = await component.run({
        steps: { trigger: { event: { headers } } },
        $: { context }
      })
    } catch (error) {
      errorThrown = error
      console.log('Correctly threw an error when given no headers:', error)
    }

    assert.notEqual(
      errorThrown,
      undefined,
      'Failed to throw an error when given no headers'
    )
  })
})
