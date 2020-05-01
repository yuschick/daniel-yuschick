import React from "react"
import styled from "styled-components"

import ThemeColors from "theme/colors"
import ThemeFonts from "theme/fonts"

const H3: React.FunctionComponent = ({ children }) => {
  return <Headline>{children}</Headline>
}

const Headline = styled.h3`
  color: ${ThemeColors.texts.headline};
  font-family: ${ThemeFonts.secondary};
  font-size: clamp(1.15rem, 2vw, 1.25rem);
  font-weight: 500;
  line-height: 1.5;
  margin-bottom: 1rem;
  min-height: 25px;
  overflow: hidden;
  position: relative;
  width: 100%;

  @supports not (clamp()) {
    font-size: min(max(1.15rem, 2vw), 1.25rem);
  }

  &:after {
    border-top: 1px solid ${ThemeColors.core.orange};
    content: "";
    margin-left: 0.5rem;
    opacity: 0.5;
    position: absolute;
    top: 50%;
    width: 100%;
  }
`

export default H3
