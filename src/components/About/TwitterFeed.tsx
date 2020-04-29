import React from "react"
import styled from "styled-components"
import { TwitterTimelineEmbed } from "react-twitter-embed"

import LoadingIcon from "components/LoadingIcon"
import H3 from "components/H3"

const TwitterFeed: React.FunctionComponent = () => {
  return (
    <section>
      <H3>Twitter</H3>
      <ScrollContainer>
        <TwitterTimelineEmbed
          sourceType="profile"
          screenName="yuschick"
          noHeader
          noFooter
          transparent
          noBorders
          noScrollbar
          placeholder={<LoadingIcon />}
          options={{
            height: 230,
            tweetLimit: 10,
          }}
        />
      </ScrollContainer>
    </section>
  )
}

const ScrollContainer = styled.div`
  height: 225px;
  overflow: scroll;
  padding-right: 0.5rem;
`

export default TwitterFeed
