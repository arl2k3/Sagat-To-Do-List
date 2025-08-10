import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Comment, CommentState, NewCommentData, UpdateCommentData } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5125/api/Comments';

  private commentsState = signal<CommentState>({
    comments: [],
    loading: false,
    error: null,
    operations: {
      creating: false,
      updating: new Set(),
      deleting: new Set()
    }
  });

  readonly comments = this.commentsState.asReadonly();

  getCommentsByTaskId(taskId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/Tasks/${taskId}`);
  }

  createComment(commentData: NewCommentData): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, commentData);
  }

  updateComment(commentId: number, commentData: UpdateCommentData): Observable<Comment> {
    return this.http.put<Comment>(`${this.apiUrl}/${commentId}`, commentData);
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${commentId}`);
  }

  clearState(): void {
    this.commentsState.set({
      comments: [],
      loading: false,
      error: null,
      operations: {
        creating: false,
        updating: new Set(),
        deleting: new Set()
      }
    });
  }
}
