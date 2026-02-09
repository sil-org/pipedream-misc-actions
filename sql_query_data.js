import alasql from 'alasql@^4'

export default {
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
    const rows = alasql(
      this.sql_query,
      this.data_inputs,
    )
    return { rows }
  },
}
