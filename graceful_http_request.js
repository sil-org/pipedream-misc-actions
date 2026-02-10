export default {
  name: "Graceful HTTP Request",
  description: "Creates a HTTP Request with graceful error handling",
  key: "graceful_http_request",
  version: "0.0.2",
  type: "action",

  props: {
    http_request: {
      type: "http_request",
      label: "HTTP Request Configuration",
      default: {
        method: "GET",
      },
    },
    retries: {
      type: "integer",
      label: "Number of retries on failure",
      optional: true,
      min: 0,
      default: 0
    }
  },
  async run({ $ }) {
    const errors = [];
    for (let i = 0; i <= this.retries; i++) {
      try {
        return await this.http_request.execute();
      } catch (err) {
        errors.push({message: err.message, code: err.response?.status, data: err.response?.data});
      }
    }

    return {errors}
  }
}
