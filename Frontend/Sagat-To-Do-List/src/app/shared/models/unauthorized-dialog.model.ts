export interface UnauthorizedDialogData {
  type: 'delete' | 'access' | 'permission' | 'action';
  title: string;
  message: string;
  buttonText?: string;
}

export interface UnauthorizedDialogResult {
  acknowledged: boolean;
}
