export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  description?: string;
}

export interface ToDoListData {
  id: string;
  title: string;
  color?: string;
  items: ChecklistItem[];
}

export interface ToDoListProps {
  title: string;
  items: ChecklistItem[];
  onRename?: (newTitle: string) => void;
  onChange: (items: ChecklistItem[]) => void;
  onDelete?: () => void;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}