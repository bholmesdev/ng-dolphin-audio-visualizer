import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'
import { WaveVisualizationModule } from './wave-visualization/wave-visualization.module'

@NgModule({
  imports: [WaveVisualizationModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
