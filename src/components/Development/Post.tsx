import React from "react"
import styled from "styled-components"
import { format } from "date-fns"

import ThemeColors from "theme/colors"
import { IPost } from "types/Development"

interface Props {
  data: IPost
}

const Post: React.FunctionComponent<Props> = ({ data }) => {
  const strip = (html: string): string => {
    var doc = new DOMParser().parseFromString(html, "text/html")
    return doc.body.textContent || ""
  }

  const getReadingTime = (content: string): number => {
    const wordsPerMinute = 250
    const text: string = strip(content)
    const wordcount = text.split(" ").length

    return Math.ceil(wordcount / wordsPerMinute)
  }

  return (
    <PostItem key={data.pubDate}>
      <a href={data.link} dangerouslySetInnerHTML={{ __html: data.title }} />
      <PostDetailsContainer>
        <PostDetails>
          {format(new Date(data.pubDate), "dd/MM/yyyy")}
        </PostDetails>
        <PostDetails>{getReadingTime(data.content)} min. read</PostDetails>
      </PostDetailsContainer>
    </PostItem>
  )
}

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
