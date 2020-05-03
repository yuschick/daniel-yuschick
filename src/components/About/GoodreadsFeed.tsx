import React, { useState, useEffect, Fragment } from "react"
import styled from "styled-components"
import { format } from "date-fns"

import { useStoreActions, useStoreState } from "store"
import { ErrorTypes } from "./store"

import CurrentlyReadingBook from "./CurrentlyReadingBook"
import ReadBook from "./ReadBook"

import H3 from "components/H3"
import ListContent from "components/ListContent"
import LoadingIcon from "components/LoadingIcon"
import Error from "components/Error"

import { Book } from "types/Goodreads"

const GoodreadsFeed: React.FunctionComponent = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const error: ErrorTypes = useStoreState(state => state.about.error)
  const read: Book[] | null = useStoreState(state => state.about.read)
  const reading: Book | null = useStoreState(state => state.about.reading)
  const fetchBooks = useStoreActions(actions => actions.about.fetchBooks)
  const now = new Date()

  useEffect(() => {
    if (read && reading) return

    setLoading(true)
    Promise.all([fetchBooks("read"), fetchBooks("currently-reading")]).then(
      () => {
        setLoading(false)
      }
    )
  }, [read, reading, fetchBooks, setLoading])

  return (
    <section>
      <H3>Goodreads</H3>
      <ScrollContainer>
        {loading ? (
          <LoadingIcon />
        ) : error === "goodreads" ? (
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
