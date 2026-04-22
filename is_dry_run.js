export default {
  name: "Is Dry Run?",
  description: "Toggle whether to run this workflow as a dry-run",
  key: "is-dry-run",
  version: "0.1.0",
  type: "action",

  props: {
    is_dry_run: {
      label: "Is dry run?",
      description: "A toggle for whether to do a dry-run. Use the output of this in any steps you want to act differently in dry-run mode.",
      type: "boolean",
    }
  },

  async run() {
    console.log('Is dry run?', this.is_dry_run)
    return this.is_dry_run
  },
}
