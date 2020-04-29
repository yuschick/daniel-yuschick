import React, { useState, useEffect } from "react"
import { useStaticQuery, graphql } from "gatsby"

import Layout from "components/Layout"
import SEO from "components/SEO"
import LoadingIcon from "components/LoadingIcon"
import Error from "components/Error"
import ViewSection from "components/ViewSection"
import H2 from "components/H2"
import ContentContainer from "components/ContentContainer"

import Book from "components/Writing/Book"

import formatXML from "utils/formatXML"
import { BookChild } from "types/Goodreads"

// TODO: Once a second book is added, this will need to be modified
const WritingPage: React.FunctionComponent = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const [data, setData] = useState<BookChild>()

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
    const getUrl = (): string => {
      let url = `https://www.goodreads.com/author/list/19160978?format=xml&key=${process.env.GATSBY_GOODREADS_KEY}`

      if (process.env.NODE_ENV === "development") {
        url = `https://cors-anywhere.herokuapp.com/${url}`
      }

      return url
    }
    const fetchAuthor = async () => {
      try {
        const url = getUrl()
        const response = await fetch(url)
        const xmlText = await response.text()
        const {
          GoodreadsResponse: {
            author: { books },
          },
        } = await formatXML(xmlText)

        if (!books) return

        setData(books.book)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchAuthor()
  }, [setData])

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
            {(loading || !data) && !error ? (
              <LoadingIcon />
            ) : error ? (
              <Error />
            ) : (
              data && (
                <Book
                  data={data}
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
