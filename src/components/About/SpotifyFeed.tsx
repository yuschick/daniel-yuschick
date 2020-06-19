import React, { useState, useEffect } from "react"
import styled from "styled-components"

import { useStoreActions, useStoreState } from "store"
import { ErrorTypes } from "./store"

import H3 from "components/H3"
import LoadingIcon from "components/LoadingIcon"
import ListContent from "components/ListContent"
import Error from "components/Error"

import { Artist } from "types/Spotify"

const SpotifyFeed: React.FunctionComponent = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const error: ErrorTypes[] | null = useStoreState(state => state.about.error)
  const artists: Artist[] | null = useStoreState(state => state.about.artists)
  const fetchArtists = useStoreActions(actions => actions.about.fetchArtists)

  useEffect(() => {
    if (artists) return

    setLoading(true)
    fetchArtists().then(() => setLoading(false))
  }, [artists, fetchArtists])

  return (
    <section>
      <H3>Spotify</H3>
      <ScrollContainer>
        {loading ? (
          <LoadingIcon />
        ) : error?.includes("spotify") ? (
          <Error />
        ) : (
          <ScrollContainer>
            <ListContent.Block>
              <ListContent.Header>Recent top artists</ListContent.Header>
              <ListContent.Content>
                <ArtistList>
                  {artists?.map((artist: Artist) => (
                    <li key={artist.id}>
                      <a href={artist.external_urls.spotify}>
                        <img
                          src={artist.images[artist.images.length - 1].url}
                          alt={artist.name}
                        />
                      </a>
                      <p>
                        <a href={artist.external_urls.spotify}>{artist.name}</a>
                      </p>
                    </li>
                  ))}
                </ArtistList>
              </ListContent.Content>
            </ListContent.Block>
          </ScrollContainer>
        )}
      </ScrollContainer>
    </section>
  )
}

const ScrollContainer = styled.div`
  height: 250px;
  overflow: hidden auto;
  padding-right: 0.5rem;
`

const ArtistList = styled.ul`
  display: grid;
  font-size: 0.8rem;
  grid-gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
  grid-auto-flow: row;
  text-align: center;
  width: 100%;

  img {
    object-fit: cover;
    height: 125px;
    width: 125px;
  }
`

export default SpotifyFeed
