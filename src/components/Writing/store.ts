import { Action, action, Thunk, thunk } from "easy-peasy"
import { useStaticQuery, graphql } from "gatsby"

import { BookChild } from "types/Goodreads"
import formatXML from "utils/formatXML"

export interface WritingModel {
  error: boolean
  books: BookChild[] | null

  setError: Action<WritingModel, boolean>
  setBooks: Action<WritingModel, BookChild[]>

  fetchBooks: Thunk<WritingModel>
}

const storeModel: WritingModel = {
  error: false,
  books: null,

  setError: action((state, payload) => {
    state.error = payload
  }),

  setBooks: action((state, payload) => {
    state.books = payload
  }),

  fetchBooks: thunk(async actions => {
    try {
      const response = await fetch("/.netlify/functions/node-fetch-author")
      const xmlText = await response.text()
      const {
        GoodreadsResponse: {
          author: { books },
        },
      } = await formatXML(xmlText)

      if (!books) return

      if (Array.isArray(books.book)) {
        actions.setBooks([...books.book])
      } else {
        actions.setBooks([books.book])
      }
    } catch (error) {
      actions.setError(true)
    }
  }),
}

export default storeModel
