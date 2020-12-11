import React from "react"
import styled from "styled-components"

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
          data-show-replies="true"
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

  @supports (block-size: 1rem) {
    block-size: 225px;
  }

  @supports (padding-inline: 1rem) {
    padding-inline-end: 0.5rem;
  }
`

export default TwitterFeed
