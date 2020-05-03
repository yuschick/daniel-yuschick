import { Action, action, Thunk, thunk } from "easy-peasy"
import { isThisYear } from "date-fns"

import { Book } from "types/Goodreads"
import { Tweet } from "types/Twitter"
import { TokenResponse, ArtistData, Artist } from "types/Spotify"

import formatXML from "utils/formatXML"
import createOAuthSignature from "utils/createOAuthSignature"

export type ErrorTypes = "twitter" | "goodreads" | "spotify" | null

export interface AboutModel {
  error: ErrorTypes
  read: Book[] | null
  reading: Book | null
  tweets: Tweet[] | null
  artists: Artist[] | null

  setError: Action<AboutModel, ErrorTypes>
  setRead: Action<AboutModel, Book[]>
  setReading: Action<AboutModel, Book>
  setTweets: Action<AboutModel, Tweet[]>
  setArtists: Action<AboutModel, Artist[]>

  fetchBooks: Thunk<AboutModel, "read" | "currently-reading">
  fetchTweets: Thunk<AboutModel>
  fetchArtists: Thunk<AboutModel>
}

const storeModel: AboutModel = {
  error: null,
  read: null,
  reading: null,
  tweets: null,
  artists: null,

  setError: action((state, payload) => {
    state.error = payload
  }),

  setRead: action((state, payload) => {
    state.read = payload
  }),

  setReading: action((state, payload) => {
    state.reading = payload
  }),

  setTweets: action((state, payload) => {
    state.tweets = payload
  }),

  setArtists: action((state, payload) => {
    state.artists = payload
  }),

  fetchBooks: thunk(async (actions, payload) => {
    const getUrl = (): string => {
      const url = `${
        process.env.NODE_ENV === "development" &&
        "https://cors-anywhere.herokuapp.com/"
      }https://www.goodreads.com/review/list/35914801.xml?key=${
        process.env.GATSBY_GOODREADS_KEY
      }&v=2&shelf=${payload}`

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
      actions.setError("goodreads")
    }
  }),

  fetchTweets: thunk(async actions => {
    try {
      const headers = createOAuthSignature()
      const data = await fetch(
        `${
          process.env.NODE_ENV === "development" &&
          "https://cors-anywhere.herokuapp.com/"
        }https://api.twitter.com/1.1/statuses/user_timeline.json?username=yuschick&count=10&tweet_mode=extended&exclude_replies=true&include_rts=false`,
        {
          headers,
        }
      )

      const tweets: Tweet[] = await data.json()
      actions.setTweets(tweets)
    } catch (error) {
      actions.setError("twitter")
    }
  }),

  fetchArtists: thunk(async actions => {
    try {
      const getToken = async (): Promise<TokenResponse> => {
        const response = await fetch(
          `${
            process.env.NODE_ENV === "development" &&
            "https://cors-anywhere.herokuapp.com/"
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
