import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { type Task } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';

export interface NewTaskData {
  title: string;
  description: string;
}

function notOnlyWhitespace(control: AbstractControl) {
  if (control.value && control.value.trim().length === 0) {
    return { whitespace: true };
  }
  return null;
}

@Component({
  selector: 'app-new-task',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewTaskComponent {
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() cancelled = new EventEmitter<void>();
  
  private fb = inject(FormBuilder);
  private tasksService = inject(TasksService);

  isLoading = false;

  taskForm = this.fb.group({
    title: ['', [
      Validators.required, 
      Validators.minLength(3),
      Validators.maxLength(100),
      notOnlyWhitespace
    ]],
    description: ['', [
      Validators.maxLength(500)
    ]]
  });

  get titleControl() {
    return this.taskForm.get('title');
  }

  get descriptionControl() {
    return this.taskForm.get('description');
  }

  get titleErrors() {
    const control = this.titleControl;
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'El título es requerido';
      if (control.errors['minlength']) return 'El título debe tener al menos 3 caracteres';
      if (control.errors['maxlength']) return 'El título no puede tener más de 100 caracteres';
      if (control.errors['whitespace']) return 'El título no puede estar vacío';
    }
    return null;
  }

  get descriptionErrors() {
    const control = this.descriptionControl;
    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) return 'La descripción no puede tener más de 500 caracteres';
    }
    return null;
  }

  onCancel() {
    this.taskForm.reset();
    this.cancelled.emit();
  }

  onSubmit() {
    if (this.taskForm.valid && !this.isLoading) {
      this.isLoading = true;
      const formValue = this.taskForm.value;
      
      const newTaskData: NewTaskData = {
        title: formValue.title!.trim(),
        description: formValue.description?.trim() || ''
      };

      this.tasksService.createTask(newTaskData).subscribe({
        next: (createdTask) => {
          this.taskCreated.emit(createdTask);
          this.taskForm.reset();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating task:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.taskForm.markAllAsTouched();
    }
  }

  getTitleHelperText(): string {
    const length = this.titleControl?.value?.length || 0;
    return `${length}/100 caracteres`;
  }

  getDescriptionHelperText(): string {
    const length = this.descriptionControl?.value?.length || 0;
    return `${length}/500 caracteres`;
  }
}
