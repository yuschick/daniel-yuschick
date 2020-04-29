import React from "react"
import styled from "styled-components"

import Loading from "assets/icons/ball-triangle.svg"

const LoadingIcon: React.FunctionComponent = () => {
  return (
    <Wrapper>
      <IconContainer>
        <img src={Loading} alt="Loading" />
      </IconContainer>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  align-content: center;
  display: flex;
  justify-content: center;
`

const IconContainer = styled.div`
  height: 35px;
  width: 35px;
`

export default LoadingIcon
