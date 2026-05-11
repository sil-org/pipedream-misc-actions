import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  default: component,
} = await import('./is_dry_run.js')

describe(component.name, () => {
  it('should return dry-run as appropriate, based on the inputs', async () => {
    const testCases = [
      { isProd: true, isDevDryRun: true, isProdDryRun: true, expected: true },
      { isProd: true, isDevDryRun: true, isProdDryRun: false, expected: false },
      { isProd: true, isDevDryRun: false, isProdDryRun: true, expected: true },
      { isProd: true, isDevDryRun: false, isProdDryRun: false, expected: false },
      { isProd: false, isDevDryRun: true, isProdDryRun: true, expected: true },
      { isProd: false, isDevDryRun: true, isProdDryRun: false, expected: true },
      { isProd: false, isDevDryRun: false, isProdDryRun: true, expected: false },
      { isProd: false, isDevDryRun: false, isProdDryRun: false, expected: false },
    ]
    for (const { isProd, isDevDryRun, isProdDryRun, expected } of testCases) {
      component.is_prod = isProd
      component.is_dev_dry_run = isDevDryRun
      component.is_prod_dry_run = isProdDryRun

      const returnValue = await component.run()

      assert.equal(returnValue, expected)
    }
  })
})
