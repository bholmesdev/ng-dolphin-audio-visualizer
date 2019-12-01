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
  audioLength: number = 0
  loading: boolean
  zooming: boolean
  waitingOnScrollAnimFrame: boolean
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
    this.waitingOnScrollAnimFrame = false
    this.timelines = []
    this.waveformWidth = calcWidth(1, audioLength)
    this.audioLength = audioLength
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
  }

  ngOnInit() {
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
    this.waveInstance.load(`../assets/${audioFile}`)

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

    this.waveInstance.on('ready', () => {
      this.playbackHandler(0)
      this.loading = false
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

  selectCluster(startTime, endTime,regionColor) {
    this.waveInstance.clearRegions()
    const waveRegion = this.waveInstance.addRegion({
      start: startTime,
      end: endTime,
      color: regionColor,
      opacity: 0.5,
      drag: false,
    })
    console.log(waveRegion);
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
}
