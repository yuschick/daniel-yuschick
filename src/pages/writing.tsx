import React, { useState, useEffect } from "react"
import { useStaticQuery, graphql } from "gatsby"
import { v4 as uuidv4 } from "uuid"

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

const WritingPage: React.FunctionComponent = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const error: boolean = useStoreState(state => state.writing.error)
  const books: BookChild[] | null = useStoreState(state => state.writing.books)
  const fetchBooks = useStoreActions(actions => actions.writing.fetchBooks)

  const {
    allFile: { edges: bookCovers },
  } = useStaticQuery(graphql`
    query bookCovers {
      allFile(
        filter: {
          extension: { eq: "jpg" }
          relativeDirectory: { eq: "writing" }
        }
      ) {
        edges {
          node {
            childImageSharp {
              fluid {
                ...GatsbyImageSharpFluid_withWebp
                aspectRatio
                base64
                sizes
                src
                srcSet
              }
            }
            fields {
              amazon
            }
            name
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
              books &&
              books.length &&
              books.map((book: BookChild) => {
                const { 0: img } = bookCovers.filter(
                  (p: any) =>
                    p.node.name === book.title.replace(/\s+/g, "").toLowerCase()
                )

                if (!img) return

                return (
                  <Book
                    key={uuidv4()}
                    data={book}
                    cover={img.node.childImageSharp.fluid}
                    amazon={img.node.fields.amazon}
                  />
                )
              })
            )}
          </ContentContainer>
        </ViewSection>
      </Layout>
    </>
  )
}

export default WritingPage
