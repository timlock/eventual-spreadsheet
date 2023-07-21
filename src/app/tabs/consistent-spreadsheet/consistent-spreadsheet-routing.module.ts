import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConsistentSpreadsheetPage } from './consistent-spreadsheet.page';

const routes: Routes = [
  {
    path: '',
    component: ConsistentSpreadsheetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsistentSpreadsheetPageRoutingModule {}
