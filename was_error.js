export default {
  name: "Was Error?",
  description: "Enables combining multiple error checks into a single output",
  key: "was_error",
  version: "0.0.2",
  type: "action",

  props: {
    errors: {
      type: "boolean[]",
      description: "The error conditions you want to check. Truthy inputs will be treated as `true`. See https://developer.mozilla.org/en-US/docs/Glossary/Truthy for details.",
    }
  },

  async run() {
    const booleanValues = this.errors.map(value => Boolean(value))
    return booleanValues.includes(true)
  },
}
