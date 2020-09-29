import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { v4 as uuidv4 } from "uuid"

import { useStoreActions, useStoreState } from "store"
import { ErrorTypes } from "./store"

import LoadingIcon from "components/LoadingIcon"
import H3 from "components/H3"
import Error from "components/Error"

import ThemeColors from "theme/colors"
import { Tweet, Url, Media, Hashtags, UserMentions } from "types/Twitter"

const TwitterFeed: React.FunctionComponent = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const error: ErrorTypes[] | null = useStoreState(state => state.about.error)
  const tweets: Tweet[] | null = useStoreState(state => state.about.tweets)
  const fetchTweets = useStoreActions(actions => actions.about.fetchTweets)

  useEffect(() => {
    if (tweets) return
    setLoading(true)

    fetchTweets().then(() => setLoading(false))
  }, [tweets, setLoading, fetchTweets])

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
      entities: { urls, media, hashtags, user_mentions },
    } = tweet
    const tweetText: string = tweet.full_text
    const entities: { text: string; el: JSX.Element }[] = []
    let formattedText: any = tweet.full_text

    if (!media && !urls && !hashtags?.length && !user_mentions?.length) {
      return <div>{formattedText}</div>
    }

    const entitiesArr = ([] as any[])
      .concat(urls, media, hashtags, user_mentions)
      .filter((e: any) => e)

    entitiesArr?.map((entity: Url | Hashtags | UserMentions | Media) => {
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

    entities?.map((entity: any) => {
      if (typeof formattedText === "string") {
        formattedText = formattedText.split(entity.text)
        formattedText.splice(1, 0, entity.el)
      } else {
        formattedText?.map((i: any, index: number) => {
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
        {loading ? (
          <LoadingIcon />
        ) : error?.includes("twitter") ? (
          <Error />
        ) : (
          tweets?.map((tweet: Tweet) => {
            let formattedTweet = formatTweetWithEntities(tweet)

            return (
              <TweetContainer key={uuidv4()}>
                <a href="https://twitter.com/Yuschick">
                  <Avatar
                    src={tweet.user.profile_image_url_https}
                    alt={tweet.user.screen_name}
                  />
                </a>
                <article>
                  <header>
                    <a href="https://twitter.com/Yuschick">
                      <Name>{tweet.user.name}</Name>
                    </a>
                    <ScreenName>@{tweet.user.screen_name}</ScreenName>
                  </header>
                  <TweetBody>{formattedTweet}</TweetBody>
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
  overflow: hidden auto;
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
  line-height: 1.25rem;
  font-size: min(max(0.9rem, 2vw), 1rem);
  padding: 0.5rem 0;

  @supports (font-size: clamp(0.9rem, 2vw, 1rem)) {
    font-size: clamp(0.9rem, 2vw, 1rem);
  }

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

export default TwitterFeed
