import React from "react"
import styled from "styled-components"

import Layout from "components/Layout"
import SEO from "components/SEO"

import ViewSection from "components/ViewSection"
import H2 from "components/H2"
import ContentContainer from "components/ContentContainer"

import NotFound from "images/grady-twins.gif"

import ThemeColors from "theme/colors"

const NotFoundPage: React.FunctionComponent = () => (
  <Layout>
    <SEO title="404: Not found" />
    <ViewSection>
      <H2>Not Found</H2>
      <ContentContainer>
        <CenteredContainer />
      </ContentContainer>
    </ViewSection>
  </Layout>
)

const CenteredContainer = styled.div`
  background: url(${NotFound}) no-repeat ${ThemeColors.backgrounds.primary}
    center;
  -webkit-box-shadow: inset 0px 0px 24px 30px ${ThemeColors.backgrounds.primary};
  -moz-box-shadow: inset 0px 0px 24px 30px ${ThemeColors.backgrounds.primary};
  box-shadow: inset 0px 0px 24px 30px ${ThemeColors.backgrounds.primary};
  filter: blur(1px) grayscale(0.8);
  height: 281px;
  margin: 0 auto;
  outline: 5px solid ${ThemeColors.backgrounds.primary};
  outline-offset: -5px;
  text-align: center;
  width: 500px;
`

export default NotFoundPage
