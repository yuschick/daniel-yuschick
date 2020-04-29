const getRssToJson = async (url: string) => {
  const request = async (url: string) => {
    const base = "https://api.rss2json.com/v1/api.json?rss_url="
    const response = await fetch(`${base}${url}`)
    return response
  }

  return request(url).then((data: any) => data.json())
}

export default getRssToJson
