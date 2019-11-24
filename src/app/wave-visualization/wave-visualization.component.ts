import { Component, OnInit, NgZone } from '@angular/core'
import WaveSurfer from 'wavesurfer.js'
import SpectrogramPlugin from 'wavesurfer.js/src/plugin/spectrogram'
import RegionPlugin from 'wavesurfer.js/src/plugin/regions'
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js'
import { audioFile, audioLength, timelines } from '../../assets/dolphin-data.js'
import { TimelineModel, RegionModel } from './timeline-model'
import {ChangeContext, Options} from "ng5-slider";

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
  waveInstance: WaveSurfer
  timelines: Array<TimelineModel> = []
  waveformWidth: number = 0
  zoomFactor: number = 300
  translateOnScroll: string = ''
  playbackTime: number = 0
  prevZoomFactor: number = 0
  multiplier = 1

  //ng-5 slider options
  value: number = 5;
  options: Options = {
    floor: 0,
    ceil: 20
  };

  constructor(public zone: NgZone) {
    this.waveformWidth = audioLength * this.zoomFactor * this.multiplier
  }

  ngOnInit() {

    if(timelines.length > 0) {
      this.timelines = []
    }
    timelines.forEach((timeline: TimelineModel) => {
      const coloredTimeline = assignColorsToTimelineRegions(timeline)
      this.timelines.push(coloredTimeline)
    })

    if(this.waveInstance != null) {
      this.waveInstance.destroy()
    }
    this.waveInstance = WaveSurfer.create({
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
    this.waveInstance.on('audioprocess', playbackTime => playbackHandler(playbackTime))

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

  onUserChangeStart($event: ChangeContext) {
    console.log($event)
    this.prevZoomFactor = $event.value;
  }

  onUserChangeEnd($event: ChangeContext) {
    const change = $event.value - this.prevZoomFactor;
    if(change > 0) {
      this.multiplier *= change;
      console.log("CHECK start");
      this.ngOnInit();
      console.log("CHECK end");

    } else if(change < 0){
      this.multiplier /= change;
      console.log("CHECK start");
      this.ngOnInit();
      console.log("CHECK end");
    }

  }
}
