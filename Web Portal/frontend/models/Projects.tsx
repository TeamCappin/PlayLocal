export type ProjectRecord = {
  address: string
  district: string
  type: string
  decisionStatus: string
  projectStatus: string
  architect: string
  units: string | number | null
  floors: string | number | null
  buildingCategories: string[]
  buildingTypes: string[]
  lastUpdate: string
  media: string | null
}
