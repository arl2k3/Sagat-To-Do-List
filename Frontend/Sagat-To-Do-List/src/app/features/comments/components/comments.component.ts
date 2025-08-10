import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { UnauthorizedDialogService } from '../../../shared/services/unauthorized-dialog.service';
import { Comment } from '../models/comment.model';
import { CommentsService } from '../services/comments.service';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentsComponent implements OnInit, OnDestroy {
  @Input({required: true}) taskId!: number;
  
  private commentsService = inject(CommentsService);
  private confirmDialogService = inject(ConfirmDialogService);
  private unauthorizedService = inject(UnauthorizedDialogService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  
  // Estado local con signals (en lugar del servicio global)
  comments = signal<Comment[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  creating = signal(false);
  updating = signal<Set<number>>(new Set());
  deleting = signal<Set<number>>(new Set());
  
  editingCommentId = signal<number | null>(null);
  replyingToCommentId = signal<number | null>(null);

  newCommentForm = this.fb.group({
    comment: ['', [Validators.required, Validators.minLength(1)]]
  });

  editCommentForm = this.fb.group({
    comment: ['', [Validators.required, Validators.minLength(1)]]
  });

  replyForm = this.fb.group({
    comment: ['', [Validators.required, Validators.minLength(1)]]
  });

  ngOnInit() {
    this.loadComments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadComments() {
    this.loading.set(true);
    this.error.set(null);
    
    this.commentsService.getCommentsByTaskId(this.taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comments) => {
          this.comments.set(comments);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set('Error al cargar comentarios');
          this.loading.set(false);
        }
      });
  }

  onAddComment() {
    if (this.taskId < 1e12) {
      if (this.newCommentForm.valid) {
        const commentData: any = {
          comment: this.newCommentForm.value.comment!,
          taskId: this.taskId
        };

        this.creating.set(true);
        this.commentsService.createComment(commentData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (newComment) => {
              this.loadComments();
              this.newCommentForm.reset();
              this.creating.set(false);
            },
            error: (error) => {
              this.handleError(error, 'crear comentario');
              this.creating.set(false);
            }
          });
      }
    } else {
      alert('No puedes comentar en una tarea que aún no ha sido guardada.');
    }
  }

  onReplyToComment(parentCommentId: number) {
    if (this.replyForm.valid) {
      const replyData: any = {
        comment: this.replyForm.value.comment!,
        taskId: this.taskId,
        parentCommentId: parentCommentId
      };

      this.creating.set(true);
      this.commentsService.createComment(replyData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newReply) => {
            this.loadComments();
            this.replyForm.reset();
            this.replyingToCommentId.set(null);
            this.creating.set(false);
          },
          error: (error) => {
            this.handleError(error, 'crear respuesta');
            this.creating.set(false);
          }
        });
    }
  }

  startEdit(comment: Comment) {
    this.editingCommentId.set(comment.id);
    this.editCommentForm.patchValue({ comment: comment.comment });
  }

  cancelEdit() {
    this.editingCommentId.set(null);
    this.editCommentForm.reset();
  }

  onUpdateComment() {
    const commentId = this.editingCommentId();
    if (this.editCommentForm.valid && commentId) {
      const original = this.comments().find(c => c.id === commentId);
      const updateData = {
        Comment: this.editCommentForm.value.comment!,
        isUpdated: true,
        tareaId: original?.tareaId,
        parentCommentId: original?.parentCommentId ?? undefined,
        replies: original?.replies ?? []
      };

      this.updating.update(set => new Set(set).add(commentId));
      this.commentsService.updateComment(commentId, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedComment) => {
            this.comments.update(comments => 
              comments.map(c => c.id === commentId ? updatedComment : c)
            );
            this.updating.update(set => {
              const newSet = new Set(set);
              newSet.delete(commentId);
              return newSet;
            });
            this.cancelEdit();
          },
          error: (error) => {
            this.updating.update(set => {
              const newSet = new Set(set);
              newSet.delete(commentId);
              return newSet;
            });
            this.handleError(error, 'actualizar comentario');
          }
        });
    }
  }

  onDeleteComment(comment: Comment) {
    this.confirmDialogService.confirmDeleteComment()
      .subscribe(result => {
        if (result.confirmed) {
          this.deleteComment(comment.id);
        }
      });
  }

  private deleteComment(commentId: number) {
    const originalComments = this.comments();
    const removeCommentRecursively = (comments: Comment[], targetId: number): Comment[] => {
      return comments.filter(comment => {
        if (comment.id === targetId) {
          return false; 
        }
        
        if (comment.replies && comment.replies.length > 0) {
          comment.replies = removeCommentRecursively(comment.replies, targetId);
        }
        
        return true; 
      });
    };
    
    this.comments.update(comments => removeCommentRecursively(comments, commentId));
    
    this.deleting.update(set => new Set(set).add(commentId));
    this.commentsService.deleteComment(commentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting.update(set => {
            const newSet = new Set(set);
            newSet.delete(commentId);
            return newSet;
          });
        },
        error: (error) => {
          this.loadComments();
          this.deleting.update(set => {
            const newSet = new Set(set);
            newSet.delete(commentId);
            return newSet;
          });
          this.handleError(error, 'eliminar comentario');
        }
      });
  }

  startReply(commentId: number) {
    this.replyingToCommentId.set(commentId);
    this.replyForm.reset();
  }

  cancelReply() {
    this.replyingToCommentId.set(null);
    this.replyForm.reset();
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }

  get isCreating() {
    return this.creating();
  }

  isUpdating(commentId: number): boolean {
    return this.updating().has(commentId);
  }

  isDeleting(commentId: number): boolean {
    return this.deleting().has(commentId);
  }

  private handleError(error: any, action: string): void {
    console.log('Error completo:', error);

    if (error.status === 401 || error.status === 403) {
      this.unauthorizedService.showActionError(
        `No tienes permisos para ${action}. Solo el propietario puede modificarlo.`
      ).subscribe();
      return;
    }

    if (error.status === 500) {
      let errorMessage = this.extractErrorMessage(error);

      if (this.isAuthorizationError(errorMessage)) {
        this.unauthorizedService.showActionError(
          `No tienes permisos para ${action}. Solo el propietario puede modificarlo.`
        ).subscribe();
        return;
      }

      this.unauthorizedService.showActionError(
        `No tienes permisos para ${action}. Solo el propietario puede modificarlo.`
      ).subscribe();
      return;
    }

    this.unauthorizedService.show({
      type: 'action',
      title: `Error al ${action}`,
      message: `Ocurrió un error inesperado. Por favor, inténtalo de nuevo.`,
      buttonText: 'Entendido'
    }).subscribe();
  }

  private extractErrorMessage(error: any): string {
    if (typeof error.error === 'string') return error.error;
    if (error.error?.message) return error.error.message;
    if (error.error?.title) return error.error.title;
    if (error.message) return error.message;
    return '';
  }

  private isAuthorizationError(errorMessage: string): boolean {
    const authKeywords = [
      'no tienes permisos',
      'not authorized',
      'authentication',
      'authorization',
      'permisos'
    ];
    
    return authKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword)
    );
  }
}
