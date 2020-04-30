import { Action, action, Thunk, thunk } from "easy-peasy"
import { isThisYear } from "date-fns"

import { Book } from "types/Goodreads"
import formatXML from "utils/formatXML"

export interface AboutModel {
  error: boolean
  read: Book[] | null
  reading: Book | null

  setError: Action<AboutModel, boolean>
  setRead: Action<AboutModel, Book[]>
  setReading: Action<AboutModel, Book>

  fetchBooks: Thunk<AboutModel, "read" | "currently-reading">
}

const storeModel: AboutModel = {
  error: false,
  read: null,
  reading: null,

  setError: action((state, payload) => {
    state.error = payload
  }),

  setRead: action((state, payload) => {
    state.read = payload
  }),

  setReading: action((state, payload) => {
    state.reading = payload
  }),

  fetchBooks: thunk(async (actions, payload) => {
    const getUrl = (): string => {
      let url = `https://www.goodreads.com/review/list/35914801.xml?key=${process.env.GATSBY_GOODREADS_KEY}&v=2&shelf=${payload}`
      url = `https://cors-anywhere.herokuapp.com/${url}`

      return url
    }

    try {
      const url = getUrl()
      const response = await fetch(url)
      const xmlText = await response.text()
      const {
        GoodreadsResponse: {
          reviews: { review: data },
        },
      } = await formatXML(xmlText)

      if (!data) return

      if (payload === "read") {
        actions.setRead(
          data.filter(
            (book: Book) => book.read_at && isThisYear(new Date(book.read_at))
          )
        )
      } else {
        actions.setReading(data)
      }
    } catch (error) {
      actions.setError(true)
    }
  }),
}

export default storeModel
