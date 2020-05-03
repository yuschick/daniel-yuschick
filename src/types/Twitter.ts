export interface Tweet {
  created_at: string
  full_text: string
  entities: Entities
  user: User
}

export interface Entities {
  hashtags?: Hashtags[]
  user_mentions?: UserMentions[]
  media?: Media[]
}

export interface Hashtags {
  text: string
  indices: number[]
}

export interface Media {
  display_url: string
  indices: number[]
}

export interface UserMentions {
  screen_name: string
  name: string
  id: number
  id_str: string
  indices: number[]
}

export interface Urls {
  url: string
  expanded_url: string
  display_url: string
  indices: number[]
}

export interface User {
  name: string
  screen_name: string
  profile_image_url_https: string
}
