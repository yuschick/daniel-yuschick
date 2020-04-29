import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { SpotifyApiContext, UserTop } from "react-spotify-api"

import H3 from "components/H3"
import LoadingIcon from "components/LoadingIcon"
import ListContent from "components/ListContent"
import Error from "components/Error"

import { ArtistData, Artist } from "types/Spotify"

const SpotifyFeed: React.FunctionComponent = () => {
  const [fetching, setFetching] = useState<boolean>()
  const [error, setError] = useState<boolean>()
  const [token, setToken] = useState<string>()

  useEffect(() => {
    const getToken = async () => {
      // const response = await fetch(
      //   "https://cors-anywhere.herokuapp.com/https://accounts.spotify.com/api/token?grant_type=client_credentials&scope=user-top-read",
      //   {
      //     method: "POST",
      //     headers: {
      //       Authorization: `Basic ${new Buffer(
      //         `${process.env.GATSBY_SPOTIFY_CLIENT}:${process.env.GATSBY_SPOTIFY_SECRET}`
      //       ).toString("base64")}`,
      //       "Content-Type": "application/x-www-form-urlencoded",
      //     },
      //   }
      // )

      const response = await fetch(
        `https://cors-anywhere.herokuapp.com/https://accounts.spotify.com/authorize?${new URLSearchParams(
          {
            client_id: process.env.GATSBY_SPOTIFY_CLIENT || "",
            response_type: "token",
            redirect_uri: "http://localhost:8000/",
            scope: "user-top-read",
          }
        )}`
      )

      if (response.ok) {
        const data = await response.json()
        console.log(data)
        return data
      } else {
        console.log(response)
      }
    }

    setFetching(true)
    getToken()
      .then((data: any) => {
        localStorage.setItem("yuschick-spotify-token", data.access_token)
        setToken(data.access_token)
        setFetching(false)
      })
      .catch(() => {
        setFetching(false)
        setError(true)
      })

    return () => localStorage.removeItem("yuschick-spotify-token")
  }, [])

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
        console.log(data)
      }
    }

    setFetching(true)
    getTopArtists()
      .then((data: any) => {
        setFetching(false)
      })
      .catch(() => {
        setFetching(false)
        setError(true)
      })
  }, [token])

  interface ArtistResponse {
    data: ArtistData
    loading: boolean
    error: any
  }

  return (
    <section>
      <H3>Spotify</H3>
      {fetching || !token ? (
        <LoadingIcon />
      ) : error ? (
        <Error />
      ) : (
        <ScrollContainer>
          <SpotifyApiContext.Provider
            value={
              "BQBfahV4MQh44rP_qjFR27sXM14AlhhoWJDNhruEbxVqI5PcskfDCu4z_RhkPt1UbGL59IvqnG4KiAD9AZq0rT2cQroDlKaITqq3TFhsGbs0u_Fesl6cPlVqRMgNAEKZE1NBG0mA49Pwr2E_7xf9Mr2cnUULKzHl41VouGj-jKPMZRrF8kFA4hjVJ4D03cfDXsfe_xzsNBU8DRTMc-0or71DIJHxwb9I6VLsaw37UOOnGmRDnsehxamWEkX1IwKM60raaGo2opq75rw"
            }
          >
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
                        <ListContent.Header>
                          Recent top artists
                        </ListContent.Header>
                        <ListContent.Content>
                          <ArtistList>
                            {data.items.slice(0, 9).map((artist: Artist) => (
                              <li key={artist.id}>
                                <a href={artist.external_urls.spotify}>
                                  <img
                                    src={
                                      artist.images[artist.images.length - 1]
                                        .url
                                    }
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
          </SpotifyApiContext.Provider>
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
