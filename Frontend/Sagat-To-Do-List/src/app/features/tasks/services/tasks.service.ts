import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { TaskStore } from '../../../core/stores/task.store';
import { type NewTaskData, type Task, type UpdateTaskData } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly taskStore = inject(TaskStore);
  private readonly apiUrl = 'http://localhost:5125/api/Tasks';

  // Obtener todas las tareas
  getAllTasks(): Observable<Task[]> {
    this.taskStore.setLoading(true);
    return this.http.get<Task[]>(this.apiUrl).pipe(
      tap(tasks => {
        this.taskStore.setTasks(tasks);
      }),
      catchError(error => {
        this.taskStore.setError(null);
        this.taskStore.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(taskData: NewTaskData): Observable<Task> {
    this.taskStore.setCreating(true);
    
    const tempTask: Task = {
      id: Date.now(), // ID temporal
      title: taskData.title,
      description: taskData.description,
      isCompleted: false,
      comentarios: []
    };

    this.taskStore.addTaskOptimistic(tempTask);

    return this.http.post<Task>(this.apiUrl, taskData).pipe(
      tap(realTask => {
        // Eliminar la tarea temporal y agregar la real
        this.taskStore.removeTaskOptimistic(tempTask.id);
        this.taskStore.addTaskOptimistic(realTask);
        this.taskStore.setCreating(false);
      }),
      catchError(error => {
        // Revertir optimistic update
        this.taskStore.removeTaskOptimistic(tempTask.id);
        this.taskStore.setError(null);
        this.taskStore.setCreating(false);
        return throwError(() => error);
      })
    );
  }

  updateTask(id: number, taskData: UpdateTaskData): Observable<Task> {
    this.taskStore.setUpdating(id, true);
    
    const currentTasks = this.taskStore.tasks();
    const currentTask = currentTasks.find((t: Task) => t.id === id);
    
    if (currentTask) {
      const updatedTask: Task = { ...currentTask, ...taskData };
      const oldTask = this.taskStore.updateTaskOptimistic(updatedTask);

      return this.http.put<Task>(`${this.apiUrl}/${id}`, taskData).pipe(
        tap(realUpdatedTask => {
          this.taskStore.updateTaskOptimistic(realUpdatedTask);
          this.taskStore.setUpdating(id, false);
        }),
        catchError(error => {
          if (oldTask) {
            this.taskStore.updateTaskOptimistic(oldTask);
          }
          this.taskStore.setError(null);
          this.taskStore.setUpdating(id, false);
          return throwError(() => error);
        })
      );
    }

    return throwError(() => new Error('Tarea no encontrada'));
  }

  deleteTask(id: number): Observable<void> {
    this.taskStore.setDeleting(id, true);
    
    const removedTask = this.taskStore.removeTaskOptimistic(id);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.taskStore.setDeleting(id, false);
      }),
      catchError(error => {
        // Revertir optimistic update
        if (removedTask) {
          this.taskStore.addTaskOptimistic(removedTask);
        }
        this.taskStore.setError(null);
        this.taskStore.setDeleting(id, false);
        return throwError(() => error);
      })
    );
  }

  toggleTaskCompletion(id: number, isCompleted: boolean): Observable<Task> {
    this.taskStore.setToggling(id, true);
    
    const currentTasks = this.taskStore.tasks();
    const currentTask = currentTasks.find((t: Task) => t.id === id);
    
    if (currentTask) {
      const toggledTask: Task = { ...currentTask, isCompleted };
      const oldTask = this.taskStore.updateTaskOptimistic(toggledTask);

      return this.updateTask(id, { isCompleted }).pipe(
        tap(() => {
          this.taskStore.setToggling(id, false);
        }),
        catchError(error => {
          if (oldTask) {
            this.taskStore.updateTaskOptimistic(oldTask);
          }
          this.taskStore.setToggling(id, false);
          return throwError(() => error);
        })
      );
    }

    this.taskStore.setToggling(id, false);
    return throwError(() => new Error('Tarea no encontrada'));
  }

  reloadTasks(): Observable<Task[]> {
    return this.getAllTasks();
  }
}
