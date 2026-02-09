import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { default: component } = await import('./sql_query_data.js')

const books = [
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

describe(component.name, () => {
  it('should retrieve the specified row of data', async () => {
    component.data_inputs = [books]
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
