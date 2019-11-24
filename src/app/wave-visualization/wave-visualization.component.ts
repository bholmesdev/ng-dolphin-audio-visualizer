import { Component, OnInit, NgZone } from '@angular/core'
import WaveSurfer from 'wavesurfer.js'
import SpectrogramPlugin from 'wavesurfer.js/src/plugin/spectrogram'
import RegionPlugin from 'wavesurfer.js/src/plugin/regions'
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js'
import { audioFile, audioLength, timelines } from '../../assets/dolphin-data.js'
import { TimelineModel, RegionModel } from './timeline-model'




const getRandomColor = () =>
  'rgba(' +
  [
    ~~(Math.random() * 255),
    ~~(Math.random() * 255),
    ~~(Math.random() * 255),
    0.5,
  ] +
  ')'

const assignColorsToTimelineRegions = (
  timeline: TimelineModel
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

      const cssStyles = {
        width: percentWidth + '%',
        left: percentStart + '%',
        'background-color': colorMap.get(region.label),
      }

      return {
        ...region,
        cssStyles,
      }
    }),
  }
}

@Component({
  selector: 'app-wave-visualization',
  templateUrl: './wave-visualization.component.html',
  styleUrls: ['./wave-visualization.component.scss'],
})
export class WaveVisualizationComponent implements OnInit {
  waveInstance: any
  timelines: Array<TimelineModel> = []
  waveformWidth: number = 0
  zoomFactor: number = 300
  translateOnScroll: string = ''
  playbackTime: number = 0

  constructor(public zone: NgZone) {
    this.waveformWidth = audioLength * this.zoomFactor

    timelines.forEach((timeline: TimelineModel) => {
      const coloredTimeline = assignColorsToTimelineRegions(timeline)
      this.timelines.push(coloredTimeline)
    })
  }

  ngOnInit() {
    const wave = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#ddd',
      progressColor: '#333',
      plugins: [
        RegionPlugin.create(),
        SpectrogramPlugin.create({
          container: '#spectrogram',
          labels: true,
        }),
        TimelinePlugin.create({
          container: '#wave-timeline',
          primaryLabelInterval: 1
        })
      ]
    })

   
    this.waveInstance = wave
    // wave.on('ready', function () { 
    //   var timeline = Object.create(WaveSurfer.Timeline);
    //    timeline.init({ 
    //      wavesurfer: wave, 
    //      container: '#waveform-timeline'
    //     });
    // });
    // wave.on('ready', function () {
    //   console.log(WaveSurfer.Timeline);
    //   var timeline = Object.create(WaveSurfer.Timeline);
    //   console.log(timeline);
    // });

    wave.load(`../assets/${audioFile}`)
    wave.zoom(this.zoomFactor)

    wave.on('scroll', event => {
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
    wave.on('audioprocess', playbackTime => playbackHandler(playbackTime))

    // Update current playback time when user manually moves playhead
    wave.on('seek', percentScrubbed =>
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
}
