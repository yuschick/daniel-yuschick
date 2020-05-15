import React from "react"
import styled from "styled-components"

import ThemeColors from "theme/colors"
import ThemeFonts from "theme/fonts"

const H1: React.FunctionComponent = ({ children }) => {
  return <Headline>{children}</Headline>
}

const Headline = styled.h1`
  -webkit-text-stroke: 0.005em ${ThemeColors.core.darkGrey};
  color: ${ThemeColors.core.white};
  font-family: ${ThemeFonts.secondary};
  font-size: min(max(1.75rem, 3vw), 2.1rem);
  font-weight: 300;
  line-height: 1.5em;
  text-transform: uppercase;

  @supports (font-size: clamp(1.75rem, 3vw, 2.1rem)) {
    font-size: clamp(1.75rem, 3vw, 2.1rem);
  }

  a,
  a:hover,
  a:active,
  a:visited {
    color: ${ThemeColors.core.white};
    text-decoration: none;
  }
`

export default H1
