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
  translateOnScroll: string = ''
  playbackTime: number = 0

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

  zoomWaveform(zoomValue) {
    const spectrogramScaleFactor = 2
    const zoomedWidth = calcWidth(zoomValue, audioLength)

    this.waveInstance.spectrogram.width = Math.max(
      screen.width,
      zoomedWidth * spectrogramScaleFactor
    )
    this.waveInstance.zoom(zoomedWidth / audioLength)
    this.zone.run(() => {
      this.waveformWidth = zoomedWidth
    })
  }

  onSliderZoom($event: ChangeContext) {
    this.zoomWaveform($event.value)
  }
}
