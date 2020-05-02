export interface Tweet {
  created_at: string
  entities: Entities
  user: User
  id: string
  full_text: string
}

export interface Entities {
  media?: Media[]
  hashtags?: Hashtags[]
  user_mentions?: UserMentions[]
}

export interface Media {
  indices: number[]
}
export interface Hashtags {
  text: string
  indices: number[]
}
export interface UserMentions {
  id: string
  indices: number[]
}

export interface User {
  name: string
  screen_name: string
  profile_image_url_https: string
}
