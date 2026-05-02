export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toasts: Toast[] = $state([]);
let nextId = 0;

export function getToasts(): Toast[] {
  return toasts;
}

export function addToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  setTimeout(() => {
    removeToast(id);
  }, 4000);
}

export function removeToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
}
