import { TimelineModel } from './timeline-model'

const getRandomColor = () => {
  return 'hsla(' + ~~(360 * Math.random()) + ',' + '70%,' + '80%,1)'
}

export const calcWidth = (zoomValue, audioLength) =>
  10 * zoomValue * zoomValue * audioLength

export const formatTimelineIntervals = pxPerSec => {
  var retval = 1
  if (pxPerSec >= 25 * 100) {
    retval = 0.01
  } else if (pxPerSec >= 25 * 40) {
    retval = 0.025
  } else if (pxPerSec >= 25 * 10) {
    retval = 0.1
  } else if (pxPerSec >= 25 * 4) {
    retval = 0.25
  } else if (pxPerSec >= 25) {
    retval = 1
  } else if (pxPerSec * 5 >= 25) {
    retval = 5
  } else if (pxPerSec * 15 >= 25) {
    retval = 15
  } else {
    retval = Math.ceil(0.5 / pxPerSec) * 60
  }
  return retval
}

export const assignColorsToTimelineRegions = (
  timeline: TimelineModel,
  audioLength: number
): TimelineModel => {
  const colorMap = new Map()
  timeline.regions.forEach(region => {
    const assignedColor = colorMap.get(region.label)
    if (!assignedColor) {
      colorMap.set(region.label, getRandomColor())
    }
  })

  return {
    name: timeline.name,
    regions: timeline.regions.map(region => {
      const percentStart = (region.start / audioLength) * 100
      const percentEnd = (region.end / audioLength) * 100
      const percentWidth = percentEnd - percentStart

      return {
        ...region,
        percentWidth,
        percentStart,
        showTooltip: percentWidth < 6,
        color: colorMap.get(region.label),
      }
    }),
  }
}

export const assignPositionsToAnnotations = (
  annotations: any,
  audioLength: number
) => {
  return annotations.map(annotation => {
    const percentTime = (annotation.time / audioLength) * 100
    return {
      ...annotation,
      percentTime,
      leftAlign: percentTime < 95,
    }
  })
}
