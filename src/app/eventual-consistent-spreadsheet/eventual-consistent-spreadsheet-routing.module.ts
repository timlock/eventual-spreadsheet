import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventualConsistentSpreadsheetPage } from './eventual-consistent-spreadsheet.page';

const routes: Routes = [
  {
    path: '',
    component: EventualConsistentSpreadsheetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventualConsistentSpreadsheetPageRoutingModule {}
