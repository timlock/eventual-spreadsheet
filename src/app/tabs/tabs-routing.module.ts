import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'inconsistent',
        loadChildren: () => import('../inconsistent-spreadsheet/inconsistent-spreadsheet.module').then(m => m.InconsistentSpreadsheetPageModule)
      },
      {
        path: 'consistent',
        loadChildren: () => import('../consistent-spreadsheet/consistent-spreadsheet.module').then(m => m.ConsistentSpreadsheetPageModule)
      },
      {
        path: 'crdt',
        loadChildren: () => import('../crdt-spreadsheet/crdt-spreadsheet.module').then(m => m.CrdtSpreadsheetPageModule)
      },
      {
        path: '',
        redirectTo: '/inconsistent',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/inconsistent',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
