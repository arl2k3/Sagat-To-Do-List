export interface Comment {
  id: number;
  comment: string;
  isUpdated: boolean;
  tareaId: number;
  parentCommentId?: number;
  replies: Comment[];
}

export interface NewCommentData {
  comment: string;
  taskId: number;
  parentCommentId?: number;
}

export interface UpdateCommentData {
  Comment: string;
}

export interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  operations: {
    creating: boolean;
    updating: Set<number>;
    deleting: Set<number>;
  };
}
