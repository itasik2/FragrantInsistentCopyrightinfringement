
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
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTaskForm, setNewTaskForm] = useState({
    task: '',
    department: '',
    lastName: '',
    roomNumber: ''
  })
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

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

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' })
    }, 3000)
  }

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
      
      playNotificationSound()
      showNotification('Задача успешно добавлена!')
    }
  }

  const addTaskFromModal = () => {
    if (newTaskForm.task.trim() && newTaskForm.department.trim() && 
        newTaskForm.lastName.trim() && newTaskForm.roomNumber.trim()) {
      const task = {
        id: Date.now(),
        text: newTaskForm.task,
        assignee: assignee || 'Общие дела',
        priority: priority,
        author: `${currentUser.firstName} ${currentUser.lastName}`,
        department: newTaskForm.department,
        lastName: newTaskForm.lastName,
        roomNumber: newTaskForm.roomNumber,
        completed: false,
        createdAt: new Date().toLocaleString()
      }
      setTasks([...tasks, task])
      setNewTaskForm({ task: '', department: '', lastName: '', roomNumber: '' })
      setAssignee('')
      setPriority('medium')
      setShowTaskModal(false)
      
      playNotificationSound()
      showNotification('Задача успешно добавлена!')
    } else {
      showNotification('Пожалуйста, заполните все поля', 'error')
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
            <h3>Фильтр задач</h3>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все задачи</option>
              <option value="general">Общие дела</option>
              <option value="completed">Выполненные</option>
              <option value="pending">В работе</option>
              <option value="high">🔴 Высокая важность</option>
              <option value="medium">🟡 Средняя важность</option>
              <option value="low">🟢 Низкая важность</option>
              {assignees.map(assignee => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="content">
          <div className="add-task-header">
            <button 
              onClick={() => setShowTaskModal(true)} 
              className="add-task-button"
            >
              ➕ Добавить новую задачу
            </button>
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
                        {task.department && <span className="department">🏢 {task.department}</span>}
                        {task.lastName && <span className="contact">👤 {task.lastName}</span>}
                        {task.roomNumber && <span className="room">🚪 Каб. {task.roomNumber}</span>}
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

        {/* Уведомления */}
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        {/* Модальное окно для добавления задачи */}
        {showTaskModal && (
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📝 Добавить новую задачу</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowTaskModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Задача *</label>
                  <textarea
                    value={newTaskForm.task}
                    onChange={(e) => setNewTaskForm({...newTaskForm, task: e.target.value})}
                    placeholder="Описание задачи..."
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Подразделение *</label>
                    <input
                      type="text"
                      value={newTaskForm.department}
                      onChange={(e) => setNewTaskForm({...newTaskForm, department: e.target.value})}
                      placeholder="Название подразделения"
                    />
                  </div>

                  <div className="form-group">
                    <label>Фамилия *</label>
                    <input
                      type="text"
                      value={newTaskForm.lastName}
                      onChange={(e) => setNewTaskForm({...newTaskForm, lastName: e.target.value})}
                      placeholder="Фамилия ответственного"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Номер кабинета *</label>
                    <input
                      type="text"
                      value={newTaskForm.roomNumber}
                      onChange={(e) => setNewTaskForm({...newTaskForm, roomNumber: e.target.value})}
                      placeholder="Номер кабинета"
                    />
                  </div>

                  <div className="form-group">
                    <label>Исполнитель</label>
                    <select 
                      value={assignee} 
                      onChange={(e) => setAssignee(e.target.value)}
                    >
                      <option value="">Общие дела</option>
                      {assignees.map(assignee => (
                        <option key={assignee} value={assignee}>{assignee}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Приоритет</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    className="priority-select"
                  >
                    <option value="high">🔴 Высокая</option>
                    <option value="medium">🟡 Средняя</option>
                    <option value="low">🟢 Низкая</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  onClick={() => setShowTaskModal(false)}
                  className="cancel-button"
                >
                  Отмена
                </button>
                <button 
                  onClick={addTaskFromModal}
                  className="submit-button"
                >
                  Добавить задачу
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
