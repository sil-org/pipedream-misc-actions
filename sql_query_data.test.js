import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { default: component } = await import('./sql_query_data.js')

const authors = [
  {
    "Name": "J.R.R. Tolkien",
    "Born": 1892,
    "Died": 1973,
  },
  {
    "Name": "Jane Austen",
    "Born": 1775,
    "Died": 1817,
  },
]

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

  it('should accept multiple inputs, such as for a JOIN', async () => {
    component.data_inputs = [books, authors]
    component.sql_query = `
      SELECT
        book.Title,
        author.Name,
        author.Born
      FROM ? AS book
      JOIN ? AS author
        ON book.Author = author.Name
      WHERE book.Genre = "Fantasy"
    `

    const response = await component.run({
      steps: { trigger: {} },
      $: {}
    })

    assert.equal(response.errors, undefined)
    assert.deepEqual(
      response.rows,
      [
        { Born: 1892, Name: "J.R.R. Tolkien", Title: "The Hobbit" }
      ]
    )
  })
})
