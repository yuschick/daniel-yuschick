import React from "react"
import styled, { css } from "styled-components"
import { useStaticQuery, graphql } from "gatsby"
import Img from "gatsby-image"
import { Link } from "gatsby"

import ThemeColors from "theme/colors"

import H1 from "components/H1"
import Nav from "components/Nav"

const Header: React.FunctionComponent = () => {
  const data = useStaticQuery(graphql`
    query HeaderImageQuery {
      img500: file(relativePath: { eq: "header-500.jpg" }) {
        childImageSharp {
          fluid(maxWidth: 500) {
            ...GatsbyImageSharpFluid_withWebp
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
          fluid(maxWidth: 1000) {
            ...GatsbyImageSharpFluid_withWebp
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
          fluid(maxWidth: 1500) {
            ...GatsbyImageSharpFluid_withWebp
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
          fluid(maxWidth: 2000) {
            ...GatsbyImageSharpFluid_withWebp
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
          fluid {
            ...GatsbyImageSharpFluid_withWebp
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
      media: "(min-width: 501px) and (max-width: 1000px)",
    },
    {
      ...data.img1500.childImageSharp.fluid,
      media: "(min-width: 1001px) and (max-width: 1500px)",
    },
    {
      ...data.img2000.childImageSharp.fluid,
      media: "(min-width: 1501px) and (max-width: 2000px)",
    },
    {
      ...data.img2500.childImageSharp.fluid,
      media: `(min-width: 2001px)`,
    },
  ]

  return (
    <HeaderContainer>
      <ResponsiveImage
        sources={sources}
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

const ResponsiveImage = styled(Img)<{ sources: any }>`
  > div:first-child {
    @media (max-width: 500px) {
      padding-bottom: ${props =>
        `${100 / props.sources[0].aspectRatio}% !important`};

      @supports (padding-block: 1rem) {
        padding-block-end: ${props =>
          `${100 / props.sources[0].aspectRatio}% !important`};
      }
    }
    @media (min-width: 501px) and (max-width: 1000px) {
      padding-bottom: ${props =>
        `${100 / props.sources[1].aspectRatio}% !important`};

      @supports (padding-block: 1rem) {
        padding-block-end: ${props =>
          `${100 / props.sources[1].aspectRatio}% !important`};
      }
    }
    @media (min-width: 1001px) and (max-width: 1500px) {
      padding-bottom: ${props =>
        `${100 / props.sources[2].aspectRatio}% !important`};

      @supports (padding-block: 1rem) {
        padding-block-end: ${props =>
          `${100 / props.sources[2].aspectRatio}% !important`};
      }
    }
    @media (min-width: 1501px) and (max-width: 2000px) {
      padding-bottom: ${props =>
        `${100 / props.sources[3].aspectRatio}% !important`};

      @supports (padding-block: 1rem) {
        padding-block-end: ${props =>
          `${100 / props.sources[3].aspectRatio}% !important`};
      }
    }
    @media (min-width: 2001px) {
      padding-bottom: ${props =>
        `${100 / props.sources[4].aspectRatio}% !important`};

      @supports (padding-block: 1rem) {
        padding-block-end: ${props =>
          `${100 / props.sources[4].aspectRatio}% !important`};
      }
    }
  }
`

const HeaderContainer = styled.header`
  background: ${ThemeColors.core.black};
  -webkit-clip-path: polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%);
  clip-path: polygon(0 0, 100% 0, 100% 95%, 50% 100%, 0 95%);
  max-height: 100vh;
  overflow: hidden;
  position: relative;
  text-align: center;
  width: 100%;

  @supports (max-block-size: 1rem) {
    max-block-size: 100vh;
  }

  @supports (inline-size: 1rem) {
    inline-size: 100%;
  }

  img {
    max-width: 100%;
    width: 100%;

    @supports (max-inline-size: 1rem) {
      inline-size: 100%;
      max-inline-size: 100%;
    }
  }
`

const NavContainer = styled.section`
  position: absolute;
  width: 100%;

  @supports not (inset-block: 1rem) {
    top: 50%;
  }

  @supports (inset-block: 1rem) {
    inset-block-start: 50%;
  }

  @supports (inline-size: 1rem) {
    inline-size: 100%;
  }
`

export default Header
