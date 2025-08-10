import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TaskStore } from '../../../../core/stores/task.store';
import { type Task } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';
import { EditTaskModalComponent } from '../edit-task-modal/edit-task-modal.component';
import { NewTaskComponent } from '../new-task/new-task.component';
import { TaskListComponent } from '../task-list/task-list.component';

@Component({
  selector: 'app-tasks-main',
  standalone: true,
  imports: [CommonModule, TaskListComponent, NewTaskComponent, EditTaskModalComponent],
  templateUrl: './tasks-main.component.html',
  styleUrl: './tasks-main.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksMainComponent implements OnInit {
  private taskStore = inject(TaskStore);
  private tasksService = inject(TasksService);

  tasks = this.taskStore.tasks;
  loading = this.taskStore.loading;
  error = this.taskStore.error;

  showNewTaskForm = signal(false);
  
  showEditTaskForm = signal(false);
  taskToEdit = signal<Task | null>(null);

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.tasksService.getAllTasks().subscribe();
  }

  toggleNewTask() {
    this.showNewTaskForm.update(show => !show);
  }

  onTaskCreated(task: Task) {
    this.showNewTaskForm.set(false);
  }

  onNewTaskCancelled() {
    this.showNewTaskForm.set(false);
  }

  onTaskDeleted(taskId: number) {
    this.tasksService.deleteTask(taskId).subscribe();
  }

  onTaskUpdated(updatedTask: Task) {
    this.tasksService.updateTask(updatedTask.id, updatedTask).subscribe();
  }

  onTaskEdit(task: Task) {
    this.taskToEdit.set(task);
    this.showEditTaskForm.set(true);
  }

  onEditTaskUpdated(updatedTask: Task) {
    this.showEditTaskForm.set(false);
    this.taskToEdit.set(null);
  }

  onEditTaskCancelled() {
    this.showEditTaskForm.set(false);
    this.taskToEdit.set(null);
  }
}
