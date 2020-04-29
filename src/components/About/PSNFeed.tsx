import React, { useState } from "react"

import H3 from "components/H3"
import LoadingIcon from "components/LoadingIcon"

const PSNFeed: React.FunctionComponent = () => {
  const [loading, setLoading] = useState<boolean>(true)
  return (
    <section>
      <H3>PSN</H3>
      {loading && <LoadingIcon />}
      <a href="https://psnprofiles.com/yuschick">
        <img
          src="https://card.psnprofiles.com/2/yuschick.png"
          alt="Visit Yuschick on PSN Profiles"
          onLoad={() => setLoading(false)}
        />
      </a>
    </section>
  )
}

export default PSNFeed
