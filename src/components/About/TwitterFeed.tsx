import React from "react"
import styled from "styled-components"

import { ErrorTypes } from "./store"

import H3 from "components/H3"

const TwitterFeed: React.FunctionComponent = () => {
  return (
    <section>
      <H3>Twitter</H3>
      <ScrollContainer>
        <a
          className="twitter-timeline"
          data-dnt="true"
          href="https://twitter.com/Yuschick"
          data-chrome="nofooter noborders noheader transparent noscrollbar"
          data-tweet-limit="10"
        >
          Tweets by Yuschick
        </a>
      </ScrollContainer>
    </section>
  )
}

const ScrollContainer = styled.div.attrs(() => ({
  id: "container",
}))`
  height: 225px;
  overflow: hidden auto;
  padding-right: 0.5rem;
`

export default TwitterFeed
