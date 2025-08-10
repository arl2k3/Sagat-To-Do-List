export interface Task {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  comentarios: Comentario[];
}

export interface Comentario {
  id: number;
  comment: string;
  isUpdated: boolean;
  taskId: number;
  parentCommentId: number | null;
  replies: Comentario[];
}

export interface NewTaskData {
  title: string;
  description: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  isCompleted?: boolean;
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  operations: {
    creating: boolean;
    updating: Set<number>;
    deleting: Set<number>;
    toggling: Set<number>;
  };
}
