export interface Device {
  deviceId: string
  label: string
}

export interface ProductInfo {
  name: string
  description: string
}

export interface IngredientsResponse {
  ingredients: string[]
  vegetarian: boolean
  containsMeat: boolean
  containsFish: boolean
  isVegan: boolean
  note: string
}

export interface BaseEarthquake {
  time: string
  magnitude: string
  location: {
    code: string
    coordinate: string
  }
  comments: {
    hasTsunamiWarning: boolean
  }
}

export interface DetailedEarthquake extends BaseEarthquake {
  maxInt: string
  regions: Array<{
    prefecture: string
    areas: Array<{
      area_code: string
      cities: Array<{
        city_code: string
      }>
    }>
  }>
}

export type EarthquakeData = {
  data: {
    detailed: DetailedEarthquake[]
    basic: BaseEarthquake[]
  }
  last_updated: string
}
