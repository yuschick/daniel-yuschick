import React from "react"
import styled from "styled-components"
import { useStaticQuery, graphql } from "gatsby"
import Img from "gatsby-image"
import { Link } from "gatsby"

import ThemeColors from "theme/colors"

import H1 from "components/H1"
import Nav from "components/Nav"

const Header: React.FunctionComponent = () => {
  const data = useStaticQuery(graphql`
    query HeaderImageQuery {
      __typename
      img500: file(relativePath: { eq: "header-500.jpg" }) {
        childImageSharp {
          fluid(maxWidth: 500, toFormat: WEBP) {
            aspectRatio
            base64
            sizes
            src
            srcSet
          }
        }
      }
      img1000: file(relativePath: { eq: "header-1000.jpg" }) {
        childImageSharp {
          fluid(maxWidth: 1000, toFormat: WEBP) {
            aspectRatio
            base64
            sizes
            src
            srcSet
          }
        }
      }
      img1500: file(relativePath: { eq: "header-1500.jpg" }) {
        childImageSharp {
          fluid(maxWidth: 1500, toFormat: WEBP) {
            aspectRatio
            base64
            sizes
            src
            srcSet
          }
        }
      }
      img2000: file(relativePath: { eq: "header-2000.jpg" }) {
        childImageSharp {
          fluid(maxWidth: 2000, toFormat: WEBP) {
            aspectRatio
            base64
            sizes
            src
            srcSet
          }
        }
      }
      img2500: file(relativePath: { eq: "header-2500.jpg" }) {
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
  const sources = [
    { ...data.img500.childImageSharp.fluid, media: `(max-width: 500px)` },
    {
      ...data.img1000.childImageSharp.fluid,
      media: `(max-width: 1000px)`,
    },
    {
      ...data.img1500.childImageSharp.fluid,
      media: `(max-width: 1500px)`,
    },
    {
      ...data.img2000.childImageSharp.fluid,
      media: `(max-width: 2000px)`,
    },
    {
      ...data.img2500.childImageSharp.fluid,
      media: `(min-width: 2000px)`,
    },
  ]

  return (
    <HeaderContainer>
      <Img
        fluid={sources}
        alt="Daniel Yuschick by @nome_sapien"
        style={{ opacity: 0.5 }}
        fadeIn
      />

      <NavContainer>
        <H1>
          <Link to="/">Daniel Yuschick</Link>
        </H1>
        <Nav />
      </NavContainer>
    </HeaderContainer>
  )
}

const HeaderContainer = styled.header`
  background: ${ThemeColors.core.black};
  -webkit-clip-path: polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%);
  clip-path: polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%);
  max-height: 80vh;
  overflow: hidden;
  position: relative;
  text-align: center;
  width: 100%;
`

const NavContainer = styled.section`
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%);
`

export default Header
