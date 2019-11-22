import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WaveVisualizationComponent } from './wave-visualization/wave-visualization.component';

@NgModule({
  declarations: [
    AppComponent,
    WaveVisualizationComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
