import React, { useState, useEffect } from "react"
import styled from "styled-components"

import H3 from "components/H3"
import LoadingIcon from "components/LoadingIcon"
import ListContent from "components/ListContent"
import Error from "components/Error"

import { ArtistData, Artist } from "types/Spotify"

const SpotifyFeed: React.FunctionComponent = () => {
  const [fetching, setFetching] = useState<boolean>()
  const [error, setError] = useState<boolean>()
  const [token, setToken] = useState<string>()
  const [artists, setArtists] = useState<Artist[]>()

  useEffect(() => {
    const getToken = async () => {
      const response = await fetch(
        "https://cors-anywhere.herokuapp.com/https://accounts.spotify.com/api/token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${new Buffer(
              `${process.env.GATSBY_SPOTIFY_CLIENT}:${process.env.GATSBY_SPOTIFY_SECRET}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: process.env.GATSBY_SPOTIFY_REFRESH_TOKEN || "",
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        return data
      }
    }

    setFetching(true)
    getToken()
      .then((data: any) => {
        setToken(data.access_token)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => {
        setFetching(false)
      })
  }, [setFetching, setError, setToken])

  useEffect(() => {
    if (!token) return

    const getTopArtists = async () => {
      const response = await fetch(
        "https://api.spotify.com/v1/me/top/artists",
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = response.json()
        return data
      }
    }

    setFetching(true)
    getTopArtists()
      .then((data: ArtistData) => {
        setArtists(data.items.slice(0, 9))
        setFetching(false)
      })
      .catch(() => {
        setFetching(false)
        setError(true)
      })
  }, [token])

  return (
    <section>
      <H3>Spotify</H3>
      {fetching ? (
        <LoadingIcon />
      ) : error ? (
        <Error />
      ) : (
        <ScrollContainer>
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
        </ScrollContainer>
      )}
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
