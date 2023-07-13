import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CrdtSpreadsheetPage } from './crdt-spreadsheet.page';

const routes: Routes = [
  {
    path: '',
    component: CrdtSpreadsheetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CrdtSpreadsheetPageRoutingModule {}
