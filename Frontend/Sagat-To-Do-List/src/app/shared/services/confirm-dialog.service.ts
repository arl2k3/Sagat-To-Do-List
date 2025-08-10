import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfirmDialogData, ConfirmDialogResult } from '../models/confirm-dialog.model';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialogDataSubject = new BehaviorSubject<ConfirmDialogData | null>(null);
  private isVisibleSubject = new BehaviorSubject<boolean>(false);
  private resultSubject = new BehaviorSubject<ConfirmDialogResult | null>(null);

  dialogData$ = this.dialogDataSubject.asObservable();
  isVisible$ = this.isVisibleSubject.asObservable();
  result$ = this.resultSubject.asObservable();

  show(data: ConfirmDialogData): Observable<ConfirmDialogResult> {
    this.dialogDataSubject.next(data);
    this.isVisibleSubject.next(true);
    
    return new Observable<ConfirmDialogResult>(observer => {
      const subscription = this.result$.subscribe(result => {
        if (result !== null) {
          observer.next(result);
          observer.complete();
          this.hide();
          this.resultSubject.next(null);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  hide(): void {
    this.isVisibleSubject.next(false);
    this.dialogDataSubject.next(null);
  }

  emitResult(result: ConfirmDialogResult): void {
    this.resultSubject.next(result);
  }

  confirmDeleteTask(taskTitle?: string): Observable<ConfirmDialogResult> {
    return this.show({
      type: 'task',
      title: 'Eliminar Tarea',
      message: taskTitle
        ? `¿Está seguro que desea eliminar la tarea "${taskTitle}"?`
        : '¿Está seguro que desea eliminar esta tarea?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });
  }

  confirmDeleteComment(): Observable<ConfirmDialogResult> {
    return this.show({
      type: 'comment',
      title: 'Eliminar Comentario',
      message: '¿Está seguro que desea eliminar este comentario?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });
  }
}
