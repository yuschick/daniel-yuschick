import React from "react"
import styled from "styled-components"

const ContentContainer: React.FunctionComponent = ({ children }) => {
  return <Section>{children}</Section>
}

const Section = styled.section`
  @supports (block-size: 1rem) {
    block-size: 100%;
  }

  @supports not (block-size: 1rem) {
    height: auto;
  }

  @supports (inline-size: 1rem) {
    max-inline-size: 1250px;
    inline-size: 90%;
  }

  @supports not (inline-size: 1rem) {
    max-width: 1250px;
    width: 90%;
  }

  @supports (margin-inline: 1rem) {
    margin-block: 0;
    margin-inline: auto;
  }

  @supports not (margin-inline: 1rem) {
    margin: 0 auto;
  }

  @supports (
    max-width: clamp(350px, 90vw, 1250px) and not
      (
        inline-size: 1rem,
      )
  ) {
    max-width: clamp(350px, 90vw, 1250px);
  }

  @supports (padding-inline: 1rem) {
    padding-block: 2rem;
    padding-inline: 0.5rem;
  }

  @supports not (padding-inline: 1rem) {
    padding: 2rem 0.5rem;
  }
`

export default ContentContainer
