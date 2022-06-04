import React from "react"
import styled from "styled-components"

import Layout from "components/Layout"
import SEO from "components/SEO"

import ViewSection from "components/ViewSection"
import H2 from "components/H2"
import ContentContainer from "components/ContentContainer"

import AboutContent from "components/About/AboutContent"

const AboutPage: React.FunctionComponent = () => {
  return (
    <Layout>
      <SEO
        title="About | Daniel Yuschick"
        description="Daniel Yuschick is a frontend developer and horror author based in Helsinki, Finland"
      />
      <ViewSection>
        <H2>About</H2>
        <ContentContainer>
          <GridContainer>
            <AboutContent />
          </GridContainer>
        </ContentContainer>
      </ViewSection>
    </Layout>
  )
}

const GridContainer = styled.section`
  align-items: start;
  display: grid;
  grid-gap: 2rem;
  grid-template-columns: repeat(auto-fit, 1fr);

  @media (min-width: 750px) {
    grid-template-columns: minmax(350px, 3fr) minmax(auto, 2fr);
  }
`

export default AboutPage
