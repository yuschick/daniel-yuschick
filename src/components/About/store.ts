import { Action, action, Thunk, thunk } from "easy-peasy"
import { isThisYear, isBefore } from "date-fns"

import { Book } from "types/Goodreads"
import { TokenResponse, ArtistData, Artist } from "types/Spotify"

import formatXML from "utils/formatXML"
import createOAuthSignature from "utils/createOAuthSignature"

export type ErrorTypes = "twitter" | "goodreads" | "spotify"

export interface AboutModel {
  error: ErrorTypes[] | null
  read: Book[] | null
  reading: Book[] | null
  artists: Artist[] | null

  setError: Action<AboutModel, ErrorTypes>
  setRead: Action<AboutModel, Book[]>
  setReading: Action<AboutModel, Book[]>
  setArtists: Action<AboutModel, Artist[]>

  fetchBooks: Thunk<AboutModel, "read" | "currently-reading">
  fetchArtists: Thunk<AboutModel>
}

const storeModel: AboutModel = {
  error: null,
  read: null,
  reading: null,
  artists: null,

  setError: action((state, payload) => {
    state.error ? state.error.push(payload) : (state.error = [payload])
  }),

  setRead: action((state, payload) => {
    state.read = payload
  }),

  setReading: action((state, payload) => {
    state.reading = payload
  }),

  setArtists: action((state, payload) => {
    state.artists = payload
  }),

  fetchBooks: thunk(async (actions, payload) => {
    try {
      const url =
        process.env.NODE_ENV === "development"
          ? `https://cors-anywhere.herokuapp.com/https://www.goodreads.com/review/list/35914801.xml?key=${process.env.GATSBY_GOODREADS_KEY}&v=2&shelf=${payload}`
          : "/.netlify/functions/node-fetch-goodreads"
      const response = await fetch(url, {
        headers: {
          shelf: payload,
        },
      })
      const xmlText = await response.text()
      const {
        GoodreadsResponse: {
          reviews: { review: data = [] },
        },
      } = await formatXML(xmlText)

      if ((Array.isArray(data) && !data.length) || !data) {
        payload === "read" ? actions.setRead([]) : actions.setReading([])
        return
      }

      if (payload === "read") {
        actions.setRead(
          data
            .filter(
              (book: Book) => book.read_at && isThisYear(new Date(book.read_at))
            )
            .sort((a: Book, b: Book) =>
              isBefore(new Date(a.read_at), new Date(b.read_at)) ? 1 : -1
            )
        )
      } else {
        actions.setReading([data])
      }
    } catch (error) {
      actions.setError("goodreads")
    }
  }),

  fetchArtists: thunk(async actions => {
    try {
      const getToken = async (): Promise<TokenResponse> => {
        const response = await fetch(
          `${
            process.env.NODE_ENV === "development"
              ? "https://cors-anywhere.herokuapp.com/"
              : ""
          }https://accounts.spotify.com/api/token`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${new Buffer(
                `${process.env.GATSBY_SPOTIFY_CLIENT}:${process.env.GATSBY_SPOTIFY_SECRET}`
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: process.env.GATSBY_SPOTIFY_REFRESH_TOKEN || "",
            }),
          }
        )

        const data: TokenResponse = await response.json()
        return data
      }

      const { access_token } = await getToken()
      const response = await fetch(
        "https://api.spotify.com/v1/me/top/artists",
        {
          headers: {
            authorization: `Bearer ${access_token}`,
          },
        }
      )

      const data: ArtistData = await response.json()
      const artists: Artist[] = data.items.slice(0, 9)
      actions.setArtists(artists)
    } catch (error) {
      actions.setError("spotify")
    }
  }),
}

export default storeModel
