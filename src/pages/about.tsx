import React from "react"
import styled from "styled-components"
import LazyLoad from "react-lazyload"

import Layout from "components/Layout"
import SEO from "components/SEO"

import ViewSection from "components/ViewSection"
import H2 from "components/H2"
import ContentContainer from "components/ContentContainer"

import AboutContent from "components/About/AboutContent"
import TwitterFeed from "components/About/TwitterFeed"
import GoodreadsFeed from "components/About/GoodreadsFeed"
import SpotifyFeed from "components/About/SpotifyFeed"
import PSNFeed from "components/About/PSNFeed"

const AboutPage: React.FunctionComponent = () => (
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
          <SubGrid>
            <LazyLoad height={230} offset={100} once>
              <TwitterFeed />
            </LazyLoad>
            <LazyLoad height={250} offset={100} once>
              <GoodreadsFeed />
            </LazyLoad>
            <LazyLoad height={250} offset={100} once>
              <SpotifyFeed />
            </LazyLoad>
            <LazyLoad height={200} offset={100} once>
              <PSNFeed />
            </LazyLoad>
          </SubGrid>
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

const SubGrid = styled.section`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr;
`

export default AboutPage
