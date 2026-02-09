import alasql from 'alasql@^4'
import Papa from 'papaparse@^5'

export default defineComponent({
  name: "SQL Query CSV",
  description: "Use a SQL query to get data from CSV data",
  key: "sql_query_csv",
  version: "0.1.0",
  type: "action",

  props: {
    csv_inputs: {
      type: "[]string",
      label: "CSV inputs",
      description: "The CSV data to use in the SQL Query (one for each `?` in query)"
    },
    csv_inputs_have_header: {
      type: "[]boolean",
      label: "CSV inputs have header row?",
      description: "Whether the CSV data inputs have header rows (one boolean per CSV input). If so, the data rows' data will be keyed on field names instead of indexes.",
      default: true,
    },
    sql_query: {
      type: "string",
      label: "SQL query",
      description: "The SQL query to run against the provided CSV data. Use a question mark (?) for where you want to use each CSV input (e.g as the table name), in order.",
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
