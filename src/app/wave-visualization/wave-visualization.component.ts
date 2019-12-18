import { Component, OnInit, NgZone } from '@angular/core'
import WaveSurfer from 'wavesurfer.js'
import SpectrogramPlugin from 'wavesurfer.js/src/plugin/spectrogram'
import RegionPlugin from 'wavesurfer.js/src/plugin/regions'
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js'
import {
  audioFile,
  audioLength,
  timelines,
} from '../../assets/audio_data/12345678'
import { RegionModel, TimelineModel } from './timeline-model'
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
  audioLength: number = 0
  loading: boolean
  zooming: boolean
  waitingOnScrollAnimFrame: boolean
  currentEncoding: number
  learningAlgorithms = ['v2_lstm_v4'] //supported learning algorithms
  manualAnnotations: any = []

  //ng-5 slider options
  zoomSliderOptions = {
    initialValue: 1,
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
    this.currentEncoding = 12345678
    this.waitingOnScrollAnimFrame = false
    this.timelines = []
    this.waveformWidth = calcWidth(1, audioLength)
    this.audioLength = audioLength

    /*TODO: Read all encodings and display all the buttons/list,
    for now, we imagine button for encoding 12345678 is clicked.
   */
    //TODO: somehow get length of audio file from data beforehand
  }

  async ngOnInit() {
    this.generateTimelines()

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
    this.waveInstance.setCursorColor('red')
    this.loadWavePeakData()
    this.zoomWaveform(1)

    this.waveInstance.on('ready', () => {
      console.log('ready!')
      this.playbackHandler(0)
      this.zone.run(() => {
        this.loading = false
      })
    })

    this.waveInstance.on('scroll', event => {
      if (!this.waitingOnScrollAnimFrame) {
        requestAnimationFrame(() => {
          this.translateOnScroll = `translateX(${-event.target.scrollLeft}px)`
          this.waitingOnScrollAnimFrame = false
        })
        this.waitingOnScrollAnimFrame = true
      }
    })

    // Update current playback time as audio plays
    this.waveInstance.on('audioprocess', playbackTime =>
      this.playbackHandler(playbackTime)
    )

    // Update current playback time when user manually moves playhead
    this.waveInstance.on('seek', percentScrubbed =>
      this.playbackHandler(percentScrubbed * audioLength)
    )
  }

  async loadWavePeakData() {
    const response = await fetch(
      `../assets/audio_data/audio_waveform_data/${this.currentEncoding}.json`
    )
    const peaks = await response.json()

    this.waveInstance.load(
      `../assets/audio_data/audio_files/${audioFile}`,
      peaks.data
    )

    this.waveInstance.on('ready', () => {
      this.playbackHandler(0)
      this.zone.run(() => {
        this.loading = false
      })
    })
  }

  playbackHandler(playbackTime) {
    const regionEls: NodeListOf<HTMLElement> = document.querySelectorAll(
      '.clusters.timeline .cluster'
    )

    for (const regionEl of Array.from(regionEls)) {
      const startTime = regionEl.getAttribute('data-start')
      const endTime = regionEl.getAttribute('data-end')
      if (startTime <= playbackTime && endTime >= playbackTime) {
        regionEl.classList.add('highlighted')
      } else {
        regionEl.classList.remove('highlighted')
      }
    }

    this.zone.run(() => {
      this.playbackTime = playbackTime.toFixed(2)
    })
  }

  selectAnnotation(percentTime: number) {
    this.waveInstance.clearRegions()
    this.waveInstance.seekTo(percentTime / 100)
  }

  selectCluster(startTime, endTime, regionColor) {
    this.waveInstance.clearRegions()
    const waveRegion = this.waveInstance.addRegion({
      start: startTime,
      end: endTime,
      color: regionColor,
      opacity: 0.5,
      drag: false,
    })
    console.log(waveRegion)
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
    console.log(this.waveInstance.spectrogram)
    const zoomedWidth = calcWidth(zoomValue, audioLength)
    this.zooming = true
    this.waveInstance.spectrogram.width = Math.max(
      this.waveInstance.container.offsetWidth,
      zoomedWidth * 2
    )
    this.waveInstance.on('zoom', () => {
      this.waveformWidth = zoomedWidth
      this.zooming = false
    })
    setTimeout(() => {
      this.waveInstance.zoom(zoomedWidth / audioLength)
    }, 100)
  }

  onSliderZoom($event: ChangeContext) {
    this.zoomWaveform($event.value)
  }

  async generateTimelines() {
    await this.generateManualAnnotationTimeline()
    await this.generateLearningAlgorithmTimelines()
  }

  generateLearningAlgorithmTimelines() {
    this.learningAlgorithms.forEach(async algorithm => {
      //TODO: insert api url here instead of local example
      const loc =
        '../assets/audio_data/audio_' +
        algorithm +
        '_encodings/' +
        this.currentEncoding +
        '.json'

      const response = await fetch(loc)
      var clusterTimelines = await response.json()

      let timeline = new TimelineModel(algorithm)
      clusterTimelines.forEach(clusterTimeline => {
        clusterTimeline.forEach(cluster => {
          timeline.addRegion(
            new RegionModel({
              start: cluster.start / 48000,
              end: cluster.stop / 48000,
              label: cluster.cluster_id,
            })
          )
        })
      })

      const coloredTimeline = assignColorsToTimelineRegions(
        timeline,
        audioLength
      )
      this.timelines.push(coloredTimeline)
    })
  }

  async generateManualAnnotationTimeline() {
    //TODO: insert api url here instead of local example
    const loc =
      '../assets/audio_data/audio_manual_encodings/' +
      this.currentEncoding +
      '.json'

    const response = await fetch(loc)
    var annotations = await response.json()

    annotations.forEach(annotation => {
      this.manualAnnotations.push({
        time: annotation.timecode / 48000,
        description: annotation.description,
      })
    })

    this.manualAnnotations = assignPositionsToAnnotations(
      this.manualAnnotations,
      audioLength
    )
  }
}
