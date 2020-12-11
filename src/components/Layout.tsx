import React, { Fragment } from "react"
import { createGlobalStyle } from "styled-components"

import Header from "./Header"
import Footer from "./Footer"

import ThemeColors from "theme/colors"
import ThemeFonts from "theme/fonts"

const GlobalStyle = createGlobalStyle`
  :root {
    --borderWidth: min(max(4px, 1vw), 8px);
  }

  * {
    border: 0;
    box-sizing: border-box;
    font-size: 100%;
    margin: 0;
    padding: 0;
	  vertical-align: baseline
  }

  html {
    /* direction: rtl; */
    /* direction: ltr; */
    /* writing-mode: horizontal-tb; */
    /* writing-mode: vertical-rl; */
    /* writing-mode: vertical-lr; */
  }

  html, body {

    @supports (font-size: clamp(15px, 2vw, 18px)) {
      --borderWidth: clamp(4px, 1vw, 8px);
      font-size: clamp(15px, 2vw, 18px)
    }

    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: none;
    background: ${ThemeColors.backgrounds.primary};
    backface-visibility: hidden;
    border: var(--borderWidth) solid ${ThemeColors.core.darkGrey};
    border-bottom: 0;
    color: ${ThemeColors.texts.darkBody};
    font-family: ${ThemeFonts.primary};
    font-size: min(max(15px, 2vw), 18px);
    font-weight: 400;
    line-height: 1.75;
    min-height: calc(100vh - var(--borderWidth));

    @supports (border-block: 1rem) {
      border-block-start: var(--borderWidth) solid ${ThemeColors.core.darkGrey};
      border-block-end: 0;
      border-inline: var(--borderWidth) solid ${ThemeColors.core.darkGrey};
    }

    @supports (min-block-size: 1rem) {
      min-block-size: calc(100vh - var(--borderWidth));
    }
  }

  body::-webkit-scrollbar-track
  {
    background-color: ${ThemeColors.core.darkGrey};
  }

  body::-webkit-scrollbar
  {
    background-color: ${ThemeColors.core.darkGrey};
    width: 6px;

    @supports (inline-size: 1rem) {
      inline-size: 6px;
    }
  }

  body::-webkit-scrollbar-thumb
  {
    background-color: ${ThemeColors.core.orange};
    border-radius: 6px;
  }

  scrollbar-color: ${ThemeColors.core.darkGrey} ${ThemeColors.core.orange};

  ::selection {
    background: ${ThemeColors.core.darkGrey};
    color: ${ThemeColors.core.white};
  }
  *:focus {
    outline: 1px solid ${ThemeColors.core.lightGrey};
  }

  img {
    border: 0;
    height: auto;
    max-width: 100%;

    @supports (block-size: 1rem) {
      block-size: auto;
    }

    @supports (max-inline-size: 1rem) {
      max-inline-size: 100%;
    }
  }
  ul, li {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  a,
  a:visited,
  a:active {
    color: ${ThemeColors.core.darkGrey};
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`

const Layout: React.FunctionComponent = ({ children }) => {
  return (
    <Fragment>
      <GlobalStyle />
      <Header />
      {children}
      <Footer />
    </Fragment>
  )
}

export default Layout
