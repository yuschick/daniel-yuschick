import React from "react"
import { StoreProvider } from "easy-peasy"

import store from "store"

const Provider: React.FunctionComponent<any> = ({ element }) => (
  <StoreProvider store={store}>{element}</StoreProvider>
)

export default Provider
