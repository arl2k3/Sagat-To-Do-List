import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { type Task } from '../../models/task.model';
import { TaskItemComponent } from '../task-item/task-item.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskItemComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent {
  @Input({required: true}) tasks: Task[] = [];
  @Output() taskDeleted = new EventEmitter<number>();
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() editTask = new EventEmitter<Task>();

  onTaskDeleted(taskId: number) {
    this.taskDeleted.emit(taskId);
  }

  onTaskUpdated(updatedTask: Task) {
    this.taskUpdated.emit(updatedTask);
  }

  onTaskEdit(task: Task) {
    this.editTask.emit(task);
  }
}
