import { createStore } from "easy-peasy"

import storeModel from "./storeModel"

const store = createStore(storeModel, {
  injections: {},
})

export default store
