import React from "react"
import styled from "styled-components"

import ThemeColors from "theme/colors"
import ThemeFonts from "theme/fonts"

import GitHubIcon from "assets/icons/icon-github.svg"
import GoodreadsIcon from "assets/icons/icon-goodreads.svg"
import InstagramIcon from "assets/icons/icon-instagram.svg"
import LinkedInIcon from "assets/icons/icon-linkedin.svg"
import MediumIcon from "assets/icons/icon-medium.svg"
import PlaystationIcon from "assets/icons/icon-playstation.svg"
import SpotifyIcon from "assets/icons/icon-spotify.svg"
import TwitterIcon from "assets/icons/icon-twitter.svg"

const Footer: React.FunctionComponent = () => {
  return (
    <section>
      <FooterContainer>
        <PrimaryBlock />
        <SecondaryBlock />
        <TertiaryBlock />
      </FooterContainer>
      <FooterContent>
        <Quote>I live my life one hot chocolate at a time.</Quote>
        <IconsWrapper>
          <IconContainer>
            <a href="https://github.com/yuschick">
              <img src={GitHubIcon} alt="GitHub" />
            </a>
          </IconContainer>
          <IconContainer>
            <a href="https://twitter.com/Yuschick">
              <img src={TwitterIcon} alt="Twitter" />
            </a>
          </IconContainer>
          <IconContainer>
            <a href="https://medium.com/@Yuschick">
              <img src={MediumIcon} alt="Medium" />
            </a>
          </IconContainer>
          <IconContainer>
            <a href="https://www.goodreads.com/author/show/19160978.Daniel_Yuschick">
              <img src={GoodreadsIcon} alt="Goodreads" />
            </a>
          </IconContainer>
          <IconContainer>
            <a href="https://open.spotify.com/user/12164865821">
              <img src={SpotifyIcon} alt="Spotify" />
            </a>
          </IconContainer>
          <IconContainer>
            <a href="https://my.playstation.com/profile/yuschick">
              <img src={PlaystationIcon} alt="Playstation Network" />
            </a>
          </IconContainer>
          <IconContainer>
            <a href="https://www.instagram.com/yuschick">
              <img src={InstagramIcon} alt="Instagram" />
            </a>
          </IconContainer>
          <IconContainer>
            <a href="https://www.linkedin.com/in/danyuschick/">
              <img src={LinkedInIcon} alt="LinkedIn" />
            </a>
          </IconContainer>
        </IconsWrapper>
        <Copyright>Daniel Yuschick © {new Date().getFullYear()}</Copyright>
      </FooterContent>
    </section>
  )
}

const FooterContainer = styled.section`
  margin-top: 1rem;
  min-height: 100px;
  position: relative;
`

const PrimaryBlock = styled.div`
  background: ${ThemeColors.core.navy};
  -webkit-clip-path: polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%);
  clip-path: polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%);
  height: 80px;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
`

const SecondaryBlock = styled.div`
  background: ${ThemeColors.backgrounds.tertiary};
  -webkit-clip-path: polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%);
  clip-path: polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%);
  height: 80px;
  left: 0;
  position: absolute;
  top: 15px;
  width: 100%;
  z-index: 2;
`

const TertiaryBlock = styled.div`
  background: ${ThemeColors.core.darkGrey};
  -webkit-clip-path: polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%);
  clip-path: polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%);
  height: 80px;
  left: 0;
  position: absolute;
  top: 20px;
  width: 100%;
  z-index: 3;
`

const FooterContent = styled.footer`
  background: ${ThemeColors.core.darkGrey};
  color: ${ThemeColors.texts.lightBody};
  margin-top: -0.25rem;
  padding: 0.25rem 1rem 1rem 1rem;
  text-align: center;
`

const IconsWrapper = styled.section`
  align-items: center;
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
`

const IconContainer = styled.div`
  cursor: pointer;
  height: 22px;
  margin-right: 1rem;
  opacity: 0.7;
  transform: scale(1);
  transition: all 0.15s ease;
  width: 22px;

  &:hover {
    opacity: 1;
    transform: scale(1.25);
  }

  img {
    display: block;
  }

  &:last-child {
    margin: 0;
  }
`

const Copyright = styled.p`
  color: ${ThemeColors.texts.lightSecondary};
  font-size: 0.8rem;
  margin-top: 2rem;
`

const Quote = styled.q`
  display: inline-block;
  font-family: ${ThemeFonts.tertiary};
  font-size: 1.5rem;
  font-style: italic;
  margin-bottom: 1rem;
  position: relative;
`
export default Footer
