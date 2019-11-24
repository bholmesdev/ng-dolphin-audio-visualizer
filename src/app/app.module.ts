import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WaveVisualizationComponent } from './wave-visualization/wave-visualization.component';
import {Ng5SliderModule} from "ng5-slider";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    AppComponent,
    WaveVisualizationComponent
  ],
  imports: [
    BrowserModule,
    Ng5SliderModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})

@NgModule({
  imports:      [ BrowserModule, FormsModule, Ng5SliderModule ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})

export class AppModule { }


