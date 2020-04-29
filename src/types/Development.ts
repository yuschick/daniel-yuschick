export interface PostsResponse {
  items: IPost[]
}

export interface IPost {
  title: string
  pubDate: string
  link: string
  content: string
  categories: string[]
}

export interface IProject {
  id: number
  title: string
  subtitle: string
  image: string
  live: string
  github?: string
  codepen?: string
}

export interface ICover {
  aspectRatio: number
  base64: string
  sizes: string
  src: string
  srcSet: string
}
