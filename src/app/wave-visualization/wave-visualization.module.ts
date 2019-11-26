import { NgModule } from '@angular/core'
import { Ng5SliderModule } from 'ng5-slider'
import { BrowserModule } from '@angular/platform-browser'
import { WaveVisualizationComponent } from './wave-visualization.component'
import { LoadingOverlayComponent } from './loading-overlay/loading-overlay.component'

@NgModule({
  imports: [BrowserModule, Ng5SliderModule],
  declarations: [WaveVisualizationComponent, LoadingOverlayComponent],
  exports: [WaveVisualizationComponent],
})
export class WaveVisualizationModule {}
