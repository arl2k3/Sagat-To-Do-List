import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { HeaderComponent } from "./shared/components/header/header.component";
import { UnauthorizedDialogComponent } from './shared/components/unauthorized-dialog/unauthorized-dialog.component';
import { UnauthorizedDialogData, UnauthorizedDialogResult } from './shared/models/unauthorized-dialog.model';
import { UnauthorizedDialogService } from './shared/services/unauthorized-dialog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, ConfirmDialogComponent, UnauthorizedDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  showHeader = true; 
  
  private unauthorizedService = inject(UnauthorizedDialogService);
  
  unauthorizedDialogVisible = false;
  unauthorizedDialogData: UnauthorizedDialogData | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.showHeader = true;
    
    this.unauthorizedService.dialogState$.subscribe(state => {
      this.unauthorizedDialogVisible = state.isVisible;
      this.unauthorizedDialogData = state.data;
    });
  }

  onUnauthorizedDialogResult(result: UnauthorizedDialogResult) {
    this.unauthorizedService.handleResult(result);
  }
}
