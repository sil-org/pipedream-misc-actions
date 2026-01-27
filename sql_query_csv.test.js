import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

globalThis.defineComponent = (config) => config

const { default: component } = await import('./sql_query_csv.js')

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
})
