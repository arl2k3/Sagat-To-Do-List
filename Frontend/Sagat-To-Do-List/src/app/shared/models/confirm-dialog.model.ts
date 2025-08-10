export interface ConfirmDialogData {
  type: 'task' | 'comment';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmDialogResult {
  confirmed: boolean;
}
