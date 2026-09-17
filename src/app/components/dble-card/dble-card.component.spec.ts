import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DbleCardComponent } from './dble-card.component';

describe('DbleCardComponent', () => {
  let component: DbleCardComponent;
  let fixture: ComponentFixture<DbleCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbleCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DbleCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
