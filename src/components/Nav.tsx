import React from "react"
import styled from "styled-components"
import { Link } from "gatsby"

import ThemeColors from "theme/colors"
import ThemeFonts from "theme/fonts"

const Nav: React.FunctionComponent = () => (
  <nav>
    <Navigation>
      <Item>
        <LinkText to="/about" data-item="About" data-dir="left">
          About
        </LinkText>
      </Item>
      <Item>
        <LinkText to="/development" data-item="Development" data-dir="top">
          Development
        </LinkText>
      </Item>
      <Item>
        <LinkText to="/writing" data-item="Writing" data-dir="left">
          Writing
        </LinkText>
      </Item>
    </Navigation>
  </nav>
)

const Navigation = styled.ul`
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  list-style: none;
  margin: 0 auto;
  padding: min(max(0.3rem, 1vw), 0.5rem);
  width: max-content;

  @supports (padding: clamp(1px, 1, 1px)) {
    padding: clamp(0.3rem, 1vw, 0.5em);
  }

  @supports (inline-size: 1rem) {
    inline-size: max-content;
  }

  @supports (margin-block: 1rem) {
    margin-block: 0;
    margin-inline: auto;
  }

  @supports (padding-block: clamp(1px, 1, 1px)) {
    padding-block: clamp(0.3rem, 1vw, 0.5em);
    padding-inline: clamp(0.3rem, 1vw, 0.5em);
  }
`

const Item = styled.li`
  font-family: ${ThemeFonts.secondary};
  font-size: min(max(1rem, 2vw), 1.15rem);
  font-weight: 300;
  margin: 0 0.5em;

  @supports (font-size: clamp(1rem, 2vw, 1.15rem)) {
    font-size: clamp(1rem, 2vw, 1.15rem);
  }

  @supports (margin-block: 1rem) {
    margin-block: 0;
    margin-inline: 0.5rem;
  }
`

const LinkText = styled(Link)<{ fromLeft?: boolean; fromTop?: boolean }>`
  color: ${ThemeColors.core.lightGrey};
  display: block;
  overflow: hidden;
  position: relative;
  text-decoration: none;
  text-transform: uppercase;

  &:focus {
    outline: 1px solid ${ThemeColors.core.lightGrey};
  }

  &:visited,
  :active,
  :hover {
    color: ${ThemeColors.core.lightGrey};
    text-decoration: none;
  }

  &:before {
    color: ${ThemeColors.core.white};
    content: attr(data-item);
    overflow: hidden;
    position: absolute;
    top: 0;

    @supports (inset-block: 1rem) {
      inset-block-start: 0;
    }
  }

  &[data-dir="left"] {
    :before {
      left: 0;
      transition: width 0.25s ease-in;
      width: 0;

      @supports (inset-inline: 1rem) {
        inset-inline-start: 0;
      }

      @supports (inline-size: 1rem) {
        inline-size: 0;
      }
    }

    &:hover:before {
      width: 100%;

      @supports (inline-size: 1rem) {
        inline-size: 100%;
      }
    }
  }

  &[data-dir="top"] {
    :before {
      left: 0;
      max-height: 0;
      transition: max-height 0.25s ease-in;

      @supports (inset-inline: 1rem) {
        inset-inline-start: 0;
      }

      @supports (max-block-size: 1rem) {
        max-block-size: 0;
      }
    }

    &:hover :before {
      max-height: 100%;

      @supports (max-block-size: 1rem) {
        max-block-size: 100%;
      }
    }
  }
`

export default Nav
