import alasql from 'alasql@^4'
import Papa from 'papaparse@^5'

export default defineComponent({
  name: "SQL Query CSV",
  description: "Use a SQL query to get data from CSV data",
  key: "sql_query_csv",
  version: "0.0.2",
  type: "action",

  props: {
    csv_content: {
      type: "string",
      label: "CSV content",
      description: "The CSV content (string) to run the SQL query against"
    },
    csv_has_header: {
      type: "boolean",
      label: "CSV has header row?",
      description: "Whether the CSV data has a header row. If so, the data rows' data will be keyed on field names instead of indexes.",
      default: true,
    },
    csv_content_2: {
      type: "string",
      label: "CSV content (2nd)",
      description: "A 2nd CSV content (string) for the SQL query, such as for JOINs",
      optional: true,
      default: "",
    },
    csv_2_has_header: {
      type: "boolean",
      label: "CSV 2 has header row?",
      description: "Whether the 2nd CSV data has a header row.",
      optional: true,
      default: true,
    },
    sql_query: {
      type: "string",
      label: "SQL query",
      description: "The SQL query to run against the provided CSV data. Use a question mark (?) for the table name.",
    },
  },
  async run({ steps, $ }) {
    let csvDataForQuery = []

    const csvParseResults = Papa.parse(
      this.csv_content,
      {
        header: this.csv_has_header,
        skipEmptyLines: true,
      }
    )

    if (csvParseResults.errors?.length > 0) {
      return {
        errors: csvParseResults.errors,
      }
    }
    csvDataForQuery.push(csvParseResults.data)

    if (this.csv_content_2) {
      const csv2ParseResults = Papa.parse(
        this.csv_content_2,
        {
          header: this.csv_2_has_header,
          skipEmptyLines: true,
        }
      )

      if (csv2ParseResults.errors?.length > 0) {
        return {
          errors: csv2ParseResults.errors,
        }
      }
      csvDataForQuery.push(csv2ParseResults.data)
    }

    const rows = alasql(
      this.sql_query,
      csvDataForQuery
    )
    return { rows }
  },
})
