
import React, { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [assignee, setAssignee] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [assignees, setAssignees] = useState(['Алексей', 'Мария', 'Дмитрий', 'Анна'])
  const [newAssignee, setNewAssignee] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState({ firstName: '', lastName: '' })
  const [loginForm, setLoginForm] = useState({ firstName: '', lastName: '' })

  // Загрузка данных из localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('todoTasks')
    const savedAssignees = localStorage.getItem('todoAssignees')
    const savedUser = localStorage.getItem('todoUser')
    const savedAuth = localStorage.getItem('todoAuth')
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
    if (savedAssignees) {
      setAssignees(JSON.parse(savedAssignees))
    }
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // Сохранение данных в localStorage
  useEffect(() => {
    localStorage.setItem('todoTasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('todoAssignees', JSON.stringify(assignees))
  }, [assignees])

  useEffect(() => {
    localStorage.setItem('todoUser', JSON.stringify(currentUser))
    localStorage.setItem('todoAuth', isAuthenticated.toString())
  }, [currentUser, isAuthenticated])

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask,
        assignee: assignee || 'Общие дела',
        priority: priority,
        author: `${currentUser.firstName} ${currentUser.lastName}`,
        completed: false,
        createdAt: new Date().toLocaleString()
      }
      setTasks([...tasks, task])
      setNewTask('')
      setAssignee('')
      setPriority('medium')
    }
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const addAssignee = () => {
    if (newAssignee.trim() && !assignees.includes(newAssignee)) {
      setAssignees([...assignees, newAssignee])
      setNewAssignee('')
    }
  }

  const removeAssignee = (assigneeToRemove) => {
    setAssignees(assignees.filter(a => a !== assigneeToRemove))
    // Переназначить задачи удаленного исполнителя на "Общие дела"
    setTasks(tasks.map(task => 
      task.assignee === assigneeToRemove 
        ? { ...task, assignee: 'Общие дела' }
        : task
    ))
  }

  const handleLogin = () => {
    if (loginForm.firstName.trim() && loginForm.lastName.trim()) {
      setCurrentUser({
        firstName: loginForm.firstName,
        lastName: loginForm.lastName
      })
      setIsAuthenticated(true)
      setLoginForm({ firstName: '', lastName: '' })
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser({ firstName: '', lastName: '' })
    localStorage.removeItem('todoUser')
    localStorage.removeItem('todoAuth')
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    if (filter === 'general') return task.assignee === 'Общие дела'
    if (filter === 'completed') return task.completed
    if (filter === 'pending') return !task.completed
    if (filter === 'high') return task.priority === 'high'
    if (filter === 'medium') return task.priority === 'medium'
    if (filter === 'low') return task.priority === 'low'
    return task.assignee === filter
  })

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
    const pending = total - completed
    return { total, completed, pending }
  }

  const stats = getTaskStats()

  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-form">
            <h1>🔐 Авторизация</h1>
            <p>Введите ваши данные для входа в TODO Планировщик</p>
            <div className="form-group">
              <input
                type="text"
                value={loginForm.firstName}
                onChange={(e) => setLoginForm({...loginForm, firstName: e.target.value})}
                placeholder="Имя"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                value={loginForm.lastName}
                onChange={(e) => setLoginForm({...loginForm, lastName: e.target.value})}
                placeholder="Фамилия"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button onClick={handleLogin} className="login-button">
              Войти
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>📝 TODO Планировщик</h1>
            <div className="stats">
              <span>Всего: {stats.total}</span>
              <span>Выполнено: {stats.completed}</span>
              <span>В работе: {stats.pending}</span>
            </div>
          </div>
          <div className="header-right">
            <span className="user-info">
              Привет, {currentUser.firstName} {currentUser.lastName}!
            </span>
            <button onClick={handleLogout} className="logout-button">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="sidebar">
          <div className="assignee-management">
            <h3>Исполнители</h3>
            <div className="add-assignee">
              <input
                type="text"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                placeholder="Новый исполнитель"
                onKeyPress={(e) => e.key === 'Enter' && addAssignee()}
              />
              <button onClick={addAssignee}>+</button>
            </div>
            <ul className="assignee-list">
              {assignees.map(assignee => (
                <li key={assignee} className="assignee-item">
                  <span>{assignee}</span>
                  <button 
                    onClick={() => removeAssignee(assignee)}
                    className="remove-btn"
                    title="Удалить исполнителя"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="filters">
            <h3>Фильтры</h3>
            <div className="filter-buttons">
              <button 
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                Все задачи
              </button>
              <button 
                className={filter === 'general' ? 'active' : ''}
                onClick={() => setFilter('general')}
              >
                Общие дела
              </button>
              <button 
                className={filter === 'completed' ? 'active' : ''}
                onClick={() => setFilter('completed')}
              >
                Выполненные
              </button>
              <button 
                className={filter === 'pending' ? 'active' : ''}
                onClick={() => setFilter('pending')}
              >
                В работе
              </button>
              <button 
                className={filter === 'high' ? 'active' : ''}
                onClick={() => setFilter('high')}
              >
                🔴 Высокая важность
              </button>
              <button 
                className={filter === 'medium' ? 'active' : ''}
                onClick={() => setFilter('medium')}
              >
                🟡 Средняя важность
              </button>
              <button 
                className={filter === 'low' ? 'active' : ''}
                onClick={() => setFilter('low')}
              >
                🟢 Низкая важность
              </button>
              {assignees.map(assignee => (
                <button
                  key={assignee}
                  className={filter === assignee ? 'active' : ''}
                  onClick={() => setFilter(assignee)}
                >
                  {assignee}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="content">
          <div className="add-task">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Новая задача..."
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <select 
              value={assignee} 
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">Общие дела</option>
              {assignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
              className="priority-select"
            >
              <option value="high">🔴 Высокая</option>
              <option value="medium">🟡 Средняя</option>
              <option value="low">🟢 Низкая</option>
            </select>
            <button onClick={addTask}>Добавить</button>
          </div>

          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="no-tasks">
                {filter === 'all' ? 'Нет задач' : `Нет задач для фильтра "${filter}"`}
              </div>
            ) : (
              filteredTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                >
                  <div className="task-content">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <div className="task-info">
                      <span className="task-text">{task.text}</span>
                      <div className="task-meta">
                        <span className="assignee">{task.assignee}</span>
                        <span className={`priority priority-${task.priority}`}>
                          {task.priority === 'high' && '🔴 Высокая'}
                          {task.priority === 'medium' && '🟡 Средняя'}
                          {task.priority === 'low' && '🟢 Низкая'}
                        </span>
                        <span className="author">Автор: {task.author}</span>
                        <span className="created-at">{task.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="delete-btn"
                    title="Удалить задачу"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
