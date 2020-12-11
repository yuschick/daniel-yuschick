import React from "react"
import styled from "styled-components"

import ThemeColors from "theme/colors"

const Block: React.FunctionComponent = ({ children }) => {
  return <article>{children}</article>
}

const Header: React.FunctionComponent = ({ children }) => {
  return (
    <HeaderContainer>
      <Square />
      {children}
    </HeaderContainer>
  )
}

const Content: React.FunctionComponent = ({ children }) => {
  return <SubSection>{children}</SubSection>
}

const HeaderContainer = styled.header`
  align-items: center;
  display: flex;
  font-weight: 500;
`

const Square = styled.div`
  background: ${ThemeColors.core.orange};
  height: 12px;
  margin-right: 0.5rem;
  width: 12px;

  @supports (block-size: 1rem) {
    block-size: 12px;
  }

  @supports (inline-size: 1rem) {
    inline-size: 12px;
  }

  @supports (margin-inline: 1rem) {
    margin-inline-end: 0.5rem;
  }
`

const SubSection = styled.main`
  margin: 0.5rem 0 0.5rem 1rem;
  padding-left: 1rem;

  @supports (border-inline: 1rem) {
    border-inline-start: 1px solid ${ThemeColors.core.lightGrey};
  }

  @supports not (border-inline: 1rem) {
    border-left: 1px solid ${ThemeColors.core.lightGrey};
  }

  @supports (padding-inline: 1rem) {
    padding-inline-start: 1rem;
  }

  @supports (margin-inline: 1rem) {
    margin-block: 0.5rem;
    margin-inline-end: 1rem;
    margin-inline-start: 0;
  }
`

export default {
  Block,
  Header,
  Content,
}
