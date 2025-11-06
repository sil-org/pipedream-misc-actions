export default defineComponent({
  name: "Paginated Request",
  description: "Creates a HTTP Request until end of paginated data or timeout is reached",
  key: "paginated_request",
  version: "0.0.1",
  type: "action",

  props: {
    http_request: {
      type: "http_request",
      label: "HTTP Request Configuration",
      default: {
        method: "GET",
      },
    },
    paginator: {
      type: "string",
      label: "Name of the Pagination Parameter",
    },
    pagination_type: {
      type: "string",
      label: "Pagination Type",
      options: [
        "Page",
        "Offset",
      ],
      default: "Page",
    },
    data_field: {
      type: "string",
      label: "Data Field in Response",
      description: "The name of the data field in the response. If subfields are necessary, it is split by a period. For example: 'data' or 'data.results'",
      default: "data",
      optional: true
    },
    timeout: {
      type: "integer",
      label: "Time in Seconds to Timeout",
      min: 0,
      optional: true,
    },
    timeout_error: {
      type: "boolean",
      label: "Throw Error on Timeout",
      optional: true,
    }
  },
  methods: {
    get_pagination_index() {
      for (const key in this.http_request.params) {
        if (this.http_request.params[key].name == this.paginator) {
          return key
        }
      }
      return null
    },
    get_response_data(resp) {
      let data = resp
      for (const field of this.data_field.split(".")) {
        data = data[field]
      }
      return data
    },
    handle_timeout(start) {
      const duration = Date.now() - start
      if (this.timeout && duration > this.timeout * 1000) {
        const msg = `Timeout reached at ${duration / 1000} seconds`
        if (this.timeout_error) {
          throw new Error(msg)
        }
        console.error(msg)
        return true
      }
      return false
    }
  },
  async run({ $ }) {
    const i = await this.get_pagination_index()
    if (i === null) {
      throw new Error("Pagination parameter not set")
    }

    const start = Date.now()
    const results = []
    let data = []
    let count = 1
    do {
      const resp = await this.http_request.execute()
      data = await this.get_response_data(resp)

      if (!Array.isArray(data)) {
        throw new Error(`Response data is not an array: ${typeof data}`);
      }

      const increment = (this.pagination_type === "Offset") ? data.length : 1
      const new_value = increment + Number(this.http_request.params[i].value)
      this.http_request.params[i].value = new_value.toString()

      results.push(...data)

      if (await this.handle_timeout(start)) {
        break
      }
      count++
    } while (data.length > 0)

    $.export(
      "$summary",
      `Successfully called ${this.http_request.method} ${this.http_request.url} ${count} times`
    );
    return results
  },
})
