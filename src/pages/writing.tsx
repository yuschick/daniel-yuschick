import React, { useState, useEffect } from "react"
import { useStaticQuery, graphql } from "gatsby"

import { useStoreActions, useStoreState } from "store"

import Layout from "components/Layout"
import SEO from "components/SEO"
import LoadingIcon from "components/LoadingIcon"
import Error from "components/Error"
import ViewSection from "components/ViewSection"
import H2 from "components/H2"
import ContentContainer from "components/ContentContainer"

import Book from "components/Writing/Book"

import { BookChild } from "types/Goodreads"

// TODO: Once a second book is added, this will need to be modified
const WritingPage: React.FunctionComponent = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const error: boolean = useStoreState(state => state.writing.error)
  const books: BookChild | null = useStoreState(state => state.writing.books)
  const fetchBooks = useStoreActions(actions => actions.writing.fetchBooks)

  const theMinesCover = useStaticQuery(graphql`
    query CoverQuery {
      file(relativePath: { eq: "writing/official-the-mines-cover.jpg" }) {
        childImageSharp {
          fluid(toFormat: WEBP) {
            aspectRatio
            base64
            sizes
            src
            srcSet
          }
        }
      }
    }
  `)

  useEffect(() => {
    if (books) return

    setLoading(true)
    fetchBooks().then(() => {
      setLoading(false)
    })
  }, [books, fetchBooks, setLoading])

  return (
    <>
      <Layout>
        <SEO
          title="Writing | Daniel Yuschick"
          description="Daniel Yuschick is a frontend developer and horror author based in Helsinki, Finland"
        />
        <ViewSection>
          <H2>Writing</H2>
          <ContentContainer>
            {(loading || !books) && !error ? (
              <LoadingIcon />
            ) : error ? (
              <Error />
            ) : (
              books && (
                <Book
                  data={books}
                  cover={theMinesCover.file.childImageSharp.fluid}
                  amazon="https://www.amazon.com/Mines-Daniel-Yuschick-ebook/dp/B07RRQ3F58"
                />
              )
            )}
          </ContentContainer>
        </ViewSection>
      </Layout>
    </>
  )
}

export default WritingPage
