import React, { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"

import { useStoreActions, useStoreState } from "store"

import H3 from "components/H3"
import Error from "components/Error"
import LoadingIcon from "components/LoadingIcon"

import Post from "./Post"

import { IPost } from "types/Development"

const Posts: React.FunctionComponent = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const error: boolean = useStoreState(state => state.development.error)
  const posts: IPost[] | null = useStoreState(state => state.development.posts)
  const fetchPosts = useStoreActions(actions => actions.development.fetchPosts)

  useEffect(() => {
    if (posts && posts.length) return

    setLoading(true)
    fetchPosts().then(() => {
      setLoading(false)
    })
  }, [posts, fetchPosts, setLoading])

  return (
    <section>
      <H3>Posts</H3>
      {(loading || (posts && !posts.length)) && !error ? (
        <LoadingIcon />
      ) : error ? (
        <Error />
      ) : (
        posts && (
          <ul>
            {posts.map((post: IPost) => (
              <Post key={uuidv4()} data={post} />
            ))}
          </ul>
        )
      )}
    </section>
  )
}

export default Posts
