
import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Инициализация файла данных
const initializeData = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // Файл не существует, создаем с начальными данными
    const initialData = {
      tasks: [],
      assignees: ['Алексей', 'Мария', 'Дмитрий', 'Анна'],
      users: []
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
};

// Функция для чтения данных
const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка чтения данных:', error);
    return { tasks: [], assignees: [], users: [] };
  }
};

// Функция для записи данных
const writeData = async (data) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Ошибка записи данных:', error);
  }
};

// API маршруты

// Получить все данные
app.get('/api/data', async (req, res) => {
  const data = await readData();
  res.json(data);
});

// Получить все задачи
app.get('/api/tasks', async (req, res) => {
  const data = await readData();
  res.json(data.tasks);
});

// Добавить новую задачу
app.post('/api/tasks', async (req, res) => {
  const data = await readData();
  const newTask = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toLocaleString()
  };
  data.tasks.push(newTask);
  await writeData(data);
  res.json(newTask);
});

// Обновить задачу
app.put('/api/tasks/:id', async (req, res) => {
  const data = await readData();
  const taskId = parseInt(req.params.id);
  const taskIndex = data.tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    data.tasks[taskIndex] = { ...data.tasks[taskIndex], ...req.body };
    await writeData(data);
    res.json(data.tasks[taskIndex]);
  } else {
    res.status(404).json({ error: 'Задача не найдена' });
  }
});

// Удалить задачу
app.delete('/api/tasks/:id', async (req, res) => {
  const data = await readData();
  const taskId = parseInt(req.params.id);
  data.tasks = data.tasks.filter(task => task.id !== taskId);
  await writeData(data);
  res.json({ message: 'Задача удалена' });
});

// Получить всех исполнителей
app.get('/api/assignees', async (req, res) => {
  const data = await readData();
  res.json(data.assignees);
});

// Добавить исполнителя
app.post('/api/assignees', async (req, res) => {
  const data = await readData();
  const { name } = req.body;
  
  if (!data.assignees.includes(name)) {
    data.assignees.push(name);
    await writeData(data);
    res.json({ message: 'Исполнитель добавлен', assignees: data.assignees });
  } else {
    res.status(400).json({ error: 'Такой исполнитель уже существует' });
  }
});

// Удалить исполнителя
app.delete('/api/assignees/:name', async (req, res) => {
  const data = await readData();
  const assigneeName = req.params.name;
  
  data.assignees = data.assignees.filter(a => a !== assigneeName);
  // Переназначить задачи удаленного исполнителя на "Общие дела"
  data.tasks = data.tasks.map(task => 
    task.assignee === assigneeName 
      ? { ...task, assignee: 'Общие дела' }
      : task
  );
  
  await writeData(data);
  res.json({ message: 'Исполнитель удален', assignees: data.assignees });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
const startServer = async () => {
  try {
    await initializeData();
    console.log('Данные инициализированы');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на http://0.0.0.0:${PORT}`);
      console.log(`📊 API доступен на http://0.0.0.0:${PORT}/api`);
    });

    server.on('error', (err) => {
      console.error('Ошибка запуска сервера:', err);
    });

  } catch (error) {
    console.error('Критическая ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

startServer();
