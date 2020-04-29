const loadScript = (src: string, id: string, callback: () => void) => {
  const existingScript = document.getElementById(id)

  if (!existingScript) {
    const script = document.createElement("script")
    script.src = src
    script.id = id
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (callback) callback()
    }
  }

  if (existingScript && callback) callback()
}

export const loadTwitter = (callback: () => void) => {
  return loadScript(
    "https://platform.twitter.com/widgets.js",
    "twitter-feed",
    callback
  )
}

export default loadScript
