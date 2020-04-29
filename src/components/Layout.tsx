import React from "react"
import { createGlobalStyle } from "styled-components"
import { SpotifyApiContext } from "react-spotify-api"

import Header from "./Header"
import Footer from "./Footer"

import ThemeColors from "theme/colors"
import ThemeFonts from "theme/fonts"

const GlobalStyle = createGlobalStyle`
  * {
    border: 0;
    box-sizing: border-box;
    font-size: 100%;
    margin: 0;
    padding: 0;
	  vertical-align: baseline
  }
  html, body {
    --borderWidth: clamp(4px, 1vw, 8px);
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: none;
    background: ${ThemeColors.backgrounds.primary};
    backface-visibility: hidden;
    border: var(--borderWidth) solid ${ThemeColors.core.darkGrey};
    border-bottom: 0;
    color: ${ThemeColors.texts.darkBody};
    font-family: ${ThemeFonts.primary};
    font-size: clamp(15px, 2vw, 18px);
    font-weight: 400;
    line-height: 1.75;
    min-height: calc(100vh - var(--borderWidth));
  }

  body::-webkit-scrollbar-track
  {
    background-color: ${ThemeColors.core.darkGrey};
  }

  body::-webkit-scrollbar
  {
    width: 6px;
    background-color: ${ThemeColors.core.darkGrey};
  }

  body::-webkit-scrollbar-thumb
  {
    background-color: ${ThemeColors.core.orange};
    border-radius: 6px;
  }

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
    <SpotifyApiContext.Provider value={process.env.GATSBY_SPOTIFY_TOKEN}>
      <GlobalStyle />
      <Header />
      {children}
      <Footer />
    </SpotifyApiContext.Provider>
  )
}

export default Layout
