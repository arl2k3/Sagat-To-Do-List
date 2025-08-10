import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { UnauthorizedDialogService } from '../../../../shared/services/unauthorized-dialog.service';
import { CommentsComponent } from '../../../comments/components/comments.component';
import { type Task } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule, CommentsComponent],
  templateUrl: './task-item.component.html',
  styleUrl: './task-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskItemComponent {
  private _task!: Task;
  @Input({ required: true })
  set task(value: Task) {
    this._task = value;
    this.expanded.set(this.getPersistedExpanded());
  }
  get task(): Task {
    return this._task;
  }
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskDeleted = new EventEmitter<number>();
  @Output() editTask = new EventEmitter<Task>();

  private tasksService = inject(TasksService);
  private confirmDialogService = inject(ConfirmDialogService);
  private unauthorizedService = inject(UnauthorizedDialogService);

  expanded = signal(false);
  loading = signal(false);

  toggleExpanded() {
    this.expanded.update(expanded => {
      const newValue = !expanded;
      this.persistExpanded(newValue);
      return newValue;
    });
  }

  private persistExpanded(value: boolean) {
    if (this.task && this.task.id) {
      localStorage.setItem('task-expanded-' + this.task.id, value ? '1' : '0');
    }
  }

  private getPersistedExpanded(): boolean {
    if (this.task && this.task.id) {
      return localStorage.getItem('task-expanded-' + this.task.id) === '1';
    }
    return false;
  }

  onToggleComplete() {
    if (this.task.id < 1e12) {
      this.loading.set(true);
      const updateData = {
        id: this.task.id,
        title: this.task.title,
        description: this.task.description,
        isCompleted: !this.task.isCompleted,
        comentarios: this.task.comentarios ?? [],
        createdByUserId: (this.task as any).createdByUserId ?? undefined
      };
      this.tasksService.updateTask(this.task.id, updateData).subscribe({
        next: (task) => {
          this.taskUpdated.emit(task);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error updating task:', error);
          this.handleError(error, 'actualizar');
          this.loading.set(false);
        }
      });
    } else {
      alert('No puedes editar/completar una tarea que aún no ha sido guardada.');
    }
  }

  onEditTask() {
    this.editTask.emit(this.task);
  }

  onDeleteTask() {
    this.confirmDialogService.confirmDeleteTask(this.task.title)
      .subscribe(result => {
        if (result.confirmed) {
          this.deleteTask();
        }
      });
  }

  private deleteTask() {
    if (this.task.id < 1e12) {
      this.loading.set(true);
      this.tasksService.deleteTask(this.task.id).subscribe({
        next: () => {
          localStorage.removeItem('task-expanded-' + this.task.id);
          this.taskDeleted.emit(this.task.id);
          this.loading.set(false);
        },
        error: (error) => {
          setTimeout(() => {
            this.expanded.set(this.getPersistedExpanded());
          }, 0);
          console.error('Error deleting task:', error);
          this.handleError(error, 'eliminar');
          this.loading.set(false);
        }
      });
    } else {
      alert('No puedes eliminar una tarea que aún no ha sido guardada.');
    }
  }


  private handleError(error: any, action: string): void {
    console.log('Error completo:', error);
    console.log('Error status:', error.status);
    console.log('Error error:', error.error);
    console.log('Error message:', error.message);

    if (error.status === 401 || error.status === 403) {
      this.unauthorizedService.showActionError(
        `No tienes permisos para ${action} esta tarea.`
      ).subscribe();
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

      if (errorMessage && errorMessage.includes('No tienes permisos para eliminar esta tarea')) {
        console.log('Detectado error de permisos - mostrando dialog');
        this.unauthorizedService.showDeleteError(
          'No tienes permisos para eliminar esta tarea. Solo el propietario puede eliminarla.'
        ).subscribe(() => {
          console.log('Dialog de unauthorized cerrado');
        });
        return;
      }
      
      if (errorMessage && (
          errorMessage.toLowerCase().includes('not authorized') || 
          errorMessage.toLowerCase().includes('authentication') ||
          errorMessage.toLowerCase().includes('authorization') ||
          errorMessage.toLowerCase().includes('permisos')
        )) {
        console.log('Detectado error de autorización genérico - mostrando dialog');
        this.unauthorizedService.showActionError(
          `No tienes permisos para ${action} esta tarea.`
        ).subscribe(() => {
          console.log('Dialog de unauthorized cerrado');
        });
        return;
      }
    }

    console.log('Mostrando dialog de error genérico');
    this.unauthorizedService.show({
      type: 'action',
      title: `Error al ${action} tarea`,
      message: `Ocurrió un error inesperado al intentar ${action} la tarea. Por favor, inténtalo de nuevo.`,
      buttonText: 'Entendido'
    }).subscribe(() => {
      console.log('Dialog de error genérico cerrado');
    });
    
    console.log('Dialog de error genérico mostrado');
  }
}
