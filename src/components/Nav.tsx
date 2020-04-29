import React from "react"
import styled, { css } from "styled-components"
import { Link } from "gatsby"

import ThemeColors from "theme/colors"
import ThemeFonts from "theme/fonts"

const Nav: React.FunctionComponent = () => (
  <nav>
    <Navigation>
      <Item>
        <LinkText to="about" data-item="About" fromLeft>
          About
        </LinkText>
      </Item>
      <Item>
        <LinkText to="development" data-item="Development" fromTop>
          Development
        </LinkText>
      </Item>
      <Item>
        <LinkText to="writing" data-item="Writing" fromLeft>
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
  margin: 0;
  padding: clamp(0.3rem, 1vw, 0.5em);
`

const Item = styled.li`
  font-family: ${ThemeFonts.secondary};
  font-size: clamp(1rem, 2vw, 1.15rem);
  font-weight: 300;
  margin: 0 0.5em;
`

const LinkText = styled(Link)<{ fromLeft?: boolean; fromTop?: boolean }>`
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
  }

  ${props =>
    props.fromLeft &&
    css`
      :before {
        left: 0;
        transition: width 0.25s ease-in;
        width: 0;
      }

      &:hover:before {
        width: 100%;
      }
    `}

  ${props =>
    props.fromTop &&
    css`
      :before {
        left: 0;
        max-height: 0;
        transition: max-height 0.25s ease-in;
      }

      &:hover :before {
        max-height: 100%;
      }
    `}
`

export default Nav
