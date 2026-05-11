export default {
  name: "Is Dry Run? (Dispatcher)",
  description: "Toggle whether to run this workflow as a dry-run. Use the output of this in any steps you want to have act differently in dry-run mode.",
  key: "is-dry-run",
  version: "0.2.0",
  type: "action",

  props: {
    is_prod: {
      label: "Is production?",
      description: "Whether the workflow is running in production or development mode. This should usually be the output of an 'Is Production?' step.",
      type: "boolean",
    },
    is_dev_dry_run: {
      label: "Use dry-run for DEV?",
      description: "Toggle for whether DEV runs should be in dry-run mode.",
      type: "boolean",
    },
    is_prod_dry_run: {
      label: "Use dry-run for PROD?",
      description: "Toggle for whether PROD runs should be in dry-run mode.",
      type: "boolean",
    }
  },

  async run() {
    const isDryRun = this.is_prod ? this.is_prod_dry_run : this.is_dev_dry_run
    console.log('Is production?', this.is_prod)
    console.log('Is dry run?', isDryRun)
    return isDryRun
  },
}
