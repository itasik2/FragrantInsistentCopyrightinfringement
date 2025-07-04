
import React, { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [assignees, setAssignees] = useState(['Алексей', 'Мария', 'Дмитрий', 'Анна'])
  const [newAssignee, setNewAssignee] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState({ firstName: '', lastName: '' })
  const [loginForm, setLoginForm] = useState({ firstName: '', lastName: '' })
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showAssigneeModal, setShowAssigneeModal] = useState(false)
  const [newTaskForm, setNewTaskForm] = useState({
    task: '',
    department: '',
    lastName: '',
    roomNumber: '',
    assignee: '',
    priority: 'medium'
  })
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const [activeTab, setActiveTab] = useState('all')

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

  // Симуляция получения новых задач (здесь будет звук и уведомление)
  useEffect(() => {
    const interval = setInterval(() => {
      // Симуляция получения новой задачи каждые 30 секунд (для демонстрации)
      // В реальном приложении это будет WebSocket или polling API
      const shouldReceiveTask = Math.random() < 0.1 // 10% вероятность каждые 30 сек

      if (shouldReceiveTask && tasks.length > 0) {
        playNotificationSound()
        showNotification('Поступила новая задача!', 'success')
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [tasks.length])

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

  const addTaskFromModal = () => {
    if (newTaskForm.task.trim() && newTaskForm.department.trim() && 
        newTaskForm.lastName.trim() && newTaskForm.roomNumber.trim()) {
      const task = {
        id: Date.now(),
        text: newTaskForm.task,
        assignee: newTaskForm.assignee || 'Общие дела',
        priority: newTaskForm.priority,
        author: `${currentUser.firstName} ${currentUser.lastName}`,
        department: newTaskForm.department,
        lastName: newTaskForm.lastName,
        roomNumber: newTaskForm.roomNumber,
        completed: false,
        createdAt: new Date().toLocaleString()
      }
      setTasks([...tasks, task])
      setNewTaskForm({ 
        task: '', 
        department: '', 
        lastName: '', 
        roomNumber: '', 
        assignee: '',
        priority: 'medium' 
      })
      setShowTaskModal(false)
      
      showNotification('Задача успешно создана!')
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
    showNotification('Задача удалена')
  }

  const addAssignee = () => {
    if (newAssignee.trim() && !assignees.includes(newAssignee)) {
      setAssignees([...assignees, newAssignee])
      setNewAssignee('')
      setShowAssigneeModal(false)
      showNotification('Исполнитель добавлен')
    } else if (assignees.includes(newAssignee)) {
      showNotification('Такой исполнитель уже существует', 'error')
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
    showNotification('Исполнитель удален')
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

  // Функция для получения отфильтрованных задач
  const getFilteredTasks = (tabFilter) => {
    if (tabFilter === 'all') {
      return tasks // Все задачи
    }
    return tasks.filter(task => task.assignee === tabFilter)
  }

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
            <div className="assignee-header">
              <h3>👥 Исполнители ({assignees.length})</h3>
              <button 
                onClick={() => setShowAssigneeModal(true)}
                className="add-assignee-compact"
                title="Добавить исполнителя"
              >
                ➕
              </button>
            </div>
            <div className="assignee-grid">
              {assignees.map(assignee => (
                <div key={assignee} className="assignee-tag">
                  <span>{assignee}</span>
                  <button 
                    onClick={() => removeAssignee(assignee)}
                    className="remove-btn-small"
                    title="Удалить исполнителя"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="add-task-section">
            <button 
              onClick={() => setShowTaskModal(true)} 
              className="add-task-button"
            >
              ➕ Добавить новую задачу
            </button>
          </div>
        </div>

        <div className="content">
          <div className="tabs-container">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Все задачи ({tasks.length})
              </button>
              <button 
                className={`tab ${activeTab === 'Общие дела' ? 'active' : ''}`}
                onClick={() => setActiveTab('Общие дела')}
              >
                Общие дела ({getFilteredTasks('Общие дела').length})
              </button>
              {assignees.map(assignee => (
                <button
                  key={assignee}
                  className={`tab ${activeTab === assignee ? 'active' : ''}`}
                  onClick={() => setActiveTab(assignee)}
                >
                  {assignee} ({getFilteredTasks(assignee).length})
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Статус</th>
                  <th>Задача</th>
                  <th>Исполнитель</th>
                  <th>Подразделение</th>
                  <th>Контакт</th>
                  <th>Кабинет</th>
                  <th>Приоритет</th>
                  <th>Автор</th>
                  <th>Создано</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredTasks(activeTab).length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-tasks">
                      {activeTab === 'all' 
                        ? 'Нет задач' 
                        : `Нет задач для "${activeTab}"`
                      }
                    </td>
                  </tr>
                ) : (
                  getFilteredTasks(activeTab).map(task => (
                    <tr key={task.id} className={task.completed ? 'completed' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                        />
                      </td>
                      <td className="task-text">{task.text}</td>
                      <td>
                        <span className="assignee">{task.assignee}</span>
                      </td>
                      <td>
                        <span className="department">{task.department}</span>
                      </td>
                      <td>
                        <span className="contact">{task.lastName}</span>
                      </td>
                      <td>
                        <span className="room">{task.roomNumber}</span>
                      </td>
                      <td>
                        <span className={`priority priority-${task.priority}`}>
                          {task.priority === 'high' && '🔴 Высокая'}
                          {task.priority === 'medium' && '🟡 Средняя'}
                          {task.priority === 'low' && '🟢 Низкая'}
                        </span>
                      </td>
                      <td className="author">{task.author}</td>
                      <td className="created-at">{task.createdAt}</td>
                      <td>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="delete-btn"
                          title="Удалить задачу"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                      value={newTaskForm.assignee} 
                      onChange={(e) => setNewTaskForm({...newTaskForm, assignee: e.target.value})}
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
                    value={newTaskForm.priority} 
                    onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value})}
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

        {/* Модальное окно для добавления исполнителя */}
        {showAssigneeModal && (
          <div className="modal-overlay" onClick={() => setShowAssigneeModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>👤 Добавить исполнителя</h2>
                <button 
                  className="close-button"
                  onClick={() => setShowAssigneeModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Имя исполнителя *</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    placeholder="Введите имя исполнителя"
                    onKeyPress={(e) => e.key === 'Enter' && addAssignee()}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  onClick={() => setShowAssigneeModal(false)}
                  className="cancel-button"
                >
                  Отмена
                </button>
                <button 
                  onClick={addAssignee}
                  className="submit-button"
                >
                  Добавить исполнителя
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
