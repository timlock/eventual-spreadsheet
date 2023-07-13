import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConsistentSpreadsheetComponent } from './consistent-spreadsheet.component';

describe('ConsistentSpreadsheetComponent', () => {
  let component: ConsistentSpreadsheetComponent;
  let fixture: ComponentFixture<ConsistentSpreadsheetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConsistentSpreadsheetComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsistentSpreadsheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
