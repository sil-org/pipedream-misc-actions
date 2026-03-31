export default {
  name: "Update Metric (Google Sheet)",
  description: "Increment the counter for how many records of a given type were processed, in a Google Sheet",
  key: "update_metric_in_google_sheet",
  version: "0.1.0",
  type: "action",

  props: {
    source_file_name: {
      type: "string",
      label: "File Name",
      description: "The name of the file being processed"
    },
  },
  async run({ steps, $ }) {
    return await updateMetric(
      this.source_file_name,
    )
  },
}

const updateMetric = async (sourceFileName) => {
  const insertedNewRow = false

  // ... do stuff

  return {
    insertedNewRow,
  }
}

export {
  updateMetric,
}
