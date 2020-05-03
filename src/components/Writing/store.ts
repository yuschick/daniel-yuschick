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
      const getUrl = (): string => {
        const url = `${
          process.env.NODE_ENV === "development" &&
          "https://cors-anywhere.herokuapp.com/"
        }https://www.goodreads.com/author/list/19160978?format=xml&key=${
          process.env.GATSBY_GOODREADS_KEY
        }`

        return url
      }

      const url = getUrl()
      const response = await fetch(url)
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
