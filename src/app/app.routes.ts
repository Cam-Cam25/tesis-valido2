import { Routes } from '@angular/router';
import { PhotoAnalyzerComponent } from './components/photo-analyzer/photo-analyzer.component';
import { ResultComponent } from './components/result/result.component';

export const routes: Routes = [
  { path: '', component: PhotoAnalyzerComponent },
  { path: 'result', component: ResultComponent },
];
