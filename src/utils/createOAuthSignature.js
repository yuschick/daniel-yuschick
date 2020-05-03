/*
  Endless props goes to https://imagineer.in/blog/authorizing-twitter-api-calls-in-javascript/
*/

import jsSHA from "jssha"

function oAuthBaseString(method, url, params, key, token, timestamp, nonce) {
  return (
    method +
    "&" +
    percentEncode(url) +
    "&" +
    percentEncode(genSortedParamStr(params, key, token, timestamp, nonce))
  )
}

function oAuthSigningKey(consumer_secret, token_secret) {
  return consumer_secret + "&" + token_secret
}

function oAuthSignature(base_string, signing_key) {
  var signature = hmac_sha1(base_string, signing_key)
  return percentEncode(signature)
}

function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!*()']/g, character => {
    return "%" + character.charCodeAt(0).toString(16)
  })
}

function hmac_sha1(string, secret) {
  let shaObj = new jsSHA("SHA-1", "TEXT")
  shaObj.setHMACKey(secret, "TEXT")
  shaObj.update(string)
  let hmac = shaObj.getHMAC("B64")
  return hmac
}

function mergeObjs(obj1, obj2) {
  for (var attr in obj2) {
    obj1[attr] = obj2[attr]
  }
  return obj1
}

function genSortedParamStr(params, key, token, timestamp, nonce) {
  // Merge oauth params & request params to single object
  let paramObj = mergeObjs(
    {
      oauth_consumer_key: key,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: token,
      oauth_version: "1.0",
    },
    params
  )
  // Sort alphabetically
  let paramObjKeys = Object.keys(paramObj)
  let len = paramObjKeys.length
  paramObjKeys.sort()
  // Interpolate to string with format as key1=val1&key2=val2&...
  let paramStr = paramObjKeys[0] + "=" + paramObj[paramObjKeys[0]]
  for (var i = 1; i < len; i++) {
    paramStr +=
      "&" +
      paramObjKeys[i] +
      "=" +
      percentEncode(decodeURIComponent(paramObj[paramObjKeys[i]]))
  }
  return paramStr
}

const createOAuthSignature = () => {
  const consumerKey = process.env.GATSBY_TWITTER_KEY,
    consumerSecret = process.env.GATSBY_TWITTER_SECRET,
    accessToken = process.env.GATSBY_TWITTER_TOKEN,
    accessTokenSecret = process.env.GATSBY_TWITTER_TOKEN_SECRET
  let timestamp = Math.round(Date.now() / 1000)
  let nonce = btoa(consumerKey + ":" + timestamp)
  let baseString = oAuthBaseString(
    "GET",
    "https://api.twitter.com/1.1/statuses/user_timeline.json",
    {
      username: "yuschick",
      count: 10,
      tweet_mode: "extended",
      exclude_replies: true,
      include_rts: false,
    },
    consumerKey,
    accessToken,
    timestamp,
    nonce
  )
  let signingKey = oAuthSigningKey(consumerSecret, accessTokenSecret)
  let signature = oAuthSignature(baseString, signingKey)

  const headers = new Headers()
  headers.append(
    "Authorization",
    `OAuth oauth_consumer_key="${process.env.GATSBY_TWITTER_KEY}",oauth_token="${process.env.GATSBY_TWITTER_TOKEN}",oauth_signature_method="HMAC-SHA1",oauth_timestamp="${timestamp}",oauth_nonce="${nonce}",oauth_version="1.0",oauth_signature="${signature}"`
  )
  headers.append(
    "Cookie",
    'personalization_id="v1_WnrLt1ga8HShhPQZThpPdw=="; guest_id=v1%3A158848941581923308; lang=en'
  )

  return headers
}

export default createOAuthSignature
