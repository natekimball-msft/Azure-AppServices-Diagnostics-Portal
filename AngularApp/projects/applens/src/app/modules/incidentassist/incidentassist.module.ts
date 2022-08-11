import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentValidationComponent } from './components/incidentvalidation/incidentvalidation.component';
import { TemplateManagementComponent } from './components/template-management/template-management.component';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { FabButtonModule, FabPanelModule, FabDropdownModule, FabTextFieldModule } from '@angular-react/fabric';
import {IncidentAssistanceService} from "./services/incident-assistance.service";
import { HttpClientModule } from '@angular/common/http';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { DiagnosticDataModule } from 'diagnostic-data';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';


export const IncidentAssistModuleRoutes : ModuleWithProviders = RouterModule.forChild([
  {
    path: 'manage',
    component: TemplateManagementComponent
  },
  {
    path: ':incidentId',
    component: IncidentValidationComponent
  }
]);

@NgModule({
  imports: [
    CommonModule,
    MonacoEditorModule.forRoot(),
    IncidentAssistModuleRoutes,
    SharedModule,
    HttpClientModule,
    FormsModule,
    FabButtonModule,
    FabPanelModule,
    FabDropdownModule,
    FabTextFieldModule,
    DiagnosticDataModule
  ],
  providers: [IncidentAssistanceService],
  declarations: [IncidentValidationComponent, TemplateManagementComponent, SafeHtmlPipe]
})
export class IncidentAssistModule { }
