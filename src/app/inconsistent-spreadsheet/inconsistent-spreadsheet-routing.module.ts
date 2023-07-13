import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InconsistentSpreadsheetPage } from './inconsistent-spreadsheet.page';

const routes: Routes = [
  {
    path: '',
    component: InconsistentSpreadsheetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InconsistentSpreadsheetPageRoutingModule {}
