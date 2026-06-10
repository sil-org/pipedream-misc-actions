import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { default: component } = await import('./send_email.js')

describe.only(component.name, () => {
  it.only('should be able to send an email without an attachment', async (testContext) => {
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
    assert.ok(component.to, 'No "To Address" provided (use EMAIL_TEST_TO)')

    component.from = process.env.EMAIL_TEST_FROM
    assert.ok(component.from, 'No "From Address" provided (use EMAIL_TEST_FROM)')

    component.subject = process.env.EMAIL_TEST_SUBJECT
    assert.ok(component.subject, 'No "Subject" provided (use EMAIL_TEST_SUBJECT)')

    component.body = process.env.EMAIL_TEST_BODY
    assert.ok(component.body, 'No "Body" provided (use EMAIL_TEST_BODY)')

    component.attachmentContent = []

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.log('response' + JSON.stringify(response))
    assert.ok(response.messageId, 'No messageId was returned')
  })

  it.only('should be able to send an email with an attachment', async (testContext) => {
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
    if (!process.env.EMAIL_TEST_ATTACHMENT || process.env.EMAIL_TEST_ATTACHMENT === '2') {
      testContext.skip('`EMAIL_TEST_ATTACHMENT` was not provided or is 2, so skipping "with one attachment" test')
      return
    }
    component.amazon_ses = {
      "$auth": { accessKeyId, secretAccessKey },
    }

    component.to = process.env.EMAIL_TEST_TO
    assert.ok(component.to, 'No "To Address" provided (use EMAIL_TEST_TO)')

    component.from = process.env.EMAIL_TEST_FROM
    assert.ok(component.from, 'No "From Address" provided (use EMAIL_TEST_FROM)')

    component.subject = process.env.EMAIL_TEST_SUBJECT
    assert.ok(component.subject, 'No "Subject" provided (use EMAIL_TEST_SUBJECT)')

    component.body = process.env.EMAIL_TEST_BODY
    assert.ok(component.body, 'No "Body" provided (use EMAIL_TEST_BODY)')

    component.attachmentFilename = ['example.csv']
    component.attachmentContent = [
      `Title,Genre,Author
"The Hobbit",Fantasy,"J.R.R. Tolkien"
"Pride and Prejudice",Fiction,"Jane Austen"`
    ]
    component.attachmentType = ['text/csv']

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.log('response' + JSON.stringify(response))
    assert.ok(response.messageId, 'No messageId was returned')
  })

  it.only('should be able to send an email with two attachments', async (testContext) => {
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
    if (!process.env.EMAIL_TEST_ATTACHMENT || process.env.EMAIL_TEST_ATTACHMENT === '1') {
      testContext.skip('No `EMAIL_TEST_ATTACHMENT` was provided or is "1", so skipping "with two attachments" test')
      return
    }
    component.amazon_ses = {
      "$auth": { accessKeyId, secretAccessKey },
    }

    component.to = process.env.EMAIL_TEST_TO
    assert.ok(component.to, 'No "To Address" provided (use EMAIL_TEST_TO)')

    component.from = process.env.EMAIL_TEST_FROM
    assert.ok(component.from, 'No "From Address" provided (use EMAIL_TEST_FROM)')

    component.subject = process.env.EMAIL_TEST_SUBJECT
    assert.ok(component.subject, 'No "Subject" provided (use EMAIL_TEST_SUBJECT)')

    component.body = process.env.EMAIL_TEST_BODY
    assert.ok(component.body, 'No "Body" provided (use EMAIL_TEST_BODY)')

    component.attachmentFilename = ['example.csv', 'example.txt']
    component.attachmentContent = [
      `Title,Genre,Author
"The Hobbit",Fantasy,"J.R.R. Tolkien"
"Pride and Prejudice",Fiction,"Jane Austen"`,
      'Plain text file'
    ]
    component.attachmentType = ['text/csv', 'text/plain']

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    console.log('response' + JSON.stringify(response))
    assert.ok(response.messageId, 'No messageId was returned')
  })
})
