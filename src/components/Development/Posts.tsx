import React, { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"

import H3 from "components/H3"
import Error from "components/Error"
import LoadingIcon from "components/LoadingIcon"

import Post from "./Post"

import getRssToJson from "utils/getRssToJson"
import { PostsResponse, IPost } from "types/Development"

const Posts: React.FunctionComponent = () => {
  const [error, setError] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [posts, setPosts] = useState<IPost[]>([])

  useEffect(() => {
    setLoading(true)

    getRssToJson(`https://medium.com/feed/@Yuschick`)
      .then((data: PostsResponse) => {
        setPosts(data.items.filter((post: IPost) => post.categories.length))
      })
      .then(() => setLoading(false))
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [setPosts])

  return (
    <section>
      <H3>Posts</H3>
      {(loading || !posts) && !error ? (
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
