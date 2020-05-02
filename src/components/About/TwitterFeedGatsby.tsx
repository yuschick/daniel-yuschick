import React from "react"
import styled from "styled-components"
import { useStaticQuery, graphql } from "gatsby"
import { v4 as uuidv4 } from "uuid"

import LoadingIcon from "components/LoadingIcon"
import H3 from "components/H3"

import ThemeColors from "theme/colors"
import { Tweet, Media, Hashtags, UserMentions } from "types/Twitter"

const TwitterFeedGatsby: React.FunctionComponent = () => {
  const {
    allTwitterStatusesUserTimelineQuery: { edges: tweets },
  } = useStaticQuery(graphql`
    query TimelineQuery {
      allTwitterStatusesUserTimelineQuery(limit: 10) {
        edges {
          node {
            created_at
            entities {
              media {
                indices
              }
              hashtags {
                text
                indices
              }
              user_mentions {
                id
                indices
              }
            }
            user {
              name
              screen_name
              profile_image_url_https
            }
            id
            full_text
          }
        }
      }
    }
  `)

  const getEntityAnchor = (
    type: "user_mentions" | "hashtags" | "media",
    val: string
  ): JSX.Element => {
    let enhancedURL: string = ""

    switch (type) {
      case "user_mentions":
        enhancedURL = `https://twitter.com/${val.replace("@", "")}`
        break
      case "hashtags":
        enhancedURL = `https://twitter.com/hashtag/${val.replace("#", "")}`
        break
      default:
        enhancedURL = val
    }

    return (
      <a key={uuidv4()} href={enhancedURL}>
        {val}
      </a>
    )
  }

  const formatTweetWithEntities = (tweet: Tweet) => {
    const {
      entities: { media, hashtags, user_mentions },
    } = tweet
    const tweetText: string = tweet.full_text
    const entities: { text: string; el: JSX.Element }[] = []
    let formattedText: any = tweet.full_text

    if (!media && !hashtags?.length && !user_mentions?.length) {
      return <div>{formattedText}</div>
    }

    const entitiesArr = ([] as any[])
      .concat(media, hashtags, user_mentions)
      .filter((e: any) => e)

    entitiesArr?.map((entity: Media | Hashtags | UserMentions) => {
      const [start, end] = entity.indices
      const entityText = tweetText.slice(start, end)
      const entityType =
        entityText.charAt(0) === "#"
          ? "hashtags"
          : entityText.charAt(0) === "@"
          ? "user_mentions"
          : "media"
      entities.push({
        text: entityText,
        el: getEntityAnchor(entityType, entityText),
      })
    })

    entities.map((entity: any) => {
      if (typeof formattedText === "string") {
        formattedText = formattedText.split(entity.text)
        formattedText.splice(1, 0, entity.el)
      } else {
        formattedText.map((i: any, index: number) => {
          if (typeof i === "string" && i.includes(entity.text)) {
            i = i.split(entity.text)
            i.splice(1, 0, entity.el)
            formattedText.splice(index, 1, ...i)
          }
        })
      }

      formattedText = formattedText.filter((i: any) => i)
    })

    return <div>{formattedText}</div>
  }

  return (
    <section>
      <H3>Twitter</H3>
      <ScrollContainer>
        {!tweets ? (
          <LoadingIcon />
        ) : (
          tweets.map((tweet: any) => {
            const { node: t }: any = tweet
            let formattedTweet = formatTweetWithEntities(t)

            return (
              <TweetContainer key={uuidv4()}>
                <Avatar
                  src={t.user.profile_image_url_https}
                  alt={t.user.screen_name}
                />
                <article>
                  <header>
                    <Name>{t.user.name}</Name>
                    <ScreenName>@{t.user.screen_name}</ScreenName>
                    <TweetBody>{formattedTweet}</TweetBody>
                  </header>
                </article>
              </TweetContainer>
            )
          })
        )}
      </ScrollContainer>
    </section>
  )
}

const ScrollContainer = styled.div`
  height: 225px;
  overflow: scroll;
  padding-right: 0.5rem;
`

const TweetContainer = styled.div`
  align-items: start;
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: minmax(20px, 35px) auto;
  line-height: 1em;
  margin-bottom: 1rem;

  &:last-child {
    margin: 0;
  }
`

const Avatar = styled.img`
  border-radius: 50%;
`

const Name = styled.p`
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
`

const ScreenName = styled.p`
  font-size: 0.75rem;
  font-weight: 300;
`

const TweetBody = styled.div`
  @supports not (clamp()) {
    font-size: min(max(0.9rem, 2vw), 1rem);
  }
  line-height: 1.25rem;
  font-size: clamp(0.9rem, 2vw, 1rem);
  padding: 0.5rem 0;

  a,
  a:visited,
  a:active {
    color: ${ThemeColors.core.orange};
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`

export default TwitterFeedGatsby
