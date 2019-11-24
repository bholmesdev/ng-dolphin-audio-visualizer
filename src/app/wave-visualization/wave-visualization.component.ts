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
} from './timelineHelpers'

@Component({
  selector: 'app-wave-visualization',
  templateUrl: './wave-visualization.component.html',
  styleUrls: ['./wave-visualization.component.scss'],
})
export class WaveVisualizationComponent implements OnInit {
  waveInstance: WaveSurfer
  timelines: Array<TimelineModel> = []
  waveformWidth: number = 0
  zoomFactor: number = 300
  translateOnScroll: string = ''
  playbackTime: number = 0
  prevZoomFactor: number = 0
  multiplier = 1

  //ng-5 slider options
  ngSliderOptions = {
    initialValue: 5,
    range: {
      floor: 0.1,
      ceil: 5,
    },
  }

  constructor(public zone: NgZone) {
    this.waveformWidth = audioLength * this.zoomFactor * this.multiplier
  }

  ngOnInit() {
    if (timelines.length > 0) {
      this.timelines = []
    }
    timelines.forEach((timeline: TimelineModel) => {
      const coloredTimeline = assignColorsToTimelineRegions(
        timeline,
        audioLength
      )
      this.timelines.push(coloredTimeline)
    })

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

    this.waveInstance.on('ready', () => {
      const spectrogramCanvas: HTMLElement = document.querySelector(
        '#spectrogram > spectrogram > canvas:nth-of-type(2)'
      )
      spectrogramCanvas.style.minWidth = '100%'
      // spectrogramCanvas.setAttribute('style', 'min-width: 100%')
    })

    this.waveInstance.load(`../assets/${audioFile}`)
    this.waveInstance.zoom(this.zoomFactor * this.multiplier)

    this.waveInstance.on('scroll', event => {
      this.translateOnScroll = `translateX(${-event.target.scrollLeft}px)`
    })

    const playbackHandler = playbackTime => {
      this.zone.run(() => {
        this.playbackTime = playbackTime.toFixed(2)
      })

      const regionEls = document.getElementsByClassName('timeline-region')
      for (const regionEl of Array.from(regionEls)) {
        const startTime = regionEl.getAttribute('data-start')
        const endTime = regionEl.getAttribute('data-end')
        if (startTime <= playbackTime && endTime >= playbackTime) {
          regionEl.classList.add('highlighted')
        } else {
          regionEl.classList.remove('highlighted')
        }
      }
    }

    // Update current playback time as audio plays
    this.waveInstance.on('audioprocess', playbackTime =>
      playbackHandler(playbackTime)
    )

    // Update current playback time when user manually moves playhead
    this.waveInstance.on('seek', percentScrubbed =>
      playbackHandler(percentScrubbed * audioLength)
    )
  }

  togglePlayback() {
    if (this.waveInstance.isPlaying()) {
      this.waveInstance.pause()
    } else {
      this.waveInstance.play()
    }
  }

  onUserChangeEnd($event: ChangeContext) {
    console.log($event.value)
    this.waveInstance.spectrogram.width = 120 * $event.value * audioLength
    console.log(this.waveInstance.spectrogram)
    this.waveInstance.zoom(60 * $event.value)
    this.zone.run(() => {
      this.waveformWidth = 60 * $event.value * audioLength
      console.log(this.waveformWidth)
    })
  }
}
