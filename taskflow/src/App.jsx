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

function App() {
  const [tasks, setTasks] = useState(() => loadTasks())
  const [newTask, setNewTask] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  // Save to localStorage when tasks change
  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  // Add new task
  const handleAddTask = () => {
    const text = newTask.trim()
    if (!text) return

    const task = {
      id: generateId(),
      text,
      completed: false,
      createdAt: Date.now()
    }

    setTasks([task, ...tasks])
    setNewTask('')
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
  }

  // Save edit
  const handleSaveEdit = (id) => {
    const text = editText.trim()
    if (text) {
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, text } : task
      ))
    }
    setEditingId(null)
    setEditText('')
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
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
        <div className="task-input-wrapper">
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
      </div>

      {/* Task List */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p className="empty-text">暂无任务，开始添加吧！</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? 'completed' : ''}`}
            >
              {/* Checkbox */}
              <div
                className={`checkbox ${task.completed ? 'checked' : ''}`}
                onClick={() => handleToggleComplete(task.id)}
              />

              {/* Task Text or Edit Input */}
              {editingId === task.id ? (
                <input
                  type="text"
                  className="task-text-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => handleEditKeyPress(e, task.id)}
                  onBlur={() => handleSaveEdit(task.id)}
                  autoFocus
                />
              ) : (
                <span
                  className="task-text"
                  onDoubleClick={() => handleStartEdit(task)}
                >
                  {task.text}
                </span>
              )}

              {/* Action Buttons */}
              <div className="task-actions">
                {editingId === task.id ? (
                  <button
                    className="action-button save-button"
                    onClick={() => handleSaveEdit(task.id)}
                    title="保存"
                  >
                    ✓
                  </button>
                ) : (
                  <button
                    className="action-button edit-button"
                    onClick={() => handleStartEdit(task)}
                    title="编辑"
                  >
                    ✎
                  </button>
                )}
                <button
                  className="action-button delete-button"
                  onClick={() => handleDelete(task.id)}
                  title="删除"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
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
