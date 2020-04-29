import React, { KeyboardEvent } from "react"
import styled, { css } from "styled-components"
import { navigate } from "gatsby"

import ThemeColors from "theme/colors"
import ThemeFonts from "theme/fonts"

const Nav: React.FunctionComponent = () => {
  const handleNav = (
    id: string,
    e?: React.KeyboardEvent<HTMLButtonElement>
  ) => {
    if (e && e.key !== "enter") return
    navigate(id)
  }

  return (
    <nav>
      <Navigation>
        <Item>
          <NavButton
            onClick={() => handleNav("about")}
            onKeyPress={(e: KeyboardEvent<HTMLButtonElement>) =>
              handleNav("about", e)
            }
            fromLeft
          >
            <span data-item="About">About</span>
          </NavButton>
        </Item>
        <Item>
          <NavButton
            onClick={() => handleNav("development")}
            onKeyPress={(e: KeyboardEvent<HTMLButtonElement>) =>
              handleNav("development", e)
            }
            fromTop
          >
            <span data-item="Development">Development</span>
          </NavButton>
        </Item>
        <Item>
          <NavButton
            onClick={() => handleNav("writing")}
            onKeyPress={(e: KeyboardEvent<HTMLButtonElement>) =>
              handleNav("writing", e)
            }
            fromLeft
          >
            <span data-item="Writing">Writing</span>
          </NavButton>
        </Item>
      </Navigation>
    </nav>
  )
}

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

const NavButton = styled.button.attrs(() => ({
  type: "button",
}))<{ fromLeft?: boolean; fromRight?: boolean; fromTop?: boolean }>`
  background: transparent;
  border: 0;
  box-shadow: 0;
  cursor: pointer;
  margin: 0;
  outline: 0;
  overflow: hidden;
  padding: 0;
  position: relative;

  span {
    color: ${ThemeColors.core.lightGrey};
    text-transform: uppercase;

    &:before {
      color: ${ThemeColors.core.white};
      content: attr(data-item);
      overflow: hidden;
      position: absolute;
      top: 0;
    }
  }

  ${props =>
    props.fromLeft &&
    css`
      span:before {
        left: 0;
        transition: width 0.25s ease-in;
        width: 0;
      }

      &:hover span:before {
        width: 100%;
      }
    `}

  ${props =>
    props.fromTop &&
    css`
      span:before {
        left: 0;
        max-height: 0;
        transition: max-height 0.25s ease-in;
      }

      &:hover span:before {
        max-height: 100%;
      }
    `}
`

export default Nav
