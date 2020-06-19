/* eslint-disable */
const fetch = require("node-fetch")
exports.handler = async function (event, context) {
  try {
    console.log(event.headers)
    const response = await fetch(
      `${
        process.env.NODE_ENV === "development"
          ? "https://cors-anywhere.herokuapp.com/"
          : ""
      }https://api.twitter.com/1.1/statuses/user_timeline.json?username=yuschick&count=10&tweet_mode=extended`,
      {
        headers: { ...event.headers, Accept: "application/json" },
      }
    )
    if (!response.ok) {
      // NOT res.status >= 200 && res.status < 300
      return { statusCode: response.status, body: response.statusText }
    }
    const data = await response.json()

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    }
  } catch (err) {
    console.log(err) // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }), // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }
}
