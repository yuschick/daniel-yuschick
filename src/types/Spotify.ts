export interface ArtistData {
  items: Artist[];
}

export interface Artist {
  external_urls: ExternalUrls;
  id: string;
  images: Image[];
  name: string;
  popularity: number;
}

interface ExternalUrls {
  spotify: string;
}

interface Image {
  height: number;
  url: string;
  width: number;
}
