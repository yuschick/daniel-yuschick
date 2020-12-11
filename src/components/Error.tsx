import React from "react"
import styled from "styled-components"

import DoomError from "images/doomguy-error.gif"

import ThemeFonts from "theme/fonts"

interface Props {
  msg?: string
}

const Error: React.FunctionComponent<Props> = ({
  msg = "An error occurred",
}) => {
  return (
    <Container>
      <Img src={DoomError} alt="Cyber demon Error" />
      <span>{msg}</span>
    </Container>
  )
}

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  font-family: ${ThemeFonts.tertiary};
  font-size: 1.5rem;
  font-weight: 500;
  text-align: center;
  text-transform: uppercase;
`

const Img = styled.img`
  height: auto;
  margin: 1rem 0;
  width: 100px;

  @supports (inline-size: 1rem) {
    inline-size: 100px;
  }

  @supports (margin-inline: 1rem) {
    margin-block: 1rem;
    margin-inline: 0;
  }
`

export default Error
