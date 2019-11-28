import { Component, OnInit, NgZone } from '@angular/core'
import WaveSurfer from 'wavesurfer.js'
import SpectrogramPlugin from 'wavesurfer.js/src/plugin/spectrogram'
import RegionPlugin from 'wavesurfer.js/src/plugin/regions'
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js'
import { audioFile, audioLength, timelines } from '../../assets/dolphin-data.js'
import { TimelineModel } from './timeline-model'
import { ChangeContext } from 'ng5-slider'
import {
  assignColorsToTimelineRegions,
  formatTimelineIntervals,
  calcWidth,
  assignPositionsToAnnotations,
} from './timeline-helpers'

@Component({
  selector: 'app-wave-visualization',
  templateUrl: './wave-visualization.component.html',
  styleUrls: ['./wave-visualization.component.scss'],
})
export class WaveVisualizationComponent implements OnInit {
  waveInstance: WaveSurfer
  timelines: Array<TimelineModel> = []
  waveformWidth: number = 0
  translateOnScroll: string = ''
  playbackTime: number = 0
  currAnnotationIndex: number = -1
  loading: boolean
  zooming: boolean
  exampleAnnotations: any = [
    {
      time: 0,
      description: 'PLAY TAIL CALVES STARTLE',
    },
    {
      time: 4.5,
      description: 'NEMATOCYST THROAT?',
    },
    {
      time: 9,
      description:
        'NEMATOCYST BUBBLES THREE MALE COALITION CALVES FONDUE VERDE NEMATOCYST?',
    },
  ]

  //ng-5 slider options
  zoomSliderOptions = {
    initialValue: 5,
    options: {
      floor: 1,
      ceil: 8,
      step: 1,
      showTicksValues: true,
      ticksArray: [1, 2, 3, 5, 8],
      translate: (value: number): string => {
        return value + 'x'
      },
    },
  }

  constructor(public zone: NgZone) {
    this.loading = true
    this.zooming = false
    this.timelines = []
  }

  ngOnInit() {
    timelines.forEach((timeline: TimelineModel) => {
      const coloredTimeline = assignColorsToTimelineRegions(
        timeline,
        audioLength
      )
      this.timelines.push(coloredTimeline)
    })

    this.exampleAnnotations = assignPositionsToAnnotations(
      this.exampleAnnotations,
      audioLength
    )

    if (this.waveInstance != null) {
      this.waveInstance.destroy()
    }

    this.waveInstance = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#ddd',
      progressColor: '#333',
      normalize: true,
      plugins: [
        RegionPlugin.create(),
        SpectrogramPlugin.create({
          container: '#spectrogram',
          labels: true,
        }),
        TimelinePlugin.create({
          container: '#wave-timeline',
          timeInterval: formatTimelineIntervals,
        }),
      ],
    })
    this.waveInstance.load(`../assets/${audioFile}`)
    this.zoomWaveform(this.zoomSliderOptions.initialValue)

    this.waveInstance.on('scroll', event => {
      this.translateOnScroll = `translateX(${-event.target.scrollLeft}px)`
    })

    // Update current playback time as audio plays
    this.waveInstance.on('audioprocess', playbackTime =>
      this.playbackHandler(playbackTime)
    )

    // Update current playback time when user manually moves playhead
    this.waveInstance.on('seek', percentScrubbed =>
      this.playbackHandler(percentScrubbed * audioLength)
    )

    this.waveInstance.on('ready', () => {
      this.loading = false
      this.playbackHandler(0)
    })
  }

  playbackHandler(playbackTime) {
    let annotationText = ''

    const annotationEls: NodeListOf<HTMLElement> = document.querySelectorAll(
      '.annotations.timeline > .annotation'
    )
    const playbackTimeAsPercentage = (playbackTime / audioLength) * 100

    for (const annotationEl of Array.from(annotationEls).reverse()) {
      // walk through the annotations back to front
      // if an annotation starts before the playhead, display that one (since it's the closest to the playhead)
      try {
        const annotationTimeAsPercentage = parseInt(
          annotationEl.getAttribute('data-timestamp')
        )
        if (annotationTimeAsPercentage <= playbackTimeAsPercentage) {
          annotationText += annotationEl.querySelector('button').innerText
          annotationText += '\n'
          break
        }
      } catch (e) {
        console.error(e)
      }
    }

    const regionEls: NodeListOf<HTMLElement> = document.querySelectorAll(
      '.clusters.timeline > .cluster'
    )

    for (const regionEl of Array.from(regionEls)) {
      const startTime = regionEl.getAttribute('data-start')
      const endTime = regionEl.getAttribute('data-end')
      if (startTime <= playbackTime && endTime >= playbackTime) {
        regionEl.classList.add('highlighted')
        annotationText += regionEl.innerText
        annotationText += '\n'
      } else {
        regionEl.classList.remove('highlighted')
      }
    }

    this.zone.run(() => {
      this.currAnnotation = annotationText
      this.playbackTime = playbackTime.toFixed(2)
    })
  }

  selectAnnotation(percentTime: number) {
    this.waveInstance.clearRegions()
    this.waveInstance.seekTo(percentTime / 100)
  }

  selectCluster(startTime, endTime) {
    this.waveInstance.clearRegions()
    const waveRegion = this.waveInstance.addRegion({
      start: startTime,
      end: endTime,
      color: 'rgba(3, 252, 240, 0.5)',
      drag: false,
    })
    waveRegion.play()
  }

  togglePlayback() {
    if (this.waveInstance.isPlaying()) {
      this.waveInstance.pause()
    } else {
      this.waveInstance.play()
    }
  }

  zoomWaveform(zoomValue) {
    const spectrogramScaleFactor = 2
    const zoomedWidth = calcWidth(zoomValue, audioLength)
    this.zooming = true
    this.waveformWidth = zoomedWidth
    this.waveInstance.spectrogram.width = Math.max(
      screen.width,
      zoomedWidth * spectrogramScaleFactor
    )
    this.waveInstance.on('zoom', () => {
      this.zooming = false
    })
    setTimeout(() => {
      this.waveInstance.zoom(zoomedWidth / audioLength)
    }, 100)
  }

  onSliderZoom($event: ChangeContext) {
    this.zoomWaveform($event.value)
  }
}
