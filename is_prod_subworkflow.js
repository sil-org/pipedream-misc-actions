import assert from 'node:assert/strict'

export default {
  name: "Is Production? (Sub-workflows)",
  description: "Safely determine whether we should run in production or develop mode.",
  key: "is-prod-subworkflow",
  version: "0.1.0",
  type: "action",

  async run({ steps, $ }) {
    const headers = steps?.trigger?.event?.headers || {}
    if (Object.keys(headers).length === 0) {
      console.log('No headers given. Was `steps` undefined? `steps`:', steps)
      throw new Error('No headers received. Unable to determine whether this is a production run.')
    }
    const headerSaysIsProduction = String(headers['x-is-production']).trim().toLowerCase() === 'true'
    console.log('(headerSaysIsProduction)', headerSaysIsProduction)

    const isInBuildMode = $.context.test
    console.log('(isInBuildMode)', isInBuildMode)

    const isProduction = headerSaysIsProduction && !isInBuildMode
    console.log('isProduction', isProduction)

    return isProduction
  },
}
