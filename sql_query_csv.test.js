import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

globalThis.defineComponent = (config) => config

const { default: component } = await import('./sql_query_csv.js')

const invalidCsvContent = `Title,Genre,Author
"Pride and Prejudice",Fiction,"J`

const validCsvContent = `Title,Genre,Author
"The Hobbit",Fantasy,"J.R.R. Tolkien"
"Pride and Prejudice",Fiction,"Jane Austen"`

describe('SQL Query CSV', () => {
  it('should retrieve the specified CSV row data', async () => {
    component.csv_content = validCsvContent
    component.csv_has_header = true
    component.sql_query = 'SELECT Title FROM ? WHERE Genre = "Fiction"'

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    assert.deepStrictEqual(
      response,
      {
        "rows": [
          {
            "Title": "Pride and Prejudice"
          }
        ]
      }
    )
  })

  it('should handle CSV-parsing errors', async () => {
    component.csv_content = invalidCsvContent
    component.csv_has_header = true
    component.sql_query = 'SELECT Title FROM ? WHERE Genre = "Fiction"'

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    assert.ok(
      response.errors?.length > 0,
      'Failed to return an error when given invalid CSV data'
    )
  })
})
