import React from "react"
import styled from "styled-components"
import { format, parseISO } from "date-fns"
import { OutboundLink } from "gatsby-plugin-google-analytics"

import ThemeColors from "theme/colors"
import { IPost } from "types/Development"

import getReadingTime from "utils/getReadingTime"

interface Props {
  data: IPost
}

const Post: React.FunctionComponent<Props> = ({ data }) => (
  <PostItem key={data.pubDate}>
    <OutboundLink href={data.link}>
      {data.title.replace("&amp;", "&")}
    </OutboundLink>
    <PostDetailsContainer>
      <PostDetails>{format(parseISO(data.pubDate), "dd/MM/yyyy")}</PostDetails>
      <PostDetails>{getReadingTime(data)} min. read</PostDetails>
    </PostDetailsContainer>
  </PostItem>
)

const PostDetailsContainer = styled.div`
  display: flex;

  span + span {
    margin-left: 1rem;
  }
`

const PostDetails = styled.span`
  color: ${ThemeColors.texts.darkSecondary};
  font-size: 0.9rem;
  line-height: 1;
`

const PostItem = styled.li`
  margin-bottom: 1rem;

  &:last-child {
    margin: 0;
  }
`

export default Post
