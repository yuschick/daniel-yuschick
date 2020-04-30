import aboutModel, { AboutModel } from "components/About/store"
import developmentModel, {
  DevelopmentModel,
} from "components/Development/store"
import writingModel, { WritingModel } from "components/Writing/store"

export interface StoreModel {
  about: AboutModel
  development: DevelopmentModel
  writing: WritingModel
}

const storeModel: StoreModel = {
  about: aboutModel,
  development: developmentModel,
  writing: writingModel,
}

export default storeModel
