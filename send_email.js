import nodemailer from "nodemailer"
import sesClientModule from '@aws-sdk/client-ses'

export default {
  name: "Send Email",
  description: "Send an email, with or without an attachment",
  key: "send_email",
  version: "1.0.0",
  type: "action",

  props: {
    amazon_ses: {
      type: "app",
      app: "amazon_ses",
    },
    to: {
      type: "string",
      label: "To Addresses",
      description: "Comma-separated list of email addresses for the To email header."
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
      label: "Body",
      description: "Plain-text message body."
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
    skip: {
      type: "boolean",
      label: "Skip",
      description: "Set Skip to TRUE or an expression that evaluates to true to skip this step.",
      default: false,
      optional: true,
    }
  },
  async run({ steps, $ }) {
    if (this.skip) {
      $.export("$summary", `Skipped`)
      return {}
    }

    const { accessKeyId, secretAccessKey } = this.amazon_ses.$auth

    const ses = new sesClientModule.SESClient({
      accessKeyId,
      secretAccessKey,
      region: 'us-east-1',
    })

    const transporter = nodemailer.createTransport({
      SES: { ses, aws: sesClientModule },
    })

    return await transporter.sendMail({
        from: this.from,
        to: this.to,
        subject: this.subject,
        text: this.body,
        attachments: [{
          content: this.attachmentContent,
          encoding: this.attachmentEncoding,
          filename: this.attachmentFilename,
          contentType: this.attachmentType,
        }],
      },
    )
  },
}
