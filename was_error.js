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
    return this.errors.includes(true)
  },
}
