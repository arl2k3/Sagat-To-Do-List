import { Injectable, signal } from '@angular/core';
import { Task, TaskState } from '../../features/tasks/models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskStore {
  private taskState = signal<TaskState>({
    tasks: [],
    loading: false,
    error: null,
    operations: {
      creating: false,
      updating: new Set(),
      deleting: new Set(),
      toggling: new Set()
    }
  });

  readonly state = this.taskState.asReadonly();

  // Computed signals para acceso fácil
  readonly tasks = () => this.state().tasks;
  readonly loading = () => this.state().loading;
  readonly error = () => this.state().error;
  readonly isCreating = () => this.state().operations.creating;

  setLoading(loading: boolean): void {
    this.taskState.update(state => ({ ...state, loading }));
  }

  setError(error: string | null): void {
    this.taskState.update(state => ({ ...state, error }));
  }

  setTasks(tasks: Task[]): void {
    this.taskState.update(state => ({ 
      ...state, 
      tasks, 
      error: null,
      loading: false 
    }));
  }

  addTaskOptimistic(task: Task): void {
    this.taskState.update(state => ({
      ...state,
      tasks: [task, ...state.tasks],
      error: null
    }));
  }

  removeTaskOptimistic(taskId: number): Task | undefined {
    const currentTasks = this.state().tasks;
    const taskToRemove = currentTasks.find((t: Task) => t.id === taskId);
    
    this.taskState.update(state => ({
      ...state,
      tasks: state.tasks.filter((t: Task) => t.id !== taskId)
    }));

    return taskToRemove;
  }

  updateTaskOptimistic(updatedTask: Task): Task | undefined {
    const currentTasks = this.state().tasks;
    const oldTask = currentTasks.find((t: Task) => t.id === updatedTask.id);
    
    this.taskState.update(state => ({
      ...state,
      tasks: state.tasks.map((t: Task) => t.id === updatedTask.id ? updatedTask : t)
    }));

    return oldTask;
  }

  revertTasks(previousTasks: Task[]): void {
    this.taskState.update(state => ({
      ...state,
      tasks: previousTasks
    }));
  }

  setCreating(creating: boolean): void {
    this.taskState.update(state => ({
      ...state,
      operations: { ...state.operations, creating }
    }));
  }

  setUpdating(taskId: number, updating: boolean): void {
    this.taskState.update(state => {
      const newUpdating = new Set(state.operations.updating);
      if (updating) {
        newUpdating.add(taskId);
      } else {
        newUpdating.delete(taskId);
      }
      return {
        ...state,
        operations: { ...state.operations, updating: newUpdating }
      };
    });
  }

  setDeleting(taskId: number, deleting: boolean): void {
    this.taskState.update(state => {
      const newDeleting = new Set(state.operations.deleting);
      if (deleting) {
        newDeleting.add(taskId);
      } else {
        newDeleting.delete(taskId);
      }
      return {
        ...state,
        operations: { ...state.operations, deleting: newDeleting }
      };
    });
  }

  setToggling(taskId: number, toggling: boolean): void {
    this.taskState.update(state => {
      const newToggling = new Set(state.operations.toggling);
      if (toggling) {
        newToggling.add(taskId);
      } else {
        newToggling.delete(taskId);
      }
      return {
        ...state,
        operations: { ...state.operations, toggling: newToggling }
      };
    });
  }

  isUpdating(taskId: number): boolean {
    return this.state().operations.updating.has(taskId);
  }

  isDeleting(taskId: number): boolean {
    return this.state().operations.deleting.has(taskId);
  }

  isToggling(taskId: number): boolean {
    return this.state().operations.toggling.has(taskId);
  }

  reset(): void {
    this.taskState.set({
      tasks: [],
      loading: false,
      error: null,
      operations: {
        creating: false,
        updating: new Set(),
        deleting: new Set(),
        toggling: new Set()
      }
    });
  }
}
