export interface ArtistData {
  items: Artist[]
}

export interface Artist {
  external_urls: ExternalUrls
  id: string
  images: Image[]
  name: string
  popularity: number
}

interface ExternalUrls {
  spotify: string
}

interface Image {
  height: number
  url: string
  width: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}
