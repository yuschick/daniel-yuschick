import React from "react"
import styled from "styled-components"

import ThemeColors from "theme/colors"
import ThemeFonts from "theme/fonts"

const H2: React.FunctionComponent = ({ children }) => {
  return (
    <Container>
      <Headline>{children}</Headline>
    </Container>
  )
}

const Container = styled.header`
  text-align: center;
`

const Headline = styled.h2`
  border-bottom: 1px solid ${ThemeColors.core.darkGrey};
  border-top: 1px solid ${ThemeColors.core.darkGrey};
  color: ${ThemeColors.texts.headline};
  display: inline-block;
  font-family: ${ThemeFonts.secondary};
  font-size: min(max(1.25rem, 2vw), 1.5rem);
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1;
  margin: 0 auto;
  padding: 0.45rem 1rem;
  text-transform: uppercase;

  @supports (border-block: 1px) {
    border-block: 1px solid ${ThemeColors.core.darkGrey};
    border-inline: 0;
  }

  @supports (font-size: clamp(1.25rem, 2vw, 1.5rem)) {
    font-size: clamp(1.25rem, 2vw, 1.5rem);
  }

  @supports (margin-block: 1rem) {
    margin-block: 0;
    margin-inline: auto;
  }

  @supports (padding-block: 1rem) {
    padding-block: 0.45rem;
    padding-inline: 1rem;
  }
`

export default H2
