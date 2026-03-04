import { useState, useEffect } from 'react'

// localStorage key
const STORAGE_KEY = 'taskflow-tasks'

// Load tasks from localStorage
function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Failed to load tasks:', e)
  }
  return []
}

// Save tasks to localStorage
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (e) {
    console.error('Failed to save tasks:', e)
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Check if due date is overdue
function isOverdue(dueDate) {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

// Check if due date is today
function isToday(dueDate) {
  if (!dueDate) return false
  const today = new Date()
  const due = new Date(dueDate)
  return today.toDateString() === due.toDateString()
}

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

// Format reminder time for display
function formatReminderTime(dateTimeStr) {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

function App() {
  const [tasks, setTasks] = useState(() => loadTasks())
  const [newTask, setNewTask] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskReminder, setNewTaskReminder] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editReminder, setEditReminder] = useState('')
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if ('Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })

  // Save to localStorage when tasks change
  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('此浏览器不支持通知功能')
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
  }

  // Check for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      tasks.forEach(task => {
        if (task.reminderTime && !task.completed && !task.reminderSent) {
          const reminderTime = new Date(task.reminderTime)
          if (now >= reminderTime) {
            if (notificationPermission === 'granted') {
              new Notification('Task Flow 提醒', {
                body: task.text,
                icon: '/vite.svg'
              })
            }
            setTasks(prevTasks => prevTasks.map(t =>
              t.id === task.id ? { ...t, reminderSent: true } : t
            ))
          }
        }
      })
    }

    const interval = setInterval(checkReminders, 10000)
    checkReminders()

    return () => clearInterval(interval)
  }, [tasks, notificationPermission])

  // Add new task
  const handleAddTask = () => {
    const text = newTask.trim()
    if (!text) return

    const task = {
      id: generateId(),
      text,
      completed: false,
      createdAt: Date.now(),
      dueDate: newTaskDueDate || null,
      reminderTime: newTaskReminder || null,
      reminderSent: false
    }

    setTasks([task, ...tasks])
    setNewTask('')
    setNewTaskDueDate('')
    setNewTaskReminder('')
  }

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTask()
    }
  }

  // Toggle task completion
  const handleToggleComplete = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  // Start editing
  const handleStartEdit = (task) => {
    setEditingId(task.id)
    setEditText(task.text)
    setEditDueDate(task.dueDate || '')
    setEditReminder(task.reminderTime || '')
  }

  // Save edit
  const handleSaveEdit = (id) => {
    const text = editText.trim()
    if (text) {
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, text, dueDate: editDueDate || null, reminderTime: editReminder || null, reminderSent: false } : task
      ))
    }
    setEditingId(null)
    setEditText('')
    setEditDueDate('')
    setEditReminder('')
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
    setEditDueDate('')
    setEditReminder('')
  }

  // Handle edit key press
  const handleEditKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id)
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  // Delete task
  const handleDelete = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  // Stats
  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-title">
          <div className="header-icon">✓</div>
          <h1>Task Flow</h1>
        </div>
      </header>

      {/* Task Input */}
      <div className="task-input-container">
        <div className="task-input-main">
          <input
            type="text"
            className="task-input"
            placeholder="添加新任务..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="add-button" onClick={handleAddTask} title="添加任务">
            +
          </button>
        </div>
        <div className="task-input-due-date">
          <label htmlFor="due-date">截止日期:</label>
          <input
            type="date"
            id="due-date"
            className="due-date-input"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
          />
          {newTaskDueDate && (
            <button 
              className="clear-date-btn"
              onClick={() => setNewTaskDueDate('')}
              title="清除日期"
            >
              ✕
            </button>
          )}
        </div>
        <div className="task-input-due-date">
          <label htmlFor="reminder">提醒时间:</label>
          <input
            type="datetime-local"
            id="reminder"
            className="due-date-input"
            value={newTaskReminder}
            onChange={(e) => setNewTaskReminder(e.target.value)}
          />
          {newTaskReminder && (
            <button 
              className="clear-date-btn"
              onClick={() => setNewTaskReminder('')}
              title="清除提醒"
            >
              ✕
            </button>
          )}
          {notificationPermission !== 'granted' && (
            <button 
              className="notification-permission-btn"
              onClick={requestNotificationPermission}
              title="开启通知"
            >
              🔔
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p className="empty-text">暂无任务，开始添加吧！</p>
          </div>
        ) : (
          tasks.map(task => {
            const overdue = !task.completed && isOverdue(task.dueDate)
            const today = !task.completed && isToday(task.dueDate)
            
            return (
              <div
                key={task.id}
                className={`task-item ${task.completed ? 'completed' : ''} ${overdue ? 'overdue' : ''} ${today ? 'due-today' : ''}`}
              >
                {/* Checkbox */}
                <div
                  className={`checkbox ${task.completed ? 'checked' : ''}`}
                  onClick={() => handleToggleComplete(task.id)}
                />

                {/* Task Content */}
                <div className="task-content">
                  {editingId === task.id ? (
                    <div className="edit-mode">
                      <input
                        type="text"
                        className="task-text-input"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => handleEditKeyPress(e, task.id)}
                        autoFocus
                      />
                      <div className="edit-due-date">
                        <input
                          type="date"
                          className="due-date-input"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                        />
                        <input
                          type="datetime-local"
                          className="due-date-input"
                          value={editReminder}
                          onChange={(e) => setEditReminder(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <span
                      className="task-text"
                      onDoubleClick={() => handleStartEdit(task)}
                    >
                      {task.text}
                    </span>
                  )}
                  
                  {/* Due Date Tag */}
                  {task.dueDate && !editingId && (
                    <span className={`due-date-tag ${overdue ? 'overdue' : ''} ${today ? 'today' : ''}`}>
                      📅 {formatDate(task.dueDate)}
                    </span>
                  )}

                  {/* Reminder Tag */}
                  {task.reminderTime && !editingId && (
                    <span className="reminder-tag">
                      🔔 {formatReminderTime(task.reminderTime)}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="task-actions">
                  {editingId === task.id ? (
                    <>
                      <button
                        className="action-button save-button"
                        onClick={() => handleSaveEdit(task.id)}
                        title="保存"
                      >
                        ✓
                      </button>
                      <button
                        className="action-button cancel-button"
                        onClick={handleCancelEdit}
                        title="取消"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="action-button edit-button"
                        onClick={() => handleStartEdit(task)}
                        title="编辑"
                      >
                        ✎
                      </button>
                      <button
                        className="action-button delete-button"
                        onClick={() => handleDelete(task.id)}
                        title="删除"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Stats Footer */}
      <div className="stats-footer">
        <div className="stats-info">
          <span>已完成 <span className="stats-count">{completedCount}</span> / 共 <span className="stats-count">{totalCount}</span> 项</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default App
