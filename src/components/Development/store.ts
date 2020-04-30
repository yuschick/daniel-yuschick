import { Action, action, Thunk, thunk } from "easy-peasy"

import { IPost, PostsResponse } from "types/Development"
import getRssToJson from "utils/getRssToJson"

export interface DevelopmentModel {
  error: boolean
  posts: IPost[] | null

  setError: Action<DevelopmentModel, boolean>
  setPosts: Action<DevelopmentModel, IPost[]>

  fetchPosts: Thunk<DevelopmentModel>
}

const storeModel: DevelopmentModel = {
  error: false,
  posts: [],

  setError: action((state, payload) => {
    state.error = payload
  }),

  setPosts: action((state, payload) => {
    state.posts = payload
  }),

  fetchPosts: thunk(async actions => {
    try {
      getRssToJson(`https://medium.com/feed/@Yuschick`).then(
        (data: PostsResponse) => {
          const posts: IPost[] = data.items.filter(
            (post: IPost) => post.categories.length
          )
          actions.setPosts(posts)
        }
      )
    } catch (error) {
      actions.setError(true)
    }
  }),
}

export default storeModel
