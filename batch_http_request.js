export default defineComponent({
  name: "Batch HTTP Request",
  description: "Creates a HTTP Request for each point of data",
  key: "batch_http_request",
  version: "0.0.1",
  type: "action",

  props: {
    data: {
      type: "string[]",
      label: "Data",
    },
    http_request: {
      type: "http_request",
      label: "HTTP Request Configuration",
      description: "If needed, use ':id' to specify where to add the ID field in the URL",
      default: {
        method: "GET",
      },
    },
    id_field: {
      type: "string",
      label: "ID Field",
      description: "The ID field specified in the body of the requests to be made, used when updating records",
      optional: true
    },
    remove_id_field: {
      type: "boolean",
      label: "Remove ID Field",
      optional: true
    }
  },
  async run({ $ }) {
    const url = this.http_request.url
    let results = []
    for await(const data of this.data) {
      const element = JSON.parse(data)
      if (this.id_field) {
        this.http_request.url = url.replace(":id", element[this.id_field])
      }
      if (this.remove_id_field) {
        delete element[this.id_field]
      }

      this.http_request.body = element
      const resp = await this.http_request.execute()
      results = results.concat(resp)
    };

    await $.export(
      "$summary",
      `Successfully called ${this.http_request.method} ${url} ${this.data.length} times`
    );
    return results
  },
})
