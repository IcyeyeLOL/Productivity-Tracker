'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { saveToStorage, loadFromStorage, clearStorage, getDefaultData, exportData, importData } from './utils/storage';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalTimeToday: 0,
    currentSession: null
  });

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState(false);
  const [pomodoroPhase, setPomodoroPhase] = useState('work'); // work, shortBreak, longBreak
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [taskTimers, setTaskTimers] = useState({});

  // Pomodoro timers (in seconds)
  const pomodoroTimers = useMemo(() => ({
    work: 25 * 60, // 25 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 15 * 60 // 15 minutes
  }), []);

  // Initialize data from localStorage or create fresh data
  useEffect(() => {
    const savedData = loadFromStorage();
    
    if (savedData) {
      setStats(savedData.stats || {
        totalProjects: 0,
        activeTasks: 0,
        completedTasks: 0,
        totalTimeToday: 0,
        currentSession: null
      });
      setProjects(savedData.projects || []);
      setTasks(savedData.tasks || []);
      setIsTimerRunning(savedData.isTimerRunning || false);
      setTimerSeconds(savedData.timerSeconds || 0);
      setIsDarkMode(savedData.isDarkMode || false);
      setPomodoroMode(savedData.pomodoroMode || false);
      setPomodoroPhase(savedData.pomodoroPhase || 'work');
      setPomodoroCount(savedData.pomodoroCount || 0);
      setActiveTaskId(savedData.activeTaskId || null);
      setTaskTimers(savedData.taskTimers || {});
    } else {
      // Fresh user - show welcome
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 3000);
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const data = {
      stats,
      projects,
      tasks,
      isTimerRunning,
      timerSeconds,
      isDarkMode,
      pomodoroMode,
      pomodoroPhase,
      pomodoroCount,
      activeTaskId,
      taskTimers
    };
    saveToStorage(data);
  }, [stats, projects, tasks, isTimerRunning, timerSeconds, isDarkMode, pomodoroMode, pomodoroPhase, pomodoroCount, activeTaskId, taskTimers]);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const playNotificationSound = useCallback(() => {
    // Create a simple notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, []);

  const handlePomodoroComplete = useCallback(() => {
    setIsTimerRunning(false);
    
    if (pomodoroPhase === 'work') {
      setPomodoroCount(prev => prev + 1);
      if (pomodoroCount + 1 >= 4) {
        setPomodoroPhase('longBreak');
        setPomodoroCount(0);
      } else {
        setPomodoroPhase('shortBreak');
      }
    } else {
      setPomodoroPhase('work');
    }
    
    setTimerSeconds(0);
  }, [pomodoroPhase, pomodoroCount]);

  // Timer functionality
  useEffect(() => {
    let interval = null;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          const newSeconds = prev + 1;
          
          // Update task timer if a task is active
          if (activeTaskId) {
            setTaskTimers(prevTimers => ({
              ...prevTimers,
              [activeTaskId]: (prevTimers[activeTaskId] || 0) + 1
            }));
          }
          
          // Check if Pomodoro timer is complete
          if (pomodoroMode) {
            const currentTimer = pomodoroTimers[pomodoroPhase];
            if (newSeconds >= currentTimer) {
              playNotificationSound();
              handlePomodoroComplete();
              return 0;
            }
          }
          
          return newSeconds;
        });
      }, 1000);
      setTimerInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, pomodoroMode, pomodoroPhase, activeTaskId, handlePomodoroComplete, pomodoroTimers, playNotificationSound]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
      medium: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
      low: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
      in_progress: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
      todo: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
    };
    return colors[status] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const startTaskTimer = (taskId) => {
    // Stop any currently running task timer
    if (activeTaskId && activeTaskId !== taskId) {
      stopTaskTimer(activeTaskId);
    }
    
    setActiveTaskId(taskId);
    setIsTimerRunning(true);
    
    // Initialize task timer if it doesn't exist
    if (!taskTimers[taskId]) {
      setTaskTimers(prev => ({
        ...prev,
        [taskId]: 0
      }));
    }
  };

  const stopTaskTimer = (taskId) => {
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
      setIsTimerRunning(false);
    }
  };

  const getTaskTime = (taskId) => {
    return taskTimers[taskId] || 0;
  };

  const formatTaskTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const togglePomodoroMode = () => {
    setPomodoroMode(!pomodoroMode);
    if (!pomodoroMode) {
      setTimerSeconds(0);
      setPomodoroPhase('work');
    }
  };

  const addProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now(),
        name: newProjectName.trim(),
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][projects.length % 6],
        tasks: 0,
        completed: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      setProjects([...projects, newProject]);
      setStats(prev => ({ ...prev, totalProjects: prev.totalProjects + 1 }));
      setNewProjectName('');
      setShowProjectModal(false);
    }
  };

  const deleteProject = (projectId) => {
    if (confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      const project = projects.find(p => p.id === projectId);
      const projectTasks = tasks.filter(t => t.project === project.name);
      
      setProjects(projects.filter(p => p.id !== projectId));
      setTasks(tasks.filter(t => t.project !== project.name));
      setStats(prev => ({ 
        ...prev, 
        totalProjects: prev.totalProjects - 1,
        activeTasks: Math.max(0, prev.activeTasks - projectTasks.filter(t => t.status !== 'completed').length),
        completedTasks: Math.max(0, prev.completedTasks - projectTasks.filter(t => t.status === 'completed').length)
      }));
    }
  };

  const completeProject = (projectId) => {
    const updatedProjects = projects.map(project => 
      project.id === projectId 
        ? { ...project, status: project.status === 'completed' ? 'active' : 'completed' }
        : project
    );
    setProjects(updatedProjects);
  };

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const priorities = ['low', 'medium', 'high'];
      const projectNames = projects.length > 0 ? projects.map(p => p.name) : ['General'];
      
      const newTask = {
        id: Date.now(),
        title: newTaskTitle.trim(),
        project: selectedProject || projectNames[0],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: 'todo',
        createdAt: new Date().toISOString()
      };
      
      setTasks([...tasks, newTask]);
      setStats(prev => ({ ...prev, activeTasks: prev.activeTasks + 1 }));
      
      // Update project task count if project exists
      if (selectedProject && projects.find(p => p.name === selectedProject)) {
        setProjects(projects.map(p => 
          p.name === newTask.project 
            ? { ...p, tasks: p.tasks + 1 }
            : p
        ));
      }
      
      setNewTaskTitle('');
      setSelectedProject('');
      setShowTaskModal(false);
    }
  };

  const completeTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const updatedTasks = tasks.map(t => 
      t.id === taskId 
        ? { ...t, status: 'completed' }
        : t
    );
    
    setTasks(updatedTasks);
    setStats(prev => ({ 
      ...prev, 
      activeTasks: Math.max(0, prev.activeTasks - 1),
      completedTasks: prev.completedTasks + 1
    }));
    
    // Update project completed count
    setProjects(projects.map(p => 
      p.name === task.project 
        ? { ...p, completed: p.completed + 1 }
        : p
    ));
  };

  const deleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
    setStats(prev => ({ 
      ...prev, 
      activeTasks: task.status !== 'completed' ? Math.max(0, prev.activeTasks - 1) : prev.activeTasks,
      completedTasks: task.status === 'completed' ? Math.max(0, prev.completedTasks - 1) : prev.completedTasks
    }));
    
    // Update project counts
    setProjects(projects.map(p => 
      p.name === task.project 
        ? { 
            ...p, 
            tasks: Math.max(0, p.tasks - 1),
            completed: task.status === 'completed' ? Math.max(0, p.completed - 1) : p.completed
          }
        : p
    ));
  };

  const resetData = () => {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      clearStorage();
      const defaultData = getDefaultData();
      setStats(defaultData.stats);
      setProjects(defaultData.projects);
      setTasks(defaultData.tasks);
      setIsTimerRunning(defaultData.isTimerRunning);
      setTimerSeconds(defaultData.timerSeconds);
      setPomodoroMode(false);
      setPomodoroPhase('work');
      setPomodoroCount(0);
      setActiveTaskId(null);
      setTaskTimers({});
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 3000);
    }
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const importedData = await importData(file);
      setStats(importedData.stats || getDefaultData().stats);
      setProjects(importedData.projects || []);
      setTasks(importedData.tasks || []);
      setIsTimerRunning(importedData.isTimerRunning || false);
      setTimerSeconds(importedData.timerSeconds || 0);
      setIsDarkMode(importedData.isDarkMode || false);
      setPomodoroMode(importedData.pomodoroMode || false);
      setPomodoroPhase(importedData.pomodoroPhase || 'work');
      setPomodoroCount(importedData.pomodoroCount || 0);
      setActiveTaskId(importedData.activeTaskId || null);
      setTaskTimers(importedData.taskTimers || {});
      alert('Data imported successfully!');
    } catch (error) {
      alert('Failed to import data: ' + error.message);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const getPomodoroPhaseText = () => {
    switch (pomodoroPhase) {
      case 'work': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Focus Time';
    }
  };

  const getPomodoroPhaseEmoji = () => {
    switch (pomodoroPhase) {
      case 'work': return '🎯';
      case 'shortBreak': return '☕';
      case 'longBreak': return '🧘';
      default: return '🎯';
    }
  };

  const getPomodoroProgress = () => {
    const currentTimer = pomodoroTimers[pomodoroPhase];
    return (timerSeconds / currentTimer) * 100;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Welcome Banner */}
      {showWelcome && (
        <div className={`p-4 text-center ${isDarkMode ? 'bg-green-600' : 'bg-green-500'} text-white`}>
          <p className="text-lg font-semibold">🎉 Welcome to Productivity Tracker!</p>
          <p className="text-sm">Start by adding your first project or task</p>
        </div>
      )}

      {/* Header */}
      <header className={`shadow-sm border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Productivity Tracker
              </h1>
              <p className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Track your projects, tasks, and time efficiently
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowProjectModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">📁</span>
                New Project
              </button>
              <button 
                onClick={() => setShowTaskModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <span className="mr-2">✓</span>
                New Task
              </button>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                <span className="mr-2">{isDarkMode ? '☀️' : '🌙'}</span>
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
              <button 
                onClick={() => exportData()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <span className="mr-2">📤</span>
                Export
              </button>
              <button 
                onClick={() => document.getElementById('import-file').click()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <span className="mr-2">📥</span>
                Import
              </button>
              <button 
                onClick={resetData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <span className="mr-2">🔄</span>
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">📁</div>
              <div className="ml-4">
                <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total Projects
                </p>
                <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalProjects}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">✓</div>
              <div className="ml-4">
                <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Active Tasks
                </p>
                <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.activeTasks}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">📊</div>
              <div className="ml-4">
                <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Completed Today
                </p>
                <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.completedTasks}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">⏰</div>
              <div className="ml-4">
                <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Time Today
                </p>
                <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatTimeMinutes(Math.floor(timerSeconds / 60))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timer Section */}
        <div className={`rounded-lg shadow p-6 mb-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {pomodoroMode ? '🍅 Pomodoro Timer' : '⏰ Time Tracking'}
              </h2>
              <p className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {pomodoroMode ? `${getPomodoroPhaseEmoji()} ${getPomodoroPhaseText()} - Session ${pomodoroCount + 1}` : 
                 activeTaskId ? `🎯 Working on: ${tasks.find(t => t.id === activeTaskId)?.title || 'Unknown Task'}` : 'Track your work sessions'}
              </p>
            </div>
            <button
              onClick={togglePomodoroMode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                pomodoroMode
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">🍅</span>
              {pomodoroMode ? 'Pomodoro ON' : 'Pomodoro OFF'}
            </button>
          </div>
          
          {pomodoroMode && (
            <div className="mb-4">
              <div className={`w-full rounded-full h-2 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${getPomodoroProgress()}%` }}
                ></div>
              </div>
              <p className={`text-sm mt-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {Math.floor((pomodoroTimers[pomodoroPhase] - timerSeconds) / 60)}:{(pomodoroTimers[pomodoroPhase] - timerSeconds) % 60 < 10 ? '0' : ''}{(pomodoroTimers[pomodoroPhase] - timerSeconds) % 60} remaining
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatTime(timerSeconds)}
                </div>
                <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Current Session
                </div>
              </div>
            </div>
            <button
              onClick={toggleTimer}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isTimerRunning
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <span className="mr-2">⏸️</span>
                  Stop Timer
                </>
              ) : (
                <>
                  <span className="mr-2">▶️</span>
                  Start Timer
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects */}
          <div className={`rounded-lg shadow transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center transition-colors duration-300 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Projects
              </h2>
              <span className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {projects.length} projects
              </span>
            </div>
            <div className="p-6">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📁</div>
                  <p className={`mb-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No projects yet
                  </p>
                  <button 
                    onClick={() => setShowProjectModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Project
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-300 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: project.color }}
                        ></div>
                        <div>
                          <h3 className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'} ${project.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                            {project.name}
                          </h3>
                          <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {project.completed}/{project.tasks} tasks completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {project.tasks > 0 ? Math.round((project.completed / project.tasks) * 100) : 0}%
                          </div>
                          <div className={`w-16 rounded-full h-2 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div 
                              className="h-2 rounded-full"
                              style={{ 
                                backgroundColor: project.color,
                                width: `${project.tasks > 0 ? (project.completed / project.tasks) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        <button
                          onClick={() => completeProject(project.id)}
                          className={`text-sm px-2 py-1 rounded transition-colors ${
                            project.status === 'completed' 
                              ? 'text-orange-600 hover:text-orange-700' 
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {project.status === 'completed' ? '↩️' : '✓'}
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-red-600 hover:text-red-700 text-sm px-2 py-1 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className={`rounded-lg shadow transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center transition-colors duration-300 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Tasks
              </h2>
              <span className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {tasks.length} tasks
              </span>
            </div>
            <div className="p-6">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✓</div>
                  <p className={`mb-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No tasks yet
                  </p>
                  <button 
                    onClick={() => setShowTaskModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Your First Task
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    // Group tasks by project
                    const groupedTasks = tasks.reduce((acc, task) => {
                      if (!acc[task.project]) {
                        acc[task.project] = [];
                      }
                      acc[task.project].push(task);
                      return acc;
                    }, {});

                    return Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
                      <div key={projectName} className="space-y-3">
                        {/* Project Header */}
                        <div className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                              📁
                            </div>
                            <div>
                              <h3 className={`font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {projectName}
                              </h3>
                              <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Active: {projectTasks.filter(t => t.status !== 'completed').length}
                              </div>
                              <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Completed: {projectTasks.filter(t => t.status === 'completed').length}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedProject(projectName);
                                setShowTaskModal(true);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            >
                              ➕ Add Task
                            </button>
                          </div>
                        </div>

                        {/* Tasks for this project */}
                        <div className="space-y-3 ml-4">
                          {projectTasks.map((task) => (
                            <div key={task.id} className={`p-4 border rounded-lg transition-colors duration-300 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} ${activeTaskId === task.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'} ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                      {task.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {task.status !== 'completed' && (
                                    <button
                                      onClick={() => completeTask(task.id)}
                                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                                    >
                                      ✓ Complete
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-red-600 hover:text-red-700 text-sm px-2 py-1 rounded"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              
                              {/* Task Timer Section */}
                              <div className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-50'}`}>
                                <div className="flex items-center space-x-3">
                                  <div className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    ⏱️ Time Spent: <span className="font-bold text-blue-600">{formatTaskTime(getTaskTime(task.id))}</span>
                                  </div>
                                  {activeTaskId === task.id && (
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      <span className="text-xs text-green-600 font-medium">ACTIVE</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {task.status !== 'completed' && (
                                    <>
                                      {activeTaskId === task.id ? (
                                        <button
                                          onClick={() => stopTaskTimer(task.id)}
                                          className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                                        >
                                          ⏸️ Stop
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => startTaskTimer(task.id)}
                                          className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                                        >
                                          ▶️ Start
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`mt-8 rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setShowProjectModal(true)}
              className={`p-4 border-2 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center ${
                isDarkMode 
                  ? 'border-gray-600 hover:border-blue-400 hover:bg-blue-900/20' 
                  : 'border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">📁</div>
              <div className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Add Project
              </div>
              <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Create a new project
              </div>
            </button>
            <button 
              onClick={() => setShowTaskModal(true)}
              className={`p-4 border-2 border-dashed rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center ${
                isDarkMode 
                  ? 'border-gray-600 hover:border-green-400 hover:bg-green-900/20' 
                  : 'border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">✓</div>
              <div className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Add Task
              </div>
              <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Create a new task
              </div>
            </button>
            <button 
              onClick={toggleTimer}
              className={`p-4 border-2 border-dashed rounded-lg transition-colors text-center ${
                isTimerRunning 
                  ? `border-red-500 ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}` 
                  : `border-gray-300 hover:border-green-500 hover:bg-green-50 ${isDarkMode ? 'border-gray-600 hover:border-green-400 hover:bg-green-900/20' : ''}`
              }`}
            >
              <div className="text-2xl mb-2">{isTimerRunning ? '⏸️' : '▶️'}</div>
              <div className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
              </div>
              <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Track your time
              </div>
            </button>
          </div>
        </div>

        {/* Task Time Summary */}
        <div className={`mt-8 rounded-lg shadow p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            📊 Task Time Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.filter(task => getTaskTime(task.id) > 0).map((task) => (
              <div key={task.id} className={`p-4 border rounded-lg transition-colors duration-300 ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.project}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold transition-colors duration-300 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {formatTaskTime(getTaskTime(task.id))}
                    </div>
                    <div className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      time spent
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {tasks.filter(task => getTaskTime(task.id) > 0).length === 0 && (
              <div className={`col-span-full text-center py-8 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="text-4xl mb-4">⏱️</div>
                <p>No time tracked yet. Start a task timer to see time summaries here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Info */}
        <div className={`mt-8 rounded-lg p-6 transition-colors duration-300 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
          <h2 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
            💾 Data Persistence
          </h2>
          <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
            Your data is automatically saved to localStorage and will persist between sessions. 
            Use the &quot;Reset&quot; button to start fresh anytime.
          </p>
        </div>
      </main>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Create New Project
            </h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className={`w-full p-3 border rounded-lg mb-4 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              onKeyPress={(e) => e.key === 'Enter' && addProject()}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowProjectModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={addProject}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Create New Task
            </h3>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              className={`w-full p-3 border rounded-lg mb-4 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                📁 Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              >
                <option value="">Select a project</option>
                {projects.length > 0 ? (
                  projects.map(project => (
                    <option key={project.id} value={project.name}>{project.name}</option>
                  ))
                ) : (
                  <option value="General">General</option>
                )}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        id="import-file"
        type="file"
        accept=".json"
        onChange={handleImportData}
        style={{ display: 'none' }}
      />
    </div>
  );
}