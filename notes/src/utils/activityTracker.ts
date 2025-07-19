// Activity tracking for heatmap
const ACTIVITY_KEY = 'user_activity_data';

export interface ActivityData {
  [date: string]: boolean; // date in YYYY-MM-DD format, true if active that day
}

// Record activity for today
export const recordActivity = () => {
  const today = new Date().toISOString().split('T')[0];
  const activityData = getActivityData();
  
  activityData[today] = true;
  
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activityData));
};

// Get all activity data
export const getActivityData = (): ActivityData => {
  const stored = localStorage.getItem(ACTIVITY_KEY);
  return stored ? JSON.parse(stored) : {};
};

// Check if user was active on a specific date
export const wasActiveOnDate = (date: string): boolean => {
  const activityData = getActivityData();
  return activityData[date] || false;
};

// Get activity data in the format expected by react-calendar-heatmap
export const getHeatmapData = (startDate: Date, endDate: Date): { date: string; count: number }[] => {
  const activityData = getActivityData();
  const values: { date: string; count: number }[] = [];
  
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const wasActive = activityData[dateStr] || false;
    
    values.push({
      date: dateStr,
      count: wasActive ? 1 : 0
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return values;
};

// Clear activity data (useful for testing or reset)
export const clearActivityData = () => {
  localStorage.removeItem(ACTIVITY_KEY);
}; 