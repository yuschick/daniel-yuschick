import React from "react"
import styled from "styled-components"

import Layout from "components/Layout"
import SEO from "components/SEO"

import ViewSection from "components/ViewSection"
import H2 from "components/H2"
import ContentContainer from "components/ContentContainer"

import Projects from "components/Development/Projects"
import Posts from "components/Development/Posts"

const DevelopmentPage: React.FunctionComponent = () => (
  <Layout>
    <SEO
      title="Development | Daniel Yuschick"
      description="Daniel Yuschick is a frontend developer and horror author based in Helsinki, Finland"
    />
    <ViewSection>
      <H2>Development</H2>
      <ContentContainer>
        <GridContainer>
          <Projects />
          <Posts />
        </GridContainer>
      </ContentContainer>
    </ViewSection>
  </Layout>
)

const GridContainer = styled.section`
  align-items: start;
  display: grid;
  grid-gap: 2rem;
  grid-template-columns: repeat(auto-fit, 1fr);

  @media (min-width: 750px) {
    grid-template-columns: minmax(350px, 3fr) minmax(300px, 2fr);
  }
`

export default DevelopmentPage
