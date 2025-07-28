import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./App.css";

const API_BASE = "/api";
const ADMIN_PASSWORD = "admin123";

export default function App() {
  // Состояния
  const [tasks, setTasks] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    foreman: "",
    lab: "",
    roomNumber: "",
    description: "",
    assignee: "",
    priority: "medium"
  });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success"
  });
  const [hideCompleted, setHideCompleted] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [newAssignee, setNewAssignee] = useState("");
  const [timeModal, setTimeModal] = useState({
    show: false,
    taskId: null,
    hours: 0,
    minutes: 0,
    error: ""
  });

  // Мемоизированные значения
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === "выполнено").length,
    inProgress: tasks.filter(t => t.status === "в работе").length,
    new: tasks.filter(t => t.status === "новая").length
  }), [tasks]);

  // Функция для API запросов
  const apiRequest = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API error:", error);
      showNotification(error.message || "Ошибка соединения с сервером", "error");
      throw error;
    }
  }, []);

  // Загрузка данных
  const loadData = useCallback(async () => {
    try {
      const data = await apiRequest("/data");
      setTasks(data.tasks || []);
      setAssignees(data.assignees || []);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    }
  }, [apiRequest]);

  // Эффекты
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setAdminMode(user.isAdmin || false);
      } catch (e) {
        console.error("Ошибка при чтении пользователя из localStorage:", e);
        localStorage.removeItem("currentUser");
      }
    }
    loadData();
  }, [loadData]);

  // Уведомления
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ show: true, message, type });
    const timer = setTimeout(() => 
      setNotification(prev => prev.show ? { ...prev, show: false } : prev), 
      3000
    );
    return () => clearTimeout(timer);
  }, []);

  // Авторизация
  const handleLogin = useCallback((userData, isAdmin = false) => {
    const user = { ...userData, isAdmin };
    setCurrentUser(user);
    setIsAuthenticated(true);
    setAdminMode(isAdmin);
    localStorage.setItem("currentUser", JSON.stringify(user));
    showNotification(`Добро пожаловать, ${userData.firstName}!`);
  }, [showNotification]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAdminMode(false);
    localStorage.removeItem("currentUser");
    showNotification("Вы вышли из системы");
  }, [showNotification]);

  // Работа с задачами
  const addTaskFromModal = useCallback(async () => {
    const requiredFields = ['foreman', 'lab', 'roomNumber', 'description'];
    const missingFields = requiredFields.filter(field => !newTaskForm[field].trim());
    
    if (missingFields.length > 0) {
      return showNotification("Заполните все обязательные поля", "error");
    }

    try {
      const taskData = {
        ...newTaskForm,
        createdAt: new Date().toISOString(),
        status: "новая",
        acceptedAt: null,
        completedAt: null,
        timeSpent: null,
        author: `${currentUser.firstName} ${currentUser.lastName}`
      };

      const newTask = await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify(taskData),
      });

      setTasks(prev => [...prev, newTask]);
      setNewTaskForm({
        foreman: "",
        lab: "",
        roomNumber: "",
        description: "",
        assignee: "",
        priority: "medium"
      });
      setShowTaskModal(false);
      showNotification("Заявка создана!");
    } catch (error) {
      console.error("Ошибка при создании заявки:", error);
    }
  }, [apiRequest, currentUser, newTaskForm, showNotification]);

  const updateTask = useCallback(async (id, updates) => {
    try {
      const updatedTask = await apiRequest(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      return updatedTask;
    } catch (error) {
      console.error("Ошибка при обновлении заявки:", error);
      throw error;
    }
  }, [apiRequest]);

  const deleteTask = useCallback(async (id) => {
    try {
      await apiRequest(`/tasks/${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(task => task.id !== id));
      showNotification("Заявка удалена");
    } catch (error) {
      showNotification("Ошибка при удалении заявки", "error");
    }
  }, [apiRequest, showNotification]);

  // Работа с исполнителями
  const addAssignee = useCallback(async (assigneeName) => {
    try {
      await apiRequest("/assignees", {
        method: "POST",
        body: JSON.stringify({ name: assigneeName }),
      });
      setAssignees(prev => [...prev, assigneeName]);
      showNotification("Исполнитель добавлен");
    } catch (error) {
      showNotification("Ошибка при добавлении исполнителя", "error");
    }
  }, [apiRequest, showNotification]);

  const removeAssignee = useCallback(async (assignee) => {
    try {
      await apiRequest(`/assignees/${encodeURIComponent(assignee)}`, {
        method: "DELETE",
      });
      setAssignees(prev => prev.filter(a => a !== assignee));
      showNotification("Исполнитель удалён");
    } catch (error) {
      showNotification("Ошибка при удалении исполнителя", "error");
    }
  }, [apiRequest, showNotification]);

  // Обработка изменения статуса задачи
  const handleStatusChange = useCallback(async (taskId, newStatus, currentStatus) => {
    if (currentStatus === "выполнено" && !adminMode) {
      return showNotification("Только администратор может изменять выполненные задачи", "error");
    }

    if (newStatus === "выполнено") {
      setTimeModal({
        show: true,
        taskId,
        hours: 0,
        minutes: 0,
        error: ""
      });
    } else {
      const updates = { status: newStatus };
      if (newStatus === "в работе") updates.acceptedAt = new Date().toISOString();
      await updateTask(taskId, updates);
    }
  }, [adminMode, showNotification, updateTask]);

  // Сохранение времени выполнения
  const saveTimeSpent = useCallback(async () => {
    if (timeModal.hours < 0 || timeModal.minutes < 0 || timeModal.minutes >= 60) {
      return setTimeModal(prev => ({
        ...prev,
        error: "Введите корректное время (часы ≥ 0, 0 ≤ минуты < 60)"
      }));
    }

    const timeSpent = `${timeModal.hours}ч ${timeModal.minutes}м`;
    await updateTask(timeModal.taskId, {
      status: "выполнено",
      timeSpent,
      completedAt: new Date().toISOString()
    });
    setTimeModal({ show: false, taskId: null, hours: 0, minutes: 0, error: "" });
  }, [timeModal, updateTask]);

  // Фильтрация задач
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesDate = !dateFilter || 
        new Date(task.createdAt).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
      const matchesHideCompleted = !hideCompleted || task.status !== "выполнено";
      return matchesDate && matchesHideCompleted;
    });
  }, [tasks, dateFilter, hideCompleted]);

  // Форматирование даты
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return "-";
    
    if (typeof dateString === 'string' && dateString.match(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/)) {
      return dateString;
    }
  
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return "-";
      }
      return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return "-";
    }
  }, []);

  // Компоненты

  function LoginForm({ onLogin, onAdminLogin }) {
    const [formData, setFormData] = useState({ 
      firstName: "", 
      lastName: "", 
      password: "" 
    });
    const [isAdminLogin, setIsAdminLogin] = useState(false);

    const handleLogin = () => {
      if (!formData.firstName.trim()) {
        return showNotification("Введите имя", "error");
      }
      onLogin(formData);
    };

    const handleAdminLogin = () => {
      if (formData.password !== ADMIN_PASSWORD) {
        return showNotification("Неверный пароль администратора", "error");
      }
      onAdminLogin(formData);
    };

    return (
      <div className="login-container">
        <div className="login-form">
          <h1>🔐 Авторизация</h1>
          
          {!isAdminLogin ? (
            <>
              <div className="form-group">
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Имя"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Фамилия"
                />
              </div>
              <button 
                onClick={handleLogin} 
                className="login-button"
              >
                Войти
              </button>
              <button 
                onClick={() => setIsAdminLogin(true)} 
                className="admin-login-button"
              >
                Войти как администратор
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Пароль администратора"
                />
              </div>
              <button 
                onClick={handleAdminLogin} 
                className="login-button"
              >
                Войти как админ
              </button>
              <button 
                onClick={() => setIsAdminLogin(false)} 
                className="cancel-button"
              >
                Отмена
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function Header({ user, onLogout, stats }) {
    return (
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>📝 Система управления заявками</h1>
            <div className="stats">
              <span>Всего: {stats.total}</span>
              <span>Новые: {stats.new}</span>
              <span>В работе: {stats.inProgress}</span>
              <span>Выполнено: {stats.completed}</span>
            </div>
          </div>
          <div className="header-right">
            <span className="user-info">
              {user.firstName} {user.lastName} {user.isAdmin && "(Admin)"}
            </span>
            <button onClick={onLogout} className="logout-button">
              Выйти
            </button>
          </div>
        </div>
      </header>
    );
  }

  function TaskTable({
    tasks,
    assignees,
    adminMode,
    onStatusChange,
    onDelete,
    formatDateTime,
    onAssigneeChange
  }) {
    const [editingTime, setEditingTime] = useState(null);
    const [timeInput, setTimeInput] = useState("");

    const handleTimeEdit = (taskId, currentTime) => {
      if (!adminMode) return;
      
      setTimeInput(currentTime || "");
      setEditingTime(taskId);
    };

    const saveTime = (taskId) => {
      onAssigneeChange(taskId, timeInput);
      setEditingTime(null);
    };

    return (
      <div className="table-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Дата подачи</th>
              <th>Бригадир</th>
              <th>Лаборатория</th>
              <th>Кабинет</th>
              <th>Описание</th>
              <th>Дата принятия</th>
              <th>Статус</th>
              <th>Время работы</th>
              <th>Исполнитель</th>
              {adminMode && <th>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={adminMode ? 10 : 9} className="no-tasks">
                  Нет заявок
                </td>
              </tr>
            ) : (
              tasks.map(task => (
                <tr 
                  key={task.id} 
                  className={`task-row priority-${task.priority} status-${task.status}`}
                >
                  <td>{formatDateTime(task.createdAt)}</td>
                  <td>{task.foreman}</td>
                  <td>{task.lab}</td>
                  <td>{task.roomNumber}</td>
                  <td className="task-description">{task.description}</td>
                  <td>{formatDateTime(task.acceptedAt)}</td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value, task.status)}
                      disabled={task.status === "выполнено" && !adminMode}
                    >
                      <option value="новая">Новая</option>
                      <option value="в работе">В работе</option>
                      <option value="выполнено">Выполнено</option>
                    </select>
                  </td>
                  <td>
                    {editingTime === task.id ? (
                      <div className="time-edit">
                        <input
                          type="text"
                          value={timeInput}
                          onChange={(e) => setTimeInput(e.target.value)}
                          placeholder="Например: 2ч 30м"
                        />
                        <button onClick={() => saveTime(task.id)}>✓</button>
                        <button onClick={() => setEditingTime(null)}>×</button>
                      </div>
                    ) : (
                      <span 
                        className="time-display" 
                        onClick={() => handleTimeEdit(task.id, task.timeSpent)}
                        style={{ cursor: adminMode ? 'pointer' : 'default' }}
                      >
                        {task.timeSpent || "-"}
                      </span>
                    )}
                  </td>
                  <td>
                    <select
                      value={task.assignee || ""}
                      onChange={(e) => onAssigneeChange(task.id, e.target.value)}
                      disabled={!adminMode}
                    >
                      <option value="">Не назначен</option>
                      {assignees.map(assignee => (
                        <option key={assignee} value={assignee}>{assignee}</option>
                      ))}
                    </select>
                  </td>
                  {adminMode && (
                    <td>
                      <button 
                        onClick={() => onDelete(task.id)} 
                        className="delete-btn"
                        title="Удалить заявку"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function TaskModal({ show, onClose, formData, onFormChange, assignees, onSubmit }) {
    if (!show) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📝 Новая заявка</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Ф.И.О. Бригадира *</label>
                <input
                  type="text"
                  name="foreman"
                  value={formData.foreman}
                  onChange={onFormChange}
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div className="form-group">
                <label>Лаборатория *</label>
                <input
                  type="text"
                  name="lab"
                  value={formData.lab}
                  onChange={onFormChange}
                  placeholder="Название лаборатории"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Номер кабинета *</label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={onFormChange}
                  placeholder="123"
                />
              </div>
              <div className="form-group">
                <label>Приоритет</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={onFormChange}
                >
                  <option value="high">Высокий</option>
                  <option value="medium">Средний</option>
                  <option value="low">Низкий</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Описание *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={onFormChange}
                placeholder="Подробное описание проблемы..."
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Исполнитель</label>
              <select
                name="assignee"
                value={formData.assignee}
                onChange={onFormChange}
              >
                <option value="">Не назначен</option>
                {assignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={onClose} className="cancel-button">Отмена</button>
            <button onClick={onSubmit} className="submit-button">Создать</button>
          </div>
        </div>
      </div>
    );
  }

  function Notification({ show, message, type }) {
    if (!show) return null;
    return <div className={`notification ${type}`}>{message}</div>;
  }

  function TimeInputModal({ show, onClose, hours, minutes, onHoursChange, onMinutesChange, onSave, error }) {
    if (!show) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content time-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Введите время выполнения</h3>
          {error && <div className="error-message">{error}</div>}
          <div className="time-inputs">
            <div className="time-input-group">
              <label>Часы:</label>
              <input
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => onHoursChange(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="time-input-group">
              <label>Минуты:</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => onMinutesChange(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="modal-buttons">
            <button onClick={onClose}>Отмена</button>
            <button onClick={onSave} className="save-btn">Сохранить</button>
          </div>
        </div>
      </div>
    );
  }

  function AssigneeManagement({ assignees, onAdd, onRemove }) {
    const [newAssignee, setNewAssignee] = useState("");
  
    const handleAdd = () => {
      if (newAssignee.trim()) {
        onAdd(newAssignee);
        setNewAssignee("");
      }
    };
  
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleAdd();
      }
    };
  
    return (
      <div className="admin-panel">
        <h2>Управление исполнителями</h2>
        <div className="assignee-management">
          <div className="add-assignee">
            <input
              type="text"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Имя нового исполнителя"
              autoFocus
            />
            <button onClick={handleAdd}>Добавить</button>
          </div>
          <div className="assignee-list">
            <h3>Список исполнителей</h3>
            {assignees.length === 0 ? (
              <p>Нет исполнителей</p>
            ) : (
              <ul>
                {assignees.map(assignee => (
                  <li key={assignee}>
                    {assignee}
                    <button 
                      onClick={() => onRemove(assignee)} 
                      className="remove-assignee-btn"
                      title="Удалить исполнителя"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Рендер интерфейса
  if (!isAuthenticated) {
    return (
      <div className="app">
        <LoginForm 
          onLogin={handleLogin} 
          onAdminLogin={() => handleLogin({ firstName: "Admin", lastName: "" }, true)} 
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        stats={stats}
      />

      <div className="main-content">
        {adminMode && (
          <AssigneeManagement
          assignees={assignees}
          onAdd={addAssignee}
          onRemove={removeAssignee}
          />
        )}

        <div className="filters">
          <div className="date-filter">
            <label>Фильтр по дате:</label>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
            />
            <button onClick={() => setDateFilter("")}>Сбросить</button>
          </div>
          <label className="hide-completed">
            <input 
              type="checkbox" 
              checked={hideCompleted} 
              onChange={(e) => setHideCompleted(e.target.checked)} 
            />
            Скрыть выполненные
          </label>
        </div>

        <TaskTable
          tasks={filteredTasks}
          assignees={assignees}
          adminMode={adminMode}
          onStatusChange={handleStatusChange}
          onDelete={deleteTask}
          formatDateTime={formatDateTime}
          onAssigneeChange={async (taskId, assignee) => {
            await updateTask(taskId, { assignee: assignee || null });
          }}
        />

        <button 
          className="add-task-button bottom-button"
          onClick={() => setShowTaskModal(true)}
        >
          ➕ Новая заявка
        </button>
      </div>

      {showTaskModal && (
        <TaskModal
          show={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          formData={newTaskForm}
          onFormChange={(e) => setNewTaskForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
          }))}
          assignees={assignees}
          onSubmit={addTaskFromModal}
        />
      )}

      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
      />

      <TimeInputModal
        show={timeModal.show}
        onClose={() => setTimeModal(prev => ({ ...prev, show: false }))}
        hours={timeModal.hours}
        minutes={timeModal.minutes}
        error={timeModal.error}
        onHoursChange={(value) => setTimeModal(prev => ({ 
          ...prev, 
          hours: Math.max(0, parseInt(value) || 0),
          error: ""
        }))}
        onMinutesChange={(value) => setTimeModal(prev => ({ 
          ...prev, 
          minutes: Math.max(0, Math.min(59, parseInt(value) || 0)),
          error: ""
        }))}
        onSave={saveTimeSpent}
      />
    </div>
  );
}