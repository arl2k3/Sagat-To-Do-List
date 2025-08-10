import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UnauthorizedDialogService } from '../../../../shared/services/unauthorized-dialog.service';
import { type Task } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';

export interface EditTaskFormData {
  title: string;
  description: string;
}

@Component({
  selector: 'app-edit-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-task-modal.component.html',
  styleUrl: './edit-task-modal.component.css'
})
export class EditTaskModalComponent implements OnInit {
  @Input({ required: true }) task!: Task;
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() closeModal = new EventEmitter<void>();

  private tasksService = inject(TasksService);
  private unauthorizedService = inject(UnauthorizedDialogService);

  formData: EditTaskFormData = {
    title: '',
    description: ''
  };

  isLoading = false;

  ngOnInit() {
    this.formData = {
      title: this.task.title,
      description: this.task.description
    };
  }

  isFormValid(): boolean {
    return !!(this.formData.title.trim() && this.formData.description.trim());
  }

  onSave() {
    if (!this.isFormValid()) return;

    this.isLoading = true;


    const updateData = {
      id: this.task.id,
      title: this.formData.title.trim(),
      description: this.formData.description.trim(),
      isCompleted: this.task.isCompleted,
      comentarios: this.task.comentarios ?? [],
      createdByUserId: (this.task as any).createdByUserId ?? undefined
    };

    this.tasksService.updateTask(this.task.id, updateData)
      .subscribe({
        next: (updatedTask) => {
          this.taskUpdated.emit(updatedTask);
          this.onClose();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al actualizar la tarea:', error);
          this.isLoading = false;
          this.handleError(error);
        }
      });
  }

  onClose() {
    this.closeModal.emit();
  }

  private handleError(error: any): void {
    console.log('Error completo:', error);
    console.log('Error status:', error.status);
    console.log('Error error:', error.error);
    console.log('Error message:', error.message);

    if (error.status === 401 || error.status === 403) {
      this.unauthorizedService.showActionError(
        'No tienes permisos para editar esta tarea. Solo el propietario puede modificarla.'
      ).subscribe(() => {
        this.onClose(); 
      });
      return;
    }


    if (error.status === 500) {
      let errorMessage = '';
      
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error && error.error.title) {
        errorMessage = error.error.title;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log('Error message procesado:', errorMessage);

      if (errorMessage && (
          errorMessage.includes('No tienes permisos') ||
          errorMessage.toLowerCase().includes('not authorized') || 
          errorMessage.toLowerCase().includes('authentication') ||
          errorMessage.toLowerCase().includes('authorization') ||
          errorMessage.toLowerCase().includes('permisos')
        )) {
        console.log('Detectado error de permisos - mostrando dialog');
        this.unauthorizedService.showActionError(
          'No tienes permisos para editar esta tarea. Solo el propietario puede modificarla.'
        ).subscribe(() => {
          console.log('Dialog de unauthorized cerrado');
          this.onClose(); 
        });
        return;
      }
      
      console.log('Error 500 detectado - asumiendo problema de permisos');
      this.unauthorizedService.showActionError(
        'No tienes permisos para editar esta tarea. Solo el propietario puede modificarla.'
      ).subscribe(() => {
        console.log('Dialog de unauthorized cerrado');
        this.onClose(); 
      });
      return;
    }

    console.log('Mostrando dialog de error genérico');
    this.unauthorizedService.show({
      type: 'action',
      title: 'Error al editar tarea',
      message: 'Ocurrió un error inesperado al intentar editar la tarea. Por favor, inténtalo de nuevo.',
      buttonText: 'Entendido'
    }).subscribe(() => {
      console.log('Dialog de error genérico cerrado');
      this.onClose(); 
    });
    
    console.log('Dialog de error genérico mostrado');
  }
}
