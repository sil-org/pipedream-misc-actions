import AWS from 'aws-sdk@^2'

export default {
  name: "Send Email",
  description: "Send an email, with or without an attachment",
  key: "send_email",
  version: "0.1.1",
  type: "action",

  props: {
    amazon_ses: {
      type: "app",
      app: "amazon_ses",
    },
    to: {
      type: "string",
      label: "To Address"
    },
    from: {
      type: "string",
      label: "From Address"
    },
    subject: {
      type: "string",
      label: "Subject"
    },
    body: {
      type: "string",
      label: "Body"
    },
    attachmentFilename: {
      type: "string[]",
      label: "Attachment Filename",
      optional: true
    },
    attachmentContent: {
      type: "string[]",
      label: "Attachment Content",
      optional: true,
      default: [],
    },
    attachmentType: {
      type: "string[]",
      label: "Attachment Content Type",
      optional: true
    },
    attachmentEncoding: {
      type: "string",
      label: "Attachment Encoding",
      default: "BASE64",
      optional: true
    },
  },
  async run({ steps, $ }) {
    const { accessKeyId, secretAccessKey } = this.amazon_ses.$auth

    const ses = new AWS.SES({
      accessKeyId,
      secretAccessKey,
      region: 'us-east-1',
    })

    const boundary = "----=_Part_123456"

    const emailArray = [
      `From: ${this.from}`,
      `To: ${this.to}`,
      "Subject: " + this.subject,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      this.body,
      "",
      `--${boundary}`,
    ]

    const rawEmail = emailArray.concat(this.attachmentContent.flatMap((content, i) => {
      return [
        `Content-Type: ${this.attachmentType[i]}; charset=UTF-8`,
        `Content-Disposition: attachment; filename="${this.attachmentFilename[i]}"`,
        `Content-Transfer-Encoding: ${this.attachmentEncoding || "base64"}`,
        "",
        content,
        "",
        `--${boundary}--`,
      ]
    })).join("\n")

    const params = {
      RawMessage: { Data: Buffer.from(rawEmail) },
    }

    const result = await ses.sendRawEmail(params).promise()

    return result
  },
}
