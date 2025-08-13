import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

const ACTIVITY_COLLECTION = 'user_activity';

export interface ActivityData {
  [date: string]: boolean; // date in YYYY-MM-DD format, true if active that day
}

const db = getFirestore();

// Record activity for today in Firestore
export const recordActivity = async (user: User) => {
  if (!user) return;
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, ACTIVITY_COLLECTION, user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { [today]: true });
  } else {
    await setDoc(ref, { [today]: true });
  }
};

// Get all activity data for the user
export const getActivityData = async (user: User): Promise<ActivityData> => {
  if (!user) return {};
  const ref = doc(db, ACTIVITY_COLLECTION, user.uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as ActivityData) : {};
};

// Check if user was active on a specific date
export const wasActiveOnDate = async (user: User, date: string): Promise<boolean> => {
  const data = await getActivityData(user);
  return data[date] || false;
};

// Get activity data in the format expected by react-calendar-heatmap
export const getHeatmapData = async (user: User, startDate: Date, endDate: Date): Promise<{ date: string; count: number }[]> => {
  const activityData = await getActivityData(user);
  const values: { date: string; count: number }[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const wasActive = activityData[dateStr] || false;
    values.push({ date: dateStr, count: wasActive ? 1 : 0 });
    current.setDate(current.getDate() + 1);
  }
  return values;
};

// Clear activity data for the user
export const clearActivityData = async (user: User) => {
  if (!user) return;
  const ref = doc(db, ACTIVITY_COLLECTION, user.uid);
  await setDoc(ref, {});
};

// Calculate the current streak (consecutive days with activity up to today)
export const getCurrentStreak = (activityData: { [date: string]: boolean }): number => {
  let streak = 0;
  const today = new Date();
  let current = new Date(today);

  while (true) {
    const dateStr = current.toISOString().split('T')[0];
    if (activityData[dateStr]) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};