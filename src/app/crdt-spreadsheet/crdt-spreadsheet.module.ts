import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CrdtSpreadsheetPageRoutingModule } from './crdt-spreadsheet-routing.module';

import { CrdtSpreadsheetPage } from './crdt-spreadsheet.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CrdtSpreadsheetPageRoutingModule
  ],
  declarations: [CrdtSpreadsheetPage]
})
export class CrdtSpreadsheetPageModule {}
