import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InconsistentSpreadsheetPageRoutingModule } from './inconsistent-spreadsheet-routing.module';

import { InconsistentSpreadsheetPage } from './inconsistent-spreadsheet.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InconsistentSpreadsheetPageRoutingModule
  ],
  declarations: [InconsistentSpreadsheetPage]
})
export class InconsistentSpreadsheetPageModule {}
