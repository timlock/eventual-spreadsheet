import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventualConsistentSpreadsheetPageRoutingModule } from './eventual-consistent-spreadsheet-routing.module';

import { EventualConsistentSpreadsheetPage } from './eventual-consistent-spreadsheet.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventualConsistentSpreadsheetPageRoutingModule
  ],
  declarations: [EventualConsistentSpreadsheetPage]
})
export class EventualConsistentSpreadsheetPageModule {}
