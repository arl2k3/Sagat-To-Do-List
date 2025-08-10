import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogData } from '../../models/confirm-dialog.model';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  private confirmDialogService = inject(ConfirmDialogService);
  private destroy$ = new Subject<void>();
  
  data: ConfirmDialogData = {
    type: 'task',
    title: 'Confirmar acción',
    message: '¿Estás seguro de que quieres continuar?'
  };
  
  isVisible: boolean = false;

  ngOnInit() {
    this.confirmDialogService.dialogData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.data = data;
        }
      });

    this.confirmDialogService.isVisible$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isVisible => {
        this.isVisible = isVisible;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onConfirm() {
    this.confirmDialogService.emitResult({ confirmed: true });
  }

  onCancel() {
    this.confirmDialogService.emitResult({ confirmed: false });
  }

  onBackdropClick() {
    this.onCancel();
  }

  getIconForType(): string {
    return this.data.type === 'task' ? '📋' : '💬';
  }

  getColorClassForType(): string {
    return this.data.type === 'task' ? 'task-dialog' : 'comment-dialog';
  }
}
