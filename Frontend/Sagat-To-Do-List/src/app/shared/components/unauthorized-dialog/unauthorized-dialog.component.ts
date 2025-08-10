import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UnauthorizedDialogData, UnauthorizedDialogResult } from '../../models/unauthorized-dialog.model';

@Component({
  selector: 'app-unauthorized-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unauthorized-dialog.component.html',
  styleUrl: './unauthorized-dialog.component.css'
})
export class UnauthorizedDialogComponent {
  @Input() data: UnauthorizedDialogData = {
    type: 'action',
    title: 'Acción no autorizada',
    message: 'No tienes permisos para realizar esta acción.'
  };
  
  @Input() isVisible: boolean = false;
  @Output() result = new EventEmitter<UnauthorizedDialogResult>();

  onAcknowledge() {
    this.result.emit({ acknowledged: true });
  }

  onBackdropClick() {
    this.onAcknowledge();
  }

  getIconForType(): string {
    switch (this.data.type) {
      case 'delete':
        return '🚫';
      case 'access':
        return '🔒';
      case 'permission':
        return '⚠️';
      case 'action':
      default:
        return '🛑';
    }
  }

  getColorClassForType(): string {
    switch (this.data.type) {
      case 'delete':
        return 'delete-unauthorized';
      case 'access':
        return 'access-unauthorized';
      case 'permission':
        return 'permission-unauthorized';
      case 'action':
      default:
        return 'action-unauthorized';
    }
  }

  getButtonClass(): string {
    return `btn-acknowledge-${this.data.type}`;
  }
}
