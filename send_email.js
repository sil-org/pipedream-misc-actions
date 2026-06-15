import nodemailer from "nodemailer"
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"

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

    const sesClient = new SESv2Client({
      region: "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    const transporter = nodemailer.createTransport({
      SES: { sesClient, SendEmailCommand },
    })

    const mail = {
      from: this.from,
      to: this.to,
      subject: this.subject,
      text: this.body,
    }

    const contents = Array.isArray(this.attachmentContent) ? this.attachmentContent : []
    const filenames = Array.isArray(this.attachmentFilename) ? this.attachmentFilename : []
    const types = Array.isArray(this.attachmentType) ? this.attachmentType : []
    const encoding = this.attachmentEncoding?.toLowerCase()

    // Map first to preserve index alignment, then filter out empty/missing entries.
    const attachments = contents
      .map((content, i) => ({
        content,
        ...(filenames[i] && { filename: filenames[i] }),
        ...(types[i] && { contentType: types[i] }),
        ...(encoding && { encoding }),
      }))
      .filter(({ content }) => content != null && content !== "")

    if (attachments.length > 0) {
      mail.attachments = attachments
    }

    const response = await transporter.sendMail(mail)

    return response
  },
}
