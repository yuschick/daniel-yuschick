import React from "react"
import styled from "styled-components"
import { UserTop } from "react-spotify-api"

import H3 from "components/H3"
import LoadingIcon from "components/LoadingIcon"
import ListContent from "components/ListContent"
import Error from "components/Error"

import { ArtistData, Artist } from "types/Spotify"

const SpotifyFeed: React.FunctionComponent = () => {
  interface ArtistResponse {
    data: ArtistData
    loading: boolean
    error: any
  }

  return (
    <section>
      <H3>Spotify</H3>
      <ScrollContainer>
        <UserTop type="artists">
          {({ data, loading, error }: ArtistResponse) => {
            return loading ? (
              <LoadingIcon />
            ) : error ? (
              <Error />
            ) : (
              data && (
                <ListContent.Block>
                  <ListContent.Header>Recent top artists</ListContent.Header>
                  <ListContent.Content>
                    <ArtistList>
                      {data.items.slice(0, 9).map((artist: Artist) => (
                        <li key={artist.id}>
                          <a href={artist.external_urls.spotify}>
                            <img
                              src={artist.images[artist.images.length - 1].url}
                              alt={artist.name}
                            />
                          </a>
                          <p>
                            <a href={artist.external_urls.spotify}>
                              {artist.name}
                            </a>
                          </p>
                        </li>
                      ))}
                    </ArtistList>
                  </ListContent.Content>
                </ListContent.Block>
              )
            )
          }}
        </UserTop>
      </ScrollContainer>
    </section>
  )
}

const ScrollContainer = styled.div`
  height: 225px;
  overflow: scroll;
  padding-right: 0.5rem;
`

const ArtistList = styled.ul`
  display: grid;
  font-size: 0.8rem;
  grid-gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
  grid-auto-flow: row dense;
  text-align: center;
  width: 100%;

  img {
    object-fit: cover;
    height: 125px;
    width: 125px;
  }
`

export default SpotifyFeed
