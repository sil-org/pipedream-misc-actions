export default {
  name: "Was Error?",
  description: "Enables combining multiple error checks into a single output",
  key: "was_error",
  version: "0.0.2",
  type: "action",

  props: {
    errors: {
      type: "boolean[]",
    }
  },

  async run() {
    const booleanValues = this.errors.map(value => Boolean(value))
    return booleanValues.includes(true)
  },
}
