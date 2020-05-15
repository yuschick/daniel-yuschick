import React from "react"
import styled from "styled-components"

const ViewSection: React.FunctionComponent = ({ children }) => {
  return <Section>{children}</Section>
}

const Section = styled.section`
  padding-top: 2rem;
  margin: 0 auto;
  max-width: min(max(350px, 100vw), 100%);

  @supports (max-width: clamp(350px, 100vw, 100%)) {
    max-width: clamp(350px, 100vw, 100%);
  }
`

export default ViewSection
