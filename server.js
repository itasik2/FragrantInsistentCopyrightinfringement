const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const excel = require('exceljs');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

// Инициализация данных
let data = {
  tasks: [],
  assignees: ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.'],
  users: [{
      id: 1,
      firstName: 'Admin',
      lastName: '',
      isAdmin: true,
      password: 'admin123'
    },
    {
      id: 2,
      firstName: 'Иван',
      lastName: 'Иванов',
      isAdmin: false,
      password: 'user123'
    }
  ]
};

// Загрузка данных из файла
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Middleware для проверки авторизации
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({
    error: 'Не авторизован'
  });

  const user = data.users.find(u => u.id === parseInt(token));
  if (!user) return res.status(401).json({
    error: 'Не авторизован'
  });

  req.user = user;
  next();
};

// API endpoints

// Авторизация
app.post('/api/login', (req, res) => {
  const {
    firstName,
    lastName,
    password
  } = req.body;
  const user = data.users.find(u =>
    u.firstName === firstName &&
    (u.lastName === lastName || !lastName) &&
    u.password === password
  );

  if (!user) return res.status(401).json({
    error: 'Неверные данные'
  });

  res.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin
    }
  });
});

// Получение данных
app.get('/api/data', authenticate, (req, res) => {
  res.json({
    tasks: data.tasks,
    assignees: data.assignees,
    currentUser: req.user
  });
});

// Работа с задачами
app.post('/api/tasks', authenticate, (req, res) => {
  const newTask = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    author: `${req.user.firstName} ${req.user.lastName}`.trim(),
    status: 'новая'
  };
  data.tasks.push(newTask);
  saveData();
  res.json(newTask);
});

app.put('/api/tasks/:id', authenticate, (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = data.tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) return res.status(404).json({
    error: 'Задача не найдена'
  });

  // Проверка прав (админ или автор)
  if (!req.user.isAdmin && data.tasks[taskIndex].author !== `${req.user.firstName} ${req.user.lastName}`.trim()) {
    return res.status(403).json({
      error: 'Нет прав на редактирование'
    });
  }

  const updatedTask = {
    ...data.tasks[taskIndex],
    ...req.body
  };
  data.tasks[taskIndex] = updatedTask;
  saveData();
  res.json(updatedTask);
});

app.delete('/api/tasks/:id', authenticate, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({
    error: 'Только для администратора'
  });

  const taskId = parseInt(req.params.id);
  data.tasks = data.tasks.filter(t => t.id !== taskId);
  saveData();
  res.json({
    success: true
  });
});

// Работа с исполнителями (только для админа)
app.post('/api/assignees', authenticate, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({
    error: 'Только для администратора'
  });

  const {
    name
  } = req.body;
  if (!name) return res.status(400).json({
    error: 'Имя обязательно'
  });

  if (data.assignees.includes(name)) {
    return res.status(400).json({
      error: 'Исполнитель уже существует'
    });
  }

  data.assignees.push(name);
  saveData();
  res.json({
    success: true
  });
});

app.delete('/api/assignees/:name', authenticate, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({
    error: 'Только для администратора'
  });

  const name = decodeURIComponent(req.params.name);
  data.assignees = data.assignees.filter(a => a !== name);

  // Сбрасываем исполнителя в задачах
  data.tasks = data.tasks.map(task => {
    if (task.assignee === name) {
      return {
        ...task,
        assignee: null
      };
    }
    return task;
  });

  saveData();
  res.json({
    success: true
  });
});

// Экспорт в Excel
app.get('/api/export', authenticate, async (req, res) => {
  try {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Заявки');

    // Заголовки
    worksheet.columns = [{
        header: 'ID',
        key: 'id',
        width: 10
      },
      {
        header: 'Дата создания',
        key: 'createdAt',
        width: 20
      },
      {
        header: 'Бригадир',
        key: 'foreman',
        width: 20
      },
      {
        header: 'Лаборатория',
        key: 'lab',
        width: 15
      },
      {
        header: 'Кабинет',
        key: 'roomNumber',
        width: 10
      },
      {
        header: 'Описание',
        key: 'description',
        width: 40
      },
      {
        header: 'Статус',
        key: 'status',
        width: 15
      },
      {
        header: 'Дата принятия',
        key: 'acceptedAt',
        width: 20
      },
      {
        header: 'Дата выполнения',
        key: 'completedAt',
        width: 20
      },
      {
        header: 'Время работы',
        key: 'timeSpent',
        width: 15
      },
      {
        header: 'Исполнитель',
        key: 'assignee',
        width: 20
      },
      {
        header: 'Приоритет',
        key: 'priority',
        width: 15
      },
      {
        header: 'Автор',
        key: 'author',
        width: 20
      }
    ];

    // Данные
    data.tasks.forEach(task => {
      worksheet.addRow({
        ...task,
        createdAt: task.createdAt ? new Date(task.createdAt).toLocaleString('ru-RU') : '',
        acceptedAt: task.acceptedAt ? new Date(task.acceptedAt).toLocaleString('ru-RU') : '',
        completedAt: task.completedAt ? new Date(task.completedAt).toLocaleString('ru-RU') : '',
        priority: task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'
      });
    });

    // Стили
    worksheet.getRow(1).eachCell(cell => {
      cell.font = {
        bold: true
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FFD3D3D3'
        }
      };
    });

    // Отправка файла
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=заявки.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Ошибка при экспорте:', error);
    res.status(500).json({
      error: 'Ошибка при экспорте'
    });
  }
});

// Сохранение данных
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});