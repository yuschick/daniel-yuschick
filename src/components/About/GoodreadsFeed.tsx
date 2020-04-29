import React, { useState, useEffect, Fragment } from "react"
import styled from "styled-components"
import { format, isThisYear } from "date-fns"

import CurrentlyReadingBook from "./CurrentlyReadingBook"
import ReadBook from "./ReadBook"

import H3 from "components/H3"
import ListContent from "components/ListContent"
import LoadingIcon from "components/LoadingIcon"
import Error from "components/Error"

import formatXML from "utils/formatXML"
import { Book } from "types/Goodreads"

const GoodreadsFeed: React.FunctionComponent = () => {
  const [error, setError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [read, setRead] = useState<Book[]>([])
  const [reading, setReading] = useState<Book>()
  const now = new Date()

  useEffect(() => {
    const getUrl = (shelf: string): string => {
      let url = `https://www.goodreads.com/review/list/35914801.xml?key=${process.env.GATSBY_GOODREADS_KEY}&v=2&shelf=${shelf}`

      if (process.env.NODE_ENV === "development") {
        url = `https://cors-anywhere.herokuapp.com/${url}`
      }

      return url
    }
    const fetchRead = async () => {
      const url = getUrl("read")
      const response = await fetch(url)
      const xmlText = await response.text()
      const {
        GoodreadsResponse: {
          reviews: { review: books },
        },
      } = await formatXML(xmlText)

      if (!books) return

      setRead(
        books.filter(
          (book: Book) => book.read_at && isThisYear(new Date(book.read_at))
        )
      )
    }
    const fetchReading = async () => {
      const url = getUrl("currently-reading")
      const response = await fetch(url)
      const xmlText = await response.text()
      const {
        GoodreadsResponse: {
          reviews: { review: book },
        },
      } = await formatXML(xmlText)

      if (!book) return

      setReading(book)
    }

    setLoading(true)

    Promise.all([fetchRead(), fetchReading()])
      .then(() => {
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [setRead, setReading, setLoading])

  return (
    <section>
      <H3>Goodreads</H3>
      <ScrollContainer>
        {loading ? (
          <LoadingIcon />
        ) : error ? (
          <Error />
        ) : (
          <Fragment>
            <ListContent.Block>
              <ListContent.Header>Currently reading</ListContent.Header>
              <ListContent.Content>
                {reading ? (
                  <CurrentlyReadingBook book={reading} />
                ) : (
                  <span>
                    Nothing at the moment. Sometimes decisions are hard!
                  </span>
                )}
              </ListContent.Content>
            </ListContent.Block>
            <ListContent.Block>
              <ListContent.Header>
                Read in {format(now, "yyyy")}
              </ListContent.Header>
              {read && !!read.length ? (
                <ListContent.Content>
                  <ul>
                    {read.map((book: any) => (
                      <ReadBook key={book.id} book={book} />
                    ))}
                  </ul>
                </ListContent.Content>
              ) : (
                <span>Nothing yet this year but it's early. Hopefully.</span>
              )}
            </ListContent.Block>
          </Fragment>
        )}
      </ScrollContainer>
    </section>
  )
}

const ScrollContainer = styled.div`
  height: 250px;
  overflow: scroll;
  padding-right: 0.5rem;
`

export default GoodreadsFeed
