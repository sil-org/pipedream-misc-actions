import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

globalThis.defineComponent = (config) => config

const { default: component } = await import('./sql_query_data.js')

describe('SQL Query Data', () => {
  it('should retrieve the specified row of data', async () => {
    component.data_inputs = [
      {
        "Title": "The Hobbit",
        "Genre": "Fantasy",
        "Author": "J.R.R. Tolkien",
      },
      {
        "Title": "Pride and Prejudice",
        "Genre": "Fiction",
        "Author": "Jane Austen",
      },
    ]
    component.sql_query = 'SELECT Title FROM ? WHERE Genre = "Fiction"'

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    assert.equal(response.errors, undefined)
    assert.deepEqual(
      response.rows,
      [
        { "Title": "Pride and Prejudice" }
      ]
    )
  })
})
