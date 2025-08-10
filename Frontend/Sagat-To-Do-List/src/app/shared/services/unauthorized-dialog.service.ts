import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UnauthorizedDialogData, UnauthorizedDialogResult } from '../models/unauthorized-dialog.model';

@Injectable({
  providedIn: 'root'
})
export class UnauthorizedDialogService {
  private dialogStateSubject = new BehaviorSubject<{
    isVisible: boolean;
    data: UnauthorizedDialogData | null;
  }>({
    isVisible: false,
    data: null
  });

  public dialogState$ = this.dialogStateSubject.asObservable();

  private resultSubject = new BehaviorSubject<UnauthorizedDialogResult | null>(null);
  public result$ = this.resultSubject.asObservable();

  show(data: Partial<UnauthorizedDialogData>): Observable<UnauthorizedDialogResult> {
    const defaultData: UnauthorizedDialogData = {
      type: 'action',
      title: 'Acción no autorizada',
      message: 'No tienes permisos para realizar esta acción.',
      buttonText: 'Entendido'
    };

    const dialogData = { ...defaultData, ...data };

    this.dialogStateSubject.next({
      isVisible: true,
      data: dialogData
    });

    return new Observable<UnauthorizedDialogResult>(observer => {
      const subscription = this.result$.subscribe(result => {
        if (result) {
          observer.next(result);
          observer.complete();
          this.resultSubject.next(null); // Reset
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  showDeleteError(customMessage?: string): Observable<UnauthorizedDialogResult> {
    return this.show({
      type: 'delete',
      title: 'No puedes eliminar esto',
      message: customMessage || 'No tienes permisos para eliminar este elemento. Solo el propietario o un administrador pueden eliminarlo.',
      buttonText: 'Entendido'
    });
  }

  showAccessError(customMessage?: string): Observable<UnauthorizedDialogResult> {
    return this.show({
      type: 'access',
      title: 'Acceso denegado',
      message: customMessage || 'No tienes acceso a esta funcionalidad. Contacta al administrador si necesitas permisos adicionales.',
      buttonText: 'Entendido'
    });
  }

  showPermissionError(customMessage?: string): Observable<UnauthorizedDialogResult> {
    return this.show({
      type: 'permission',
      title: 'Permisos insuficientes',
      message: customMessage || 'Tu nivel de permisos actual no te permite realizar esta operación.',
      buttonText: 'Entendido'
    });
  }

  showActionError(customMessage?: string): Observable<UnauthorizedDialogResult> {
    return this.show({
      type: 'action',
      title: 'Acción no permitida',
      message: customMessage || 'Esta acción no está permitida en este momento.',
      buttonText: 'Entendido'
    });
  }

  hide(): void {
    this.dialogStateSubject.next({
      isVisible: false,
      data: null
    });
  }


  handleResult(result: UnauthorizedDialogResult): void {
    this.resultSubject.next(result);
    this.hide();
  }

  get isVisible(): boolean {
    return this.dialogStateSubject.value.isVisible;
  }

  get currentData(): UnauthorizedDialogData | null {
    return this.dialogStateSubject.value.data;
  }
}
