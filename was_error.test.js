import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  default: component,
} = await import('./was_error.js')

describe(component.name, () => {
  it('should return true if any given error is true', async () => {
    component.errors = [
      false,
      true,
      false,
    ]
    const returnValue = await component.run()
    assert.equal(returnValue, true)
  })

  it('should return false when no given error is true', async () => {
    component.errors = [
      false,
      false,
      false,
    ]
    const returnValue = await component.run()
    assert.equal(returnValue, false)
  })

  it('should handle non-boolean truthy values correctly', async () => {
    const truthyNonBooleanValues = [
      'asdf',
      ['a'],
      [],
      2,
    ]
    for (const truthyNonBooleanValue of truthyNonBooleanValues) {
      component.errors = [truthyNonBooleanValue]
      const returnValue = await component.run()
      assert.equal(
        returnValue,
        true,
        `Failed to treat ${JSON.stringify(truthyNonBooleanValue)} as true.`
      )
    }
  })

  it('should handle non-boolean falsy values correctly', async () => {
    // For details about "falsy" see the docs:
    // https://developer.mozilla.org/en-US/docs/Glossary/Falsy
    const falsyNonBooleanValues = [
      null,
      undefined,
      NaN,
      0,
      '',
    ]
    for (const falsyNonBooleanValue of falsyNonBooleanValues) {
      component.errors = [falsyNonBooleanValue]
      const returnValue = await component.run()
      assert.equal(
        returnValue,
        false,
        `Failed to treat ${JSON.stringify(falsyNonBooleanValue)} as false.`
      )
    }
  })
})
