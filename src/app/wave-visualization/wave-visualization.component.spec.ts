import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WaveVisualizationComponent } from './wave-visualization.component';

describe('WaveVisualizationComponent', () => {
  let component: WaveVisualizationComponent;
  let fixture: ComponentFixture<WaveVisualizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WaveVisualizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WaveVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
