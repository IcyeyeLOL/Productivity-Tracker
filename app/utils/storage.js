// localStorage utility functions for Productivity Tracker

export const STORAGE_KEY = 'productivity-tracker-data';

export const saveToStorage = (data) => {
  try {
    const dataWithTimestamp = {
      ...data,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
};

export const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};

export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
};

export const getDefaultData = () => ({
  stats: {
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalTimeToday: 0,
    currentSession: null
  },
  projects: [],
  tasks: [],
  isTimerRunning: false,
  timerSeconds: 0
});

export const exportData = () => {
  const data = loadFromStorage();
  if (data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }
  return false;
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (saveToStorage(data)) {
          resolve(data);
        } else {
          reject(new Error('Failed to save imported data'));
        }
      } catch (error) {
        reject(new Error('Invalid file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
