import alasql from 'alasql@^4'
import Papa from 'papaparse@^5'

export default defineComponent({
  name: "SQL Query Data",
  description: "Use a SQL query to get data from the given sets of data",
  key: "sql_query_data",
  version: "0.1.0",
  type: "action",

  props: {
    data_inputs: {
      type: "any[]",
      label: "Data inputs",
      description: "The data to use in the SQL Query (one for each `?` in query)"
    },
    sql_query: {
      type: "string",
      label: "SQL query",
      description: "The SQL query to run against the provided data. Use a question mark (?) for where you want to use each data input (e.g as the table name), in order.",
    },
  },
  async run({ steps, $ }) {
    let csvDataForQuery = []

    for (let i = 0; i < this.csv_inputs.length; i++) {
      const csvParseResults = Papa.parse(
        this.csv_inputs[i],
        {
          header: this.csv_inputs_have_header[i],
          skipEmptyLines: true,
        }
      )

      if (csvParseResults.errors?.length > 0) {
        return {
          errors: csvParseResults.errors,
        }
      }
      csvDataForQuery.push(csvParseResults.data)
    }

    const rows = alasql(
      this.sql_query,
      csvDataForQuery
    )
    return { rows }
  },
})
