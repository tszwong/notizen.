export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ToDoListData {
  id: string;
  title: string;
  items: ChecklistItem[];
  tags?: Tag[];
  color?: string;
}

export interface ToDoListProps {
  title: string;
  items: ChecklistItem[];
  onRename?: (newTitle: string) => void;
  onChange: (items: ChecklistItem[]) => void;
  onDelete?: () => void;
  tags?: Tag[];
  onTagChange: (newTags: Tag[]) => void;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}