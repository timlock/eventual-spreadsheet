"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[5407],{5407:(O,m,l)=>{l.r(m),l.d(m,{InconsistentSpreadsheetPageModule:()=>I});var g=l(6814),h=l(95),c=l(5548),_=l(5785),d=l(1940),C=l(394),u=l(6148),e=l(6689),S=l(3125),f=l(5220);function v(i,r){if(1&i){const t=e.EpF();e.TgZ(0,"th",14)(1,"ion-toolbar")(2,"ion-buttons",15)(3,"ion-button",16),e.NdJ("click",function(){const o=e.CHM(t).$implicit,a=e.oxw();return e.KtG(a.insertColumn(o))}),e._UZ(4,"ion-icon",12),e.qZA()(),e._uU(5),e.TgZ(6,"ion-buttons",17)(7,"ion-button",18),e.NdJ("click",function(){const o=e.CHM(t).$implicit,a=e.oxw();return e.KtG(a.deleteColumn(o))}),e._UZ(8,"ion-icon",19),e.qZA()()()()}if(2&i){const t=r.index;e.xp6(5),e.hij(" ",t+1," ")}}const p=function(i,r){return{column:i,row:r}};function b(i,r){if(1&i&&(e.TgZ(0,"div")(1,"div",24),e._uU(2),e.qZA()()),2&i){const t=e.oxw().$implicit,n=e.oxw().$implicit,s=e.oxw();let o;e.xp6(2),e.hij(" ",null==(o=s.table.get(e.WLB(1,p,t,n)))?null:o.content," ")}}function w(i,r){if(1&i&&e._uU(0),2&i){const t=e.oxw().$implicit,n=e.oxw().$implicit,s=e.oxw();let o;e.hij(" ",null==(o=s.table.get(e.WLB(1,p,t,n)))?null:o.content," ")}}function x(i,r){if(1&i){const t=e.EpF();e.TgZ(0,"td",21),e.NdJ("click",function(){const o=e.CHM(t).$implicit,a=e.oxw().$implicit,P=e.oxw();return e.KtG(P.selectCell(o,a))}),e.YNc(1,b,3,4,"div",22),e.YNc(2,w,1,4,"ng-template",null,23,e.W1O),e.qZA()}if(2&i){const t=r.$implicit,n=e.MAs(3),s=e.oxw().$implicit,o=e.oxw();e.xp6(1),e.Q6J("ngIf",o.currentCell.row===s&&o.currentCell.column===t)("ngIfElse",n)}}function Z(i,r){if(1&i){const t=e.EpF();e.TgZ(0,"tr")(1,"td",9)(2,"ion-toolbar")(3,"ion-buttons",15)(4,"ion-button",16),e.NdJ("click",function(){const o=e.CHM(t).$implicit,a=e.oxw();return e.KtG(a.insertRow(o))}),e._UZ(5,"ion-icon",12),e.qZA()(),e._uU(6),e.TgZ(7,"ion-buttons",17)(8,"ion-button",18),e.NdJ("click",function(){const o=e.CHM(t).$implicit,a=e.oxw();return e.KtG(a.deleteRow(o))}),e._UZ(9,"ion-icon",19),e.qZA()()()(),e.YNc(10,x,4,2,"td",20),e.qZA()}if(2&i){const t=r.index,n=e.oxw();e.xp6(6),e.hij(" ",t+1," "),e.xp6(4),e.Q6J("ngForOf",n.table.columns)}}const M=[{path:"",component:(()=>{class i{constructor(t,n,s){this._nodes=new Set,this.channelName="inconsistent",this._receivedMessageCounter=0,this._totalMessageCounter=0,this.communicationService=t,this.spreadsheetService=n,this.ngZone=s,this._table=this.spreadsheetService.getTable(),this._currentCell=this.spreadsheetService.getCellByIndex(1,1)}ngAfterViewInit(){this.ionInput=document.getElementsByName("inconsistent-input")[0]}ionViewDidEnter(){this.communicationService.openChannel(this.channelName,this)}selectCell(t,n){var s;this._currentCell=this.spreadsheetService.getCellById({column:t,row:n}),this.table.rows.length>0&&this.table.columns.length>0&&(null===(s=this.ionInput)||void 0===s||s.setFocus())}addRow(){let t=this.identifier.next(),n=u.Z.addRow(t);this.spreadsheetService.addRow(t),this.communicationService.send(n)}insertRow(t){let n=this.identifier.next(),s=u.Z.insertRow(n,t);this.spreadsheetService.insertRow(n,t),this.communicationService.send(s)}deleteRow(t){let n=u.Z.deleteRow(t);this.spreadsheetService.deleteRow(t),this.communicationService.send(n)}addColumn(){let t=this.identifier.next(),n=u.Z.addColumn(t);this.spreadsheetService.addColumn(t),this.communicationService.send(n)}insertColumn(t){let n=this.identifier.next(),s=u.Z.insertColumn(n,t);this.spreadsheetService.insertColumn(n,t),this.communicationService.send(s)}deleteColumn(t){let n=u.Z.deleteColumn(t);this.spreadsheetService.deleteColumn(t),this.communicationService.send(n)}insertCell(t){let n=u.Z.insertCell(t.address,t.input);this.spreadsheetService.insertCellById(t.address,t.input),this.communicationService.send(n)}deleteCell(t){t.input="",this.insertCell(t)}getCell(t,n){return this.spreadsheetService.getTable().get({column:t,row:n})}get currentCell(){return(-1===this.table.rows.indexOf(this._currentCell.row)||-1===this.table.columns.indexOf(this._currentCell.column))&&this.selectCell(this.table.columns[0],this.table.rows[0]),this._currentCell}onMessage(t,n){(0,C.rz)(t)?(this.handleAction(t),this.ngZone.run(()=>this.table=this.spreadsheetService.getTable())):console.warn("Invalid message",t)}onNode(t){this._nodes.add(t),this.ngZone.run(()=>this._nodes=this.communicationService.nodes)}handleAction(t){switch(t.action){case d.U.INSERT_CELL:this.spreadsheetService.insertCellById({column:t.column,row:t.row},t.input);break;case d.U.ADD_ROW:this.spreadsheetService.addRow(t.input);break;case d.U.INSERT_ROW:this.spreadsheetService.insertRow(t.input,t.row);break;case d.U.ADD_COLUMN:this.spreadsheetService.addColumn(t.input);break;case d.U.INSERT_COLUMN:this.spreadsheetService.insertColumn(t.input,t.column);break;case d.U.DELETE_COLUMN:this.spreadsheetService.deleteColumn(t.column);break;case d.U.DELETE_ROW:this.spreadsheetService.deleteRow(t.row);break;default:console.warn("Cant perform action for payload: ",t)}}get table(){return this._table=this.spreadsheetService.getTable(),this._table}set table(t){this._table=t}get nodes(){return this._nodes}get clusterSize(){return this.nodes.size}get identifier(){return this.communicationService.identifier}get connectionEnabled(){return this.communicationService.isConnected}set connectionEnabled(t){this.communicationService.isConnected=t}get receivedMessageCounter(){return this._receivedMessageCounter=this.communicationService.receivedMessageCounter,this._receivedMessageCounter}get totalMessageCounter(){return this._totalMessageCounter=this.communicationService.totalMessageCounter,this._totalMessageCounter}onMessageCounterUpdate(t,n){this.ngZone.run(()=>{this._receivedMessageCounter=t,this._totalMessageCounter=n})}}return i.\u0275fac=function(t){return new(t||i)(e.Y36(S.O),e.Y36(f.t),e.Y36(e.R0b))},i.\u0275cmp=e.Xpm({type:i,selectors:[["app-inconsistent-spreadsheet"]],decls:39,vars:10,consts:[[3,"fullscreen"],["color","warning"],["size","large"],["size","auto"],[3,"ngModel","ngModelChange"],[1,"ion-padding-top"],[3,"submit"],["name","inconsistent-input","fill","outline",3,"ngModel","ngModelChange"],[1,"spreadsheet"],[1,"table-header","small-cell"],["class","table-header cell",4,"ngFor","ngForOf"],["color","primary",3,"click"],["name","add"],[4,"ngFor","ngForOf"],[1,"table-header","cell"],["slot","start"],["fill","clear","size","small","color","success",3,"click"],["slot","end"],["fill","clear","size","small","color","danger",3,"click"],["name","close-circle-outline"],["class","ion-text-right cell",3,"click",4,"ngFor","ngForOf"],[1,"ion-text-right","cell",3,"click"],[4,"ngIf","ngIfElse"],["cellValue",""],[1,"selected"]],template:function(t,n){1&t&&(e.TgZ(0,"ion-content",0)(1,"ion-header")(2,"ion-toolbar",1)(3,"ion-title",2),e._uU(4,"inconsistent-spreadsheet"),e.qZA()()(),e.TgZ(5,"ion-grid")(6,"ion-row")(7,"ion-col",3)(8,"ion-toggle",4),e.NdJ("ngModelChange",function(o){return n.connectionEnabled=o}),e.TgZ(9,"ion-title"),e._uU(10,"Global coordination"),e.qZA()()(),e.TgZ(11,"ion-col",3)(12,"ion-title"),e._uU(13),e.qZA()(),e.TgZ(14,"ion-col",3)(15,"ion-title"),e._uU(16),e.qZA()(),e.TgZ(17,"ion-col",3)(18,"ion-title"),e._uU(19),e.qZA()()(),e.TgZ(20,"ion-row")(21,"ion-col",3)(22,"ion-title",5),e._uU(23),e.qZA()(),e.TgZ(24,"ion-col")(25,"form",6),e.NdJ("submit",function(){return n.insertCell(n.currentCell)}),e.TgZ(26,"ion-input",7),e.NdJ("ngModelChange",function(o){return n.currentCell.input=o}),e.qZA()()()()(),e.TgZ(27,"div",8)(28,"table")(29,"thead")(30,"tr"),e._UZ(31,"th",9),e.YNc(32,v,9,1,"th",10),e.TgZ(33,"ion-button",11),e.NdJ("click",function(){return n.addColumn()}),e._UZ(34,"ion-icon",12),e.qZA()()(),e.TgZ(35,"tbody"),e.YNc(36,Z,11,2,"tr",13),e.qZA()()(),e.TgZ(37,"ion-button",11),e.NdJ("click",function(){return n.addRow()}),e._UZ(38,"ion-icon",12),e.qZA()()),2&t&&(e.Q6J("fullscreen",!0),e.xp6(8),e.Q6J("ngModel",n.connectionEnabled),e.xp6(5),e.hij("Remote nodes: ",n.clusterSize,""),e.xp6(3),e.hij("Received messages: ",n.receivedMessageCounter,""),e.xp6(3),e.hij("Total messages: ",n.totalMessageCounter,""),e.xp6(4),e.AsE("",n.currentCell.colIndex,"|",n.currentCell.rowIndex,""),e.xp6(3),e.Q6J("ngModel",n.currentCell.input),e.xp6(6),e.Q6J("ngForOf",n.table.columns),e.xp6(4),e.Q6J("ngForOf",n.table.rows))},dependencies:[g.sg,g.O5,h._Y,h.JJ,h.JL,h.On,h.F,c.YG,c.Sm,c.wI,c.W2,c.jY,c.Gu,c.gu,c.pK,c.Nd,c.wd,c.ho,c.sr,c.w,c.j9],styles:["table-header[_ngcontent-%COMP%]{color:gray;text-align:center}.small-cell[_ngcontent-%COMP%]{width:120px}.cell[_ngcontent-%COMP%]{width:150px}.selected[_ngcontent-%COMP%]{border:solid 5px black;min-height:50px;min-width:150px}.spreadsheet[_ngcontent-%COMP%]{overflow-x:auto}.spreadsheet[_ngcontent-%COMP%]   table[_ngcontent-%COMP%]{table-layout:fixed;width:100%}.spreadsheet[_ngcontent-%COMP%]   td[_ngcontent-%COMP%], .spreadsheet[_ngcontent-%COMP%]   th[_ngcontent-%COMP%]{border:solid 1px lightgray}"]}),i})()}];let T=(()=>{class i{}return i.\u0275fac=function(t){return new(t||i)},i.\u0275mod=e.oAB({type:i}),i.\u0275inj=e.cJS({imports:[_.Bz.forChild(M),_.Bz]}),i})(),I=(()=>{class i{}return i.\u0275fac=function(t){return new(t||i)},i.\u0275mod=e.oAB({type:i}),i.\u0275inj=e.cJS({imports:[g.ez,h.u5,c.Pc,T]}),i})()}}]);