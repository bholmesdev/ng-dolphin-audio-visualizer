export interface RegionModel {
  start: number
  end: number
  label: string
  cssStyles: Object
  highlighted: Boolean
}

export interface TimelineModel {
  name: string
  regions: Array<RegionModel>
}
