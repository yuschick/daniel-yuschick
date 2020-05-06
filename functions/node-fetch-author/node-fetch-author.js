/* eslint-disable */
const fetch = require("node-fetch")
exports.handler = async function (event, context) {
  try {
    const url = new URL(
      `/author/list/19160978?format=xml&key=${process.env.GATSBY_GOODREADS_KEY}`,
      "https://www.goodreads.com"
    )
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    })
    const xmlText = await response.text()

    return {
      statusCode: 200,
      body: xmlText,
    }
  } catch (err) {
    console.log(err) // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }), // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }
}
