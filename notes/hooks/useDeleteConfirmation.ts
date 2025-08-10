import { useState } from "react";

export interface DeleteConfirmationState {
  isOpen: boolean;
  listId: string;
  listTitle: string;
}

export const useDeleteConfirmation = () => {
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    listId: "",
    listTitle: ""
  });

  const initiateDelete = (listId: string, listTitle: string) => {
    setDeleteConfirmation({
      isOpen: true,
      listId,
      listTitle
    });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      listId: "",
      listTitle: ""
    });
  };

  return {
    deleteConfirmation,
    initiateDelete,
    cancelDelete
  };
};