export default {
  name: "Is Production? (Dispatcher)",
  description: "Determine whether this dispatcher workflow should run in production or develop mode.",
  key: "is-prod-dispatcher",
  version: "0.1.0",
  type: "action",

  props: {
    was_prod_trigger: {
      type: "boolean",
      label: "Was the PROD trigger?",
      description: "A custom expression that indicates whether the PROD or the DEV trigger caused this run",
    }
  },

  async run({ $ }) {
    console.log('(Was the prod trigger?)', this.was_prod_trigger)

    const isInBuildMode = $.context.test
    console.log('(isInBuildMode)', isInBuildMode)

    const isProduction = this.was_prod_trigger && !isInBuildMode
    console.log('isProduction', isProduction)

    return isProduction
  },
}
