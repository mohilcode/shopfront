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
