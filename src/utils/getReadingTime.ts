import { IPost } from "types/Development"

const strip = (html: string): string => {
  var doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent || ""
}

const getReadingTime = (post: IPost): number => {
  const wordsPerMinute = 250
  const text: string = strip(post.content)
  const wordcount = text.split(" ").length

  return Math.ceil(wordcount / wordsPerMinute)
}

export default getReadingTime
