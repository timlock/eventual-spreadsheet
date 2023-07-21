import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConsistentSpreadsheetPageRoutingModule } from './consistent-spreadsheet-routing.module';

import { ConsistentSpreadsheetPage } from './consistent-spreadsheet.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConsistentSpreadsheetPageRoutingModule
  ],
  declarations: [ConsistentSpreadsheetPage]
})
export class ConsistentSpreadsheetPageModule {}
