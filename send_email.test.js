import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { default: component } = await import('./send_email.js')

describe(component.name, () => {
  it('should be able to send an email without an attachment', async (testContext) => {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    if (!accessKeyId) {
      testContext.skip('No `AWS_ACCESS_KEY_ID` env. var. provided, skipping email test')
      return
    }
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    if (!secretAccessKey) {
      testContext.skip('No `AWS_SECRET_ACCESS_KEY` env. var. provided, skipping email test')
      return
    }
    if (process.env.EMAIL_TEST_ATTACHMENT) {
      testContext.skip('An `EMAIL_TEST_ATTACHMENT` was provided, so skipping "without attachment" test')
      return
    }
    component.amazon_ses = {
      "$auth": { accessKeyId, secretAccessKey },
    }

    component.to = process.env.EMAIL_TEST_TO
    assert.ok(component.to, 'No "To" address provided')

    component.from = process.env.EMAIL_TEST_FROM
    assert.ok(component.from, 'No "From" address provided')

    component.subject = process.env.EMAIL_TEST_SUBJECT
    assert.ok(component.subject, 'No email subject provided')

    component.body = process.env.EMAIL_TEST_BODY
    assert.ok(component.body, 'No email body provided')

    component.attachmentContent = []

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    assert.ok(response.MessageId, 'No MessageId was returned')
  })

  it('should be able to send an email with an attachment', async (testContext) => {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    if (!accessKeyId) {
      testContext.skip('No `AWS_ACCESS_KEY_ID` env. var. provided, skipping email test')
      return
    }
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    if (!secretAccessKey) {
      testContext.skip('No `AWS_SECRET_ACCESS_KEY` env. var. provided, skipping email test')
      return
    }
    if (!process.env.EMAIL_TEST_ATTACHMENT) {
      testContext.skip('No `EMAIL_TEST_ATTACHMENT` was provided, so skipping "with attachment" test')
      return
    }
    component.amazon_ses = {
      "$auth": { accessKeyId, secretAccessKey },
    }

    component.to = process.env.EMAIL_TEST_TO
    assert.ok(component.to, 'No "To" address provided')

    component.from = process.env.EMAIL_TEST_FROM
    assert.ok(component.from, 'No "From" address provided')

    component.subject = process.env.EMAIL_TEST_SUBJECT
    assert.ok(component.subject, 'No email subject provided')

    component.body = process.env.EMAIL_TEST_BODY
    assert.ok(component.body, 'No email body provided')

    component.attachmentFilename = ['example.csv']
    component.attachmentContent = [
      `Title,Genre,Author
"The Hobbit",Fantasy,"J.R.R. Tolkien"
"Pride and Prejudice",Fiction,"Jane Austen"`
    ]
    component.attachmentType = ['text/csv']
    component.attachmentEncoding = 'BASE64'

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    assert.ok(response.MessageId, 'No MessageId was returned')
  })
})
