import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '../firebase';

export interface Note {
  id?: string;
  userId: string;
  title: string;
  content: string;
  createdAt?: any;
  updatedAt?: any;
}

export async function createNote(userId: string, title: string, content: string) {
  return await addDoc(collection(db, 'documents'), {
    userId,
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateNote(noteId: string, title: string, content: string) {
  const noteRef = doc(db, 'documents', noteId);
  await updateDoc(noteRef, {
    title,
    content,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  const q = query(collection(db, 'documents'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Note))
    .filter(note => note.createdAt && note.updatedAt);
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  const noteRef = doc(db, 'documents', noteId);
  const noteSnap = await getDoc(noteRef);
  if (noteSnap.exists()) {
    return { id: noteSnap.id, ...noteSnap.data() } as Note;
  }
  return null;
}

export async function deleteNote(noteId: string): Promise<void> {
  const noteRef = doc(db, 'documents', noteId);
  await deleteDoc(noteRef);
} 