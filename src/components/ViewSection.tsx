import React from "react"
import styled from "styled-components"

const ViewSection: React.FunctionComponent = ({ children }) => {
  return <Section>{children}</Section>
}

const Section = styled.section`
  margin: 0 auto;
  max-width: min(max(350px, 100vw), 100%);

  @supports (max-width: clamp(350px, 100vw, 100%)) {
    max-width: clamp(350px, 100vw, 100%);
  }

  @supports (max-inline-size: clamp(350px, 100vw, 100%)) {
    max-inline-size: clamp(350px, 100vw, 100%);
  }

  @supports (margin-block: 1rem) {
    margin-block: 0;
    margin-inline: auto;
  }

  @supports (padding-block: 1rem) {
    padding-block-start: 2rem;
  }

  @supports not (padding-block: 1rem) {
    padding-top: 2rem;
  }
`

export default ViewSection
