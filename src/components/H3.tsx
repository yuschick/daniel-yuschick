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
  font-size: min(max(1.15rem, 2vw), 1.25rem);
  font-weight: 500;
  line-height: 1.5;
  margin-bottom: 1rem;
  min-height: 25px;
  overflow: hidden;
  position: relative;
  width: 100%;

  @supports (font-size: clamp(1.15rem, 2vw, 1.25rem)) {
    font-size: clamp(1.15rem, 2vw, 1.25rem);
  }

  @supports (inline-size: 1rem) {
    inline-size: 100%;
  }

  @supports (margin-block: 1rem) {
    margin-block: 0 1rem;
  }

  @supports (min-block-size: 1rem) {
    min-block-size: 25px;
  }

  &:after {
    border-top: 1px solid ${ThemeColors.core.orange};
    content: "";
    margin-left: 0.5rem;
    opacity: 0.5;
    position: absolute;
    width: 100%;

    @supports (border-block: 1px) {
      border-block-start: 1px solid ${ThemeColors.core.orange};
      border-inline: 0;
    }

    @supports (inline-size: 1rem) {
      inline-size: 100%;
    }

    @supports (inset-block: 1rem) {
      inset-block-start: 50%;
    }

    @supports not (inset-block: 1rem) {
      top: 50%;
    }

    @supports (margin-inline: 1rem) {
      margin-inline: 0.5rem 0;
    }
  }
`

export default H3
