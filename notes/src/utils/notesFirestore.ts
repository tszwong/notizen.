// notesFirestore.ts

import { collection, addDoc, serverTimestamp, query, where, setDoc, getDocs, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
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

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  dueDate?: string;
}

export interface ToDoListData {
  id?: string;
  title: string;
  items: ChecklistItem[];
}

export interface AISummary {
  id?: string;
  userId: string;
  noteId: string | null;
  noteTitle: string;
  originalContent: string;
  summaryContent: string;
  createdAt?: any;
  expiresAt?: any;
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

// Create a new to-do list for a user
export async function createToDoList(userId: string, title: string) {
  console.log(`[createToDoList] userId: ${userId}, title: ${title}`);
  const docRef = await addDoc(collection(db, 'users', userId, 'todoLists'), {
    title,
    items: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log(`[createToDoList] Created list with id: ${docRef.id}`);
  return docRef;
}

// Get all to-do lists for a user
export async function getUserToDoLists(userId: string): Promise<ToDoListData[]> {
  console.log(`[getUserToDoLists] userId: ${userId}`);
  const q = query(collection(db, 'users', userId, 'todoLists'));
  const querySnapshot = await getDocs(q);
  const lists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ToDoListData));
  console.log(`[getUserToDoLists] Found ${lists.length} lists`);
  return lists;
}

// Update a to-do list's items or title
export async function updateToDoList(userId: string, listId: string, data: Partial<ToDoListData>) {
  console.log(`[updateToDoList] userId: ${userId}, listId: ${listId}, data:`, data);
  const listRef = doc(db, 'users', userId, 'todoLists', listId);
  await updateDoc(listRef, { ...data, updatedAt: serverTimestamp() });
  console.log(`[updateToDoList] Updated list ${listId}`);
}

// Delete a to-do list
export async function deleteToDoList(userId: string, listId: string) {
  console.log(`[deleteToDoList] userId: ${userId}, listId: ${listId}`);
  const listRef = doc(db, 'users', userId, 'todoLists', listId);
  await deleteDoc(listRef);
  console.log(`[deleteToDoList] Deleted list ${listId}`);
}

// Create a new AI summary entry
export async function createAISummary(
  userId: string, 
  noteId: string | null, 
  noteTitle: string,
  originalContent: string, 
  summaryContent: string
) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 3); // 3 days from now
  
  return await addDoc(collection(db, 'users', userId, 'aiSummaries'), {
    userId,
    noteId,
    noteTitle,
    originalContent,
    summaryContent,
    createdAt: serverTimestamp(),
    expiresAt: expirationDate,
  });
}

// Get all AI summaries for a user (non-expired)
export async function getUserAISummaries(userId: string): Promise<AISummary[]> {
  const now = new Date();
  const q = query(
    collection(db, 'users', userId, 'aiSummaries'),
    where('expiresAt', '>', now)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as AISummary))
    .sort((a, b) => {
      // Sort by createdAt, most recent first for display purposes
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return aTime.getTime() - bTime.getTime();
    });
}

// Delete expired AI summaries (cleanup function)
export async function deleteExpiredAISummaries(userId: string) {
  const now = new Date();
  const q = query(
    collection(db, 'users', userId, 'aiSummaries'),
    where('expiresAt', '<=', now)
  );
  const querySnapshot = await getDocs(q);
  
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  return querySnapshot.docs.length; // Return count of deleted summaries
}

// Delete a specific AI summary
export async function deleteAISummary(userId: string, summaryId: string): Promise<void> {
  const summaryRef = doc(db, 'users', userId, 'aiSummaries', summaryId);
  await deleteDoc(summaryRef);
}

// Update user statistics (e.g., note count, to-do lists)
export async function updateUserStats(userId: string, updates: any) {
  const statsRef = doc(db, 'users', userId, 'stats', 'main');
  await setDoc(statsRef, updates, { merge: true });
}

// Get user statistics
export async function getUserStats(userId: string) {
  const statsRef = doc(db, 'users', userId, 'stats', 'main');
  const snap = await getDoc(statsRef);
  return snap.exists() ? snap.data() : null;
}