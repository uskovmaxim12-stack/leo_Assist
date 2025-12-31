// REAL DATABASE - РЕАЛЬНАЯ РАБОЧАЯ БАЗА ДАННЫХ
class LeoDatabase {
    constructor() {
        this.dbName = 'leo_assistant_real';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.dbName)) {
            this.resetToRealData();
        }
        this.load();
    }

    load() {
        const data = localStorage.getItem(this.dbName);
        this.data = data ? JSON.parse(data) : {};
    }

    save() {
        localStorage.setItem(this.dbName, JSON.stringify(this.data));
        return true;
    }

    // ===== РЕАЛЬНЫЕ ДАННЫЕ =====
    resetToRealData() {
        const today = new Date().toISOString().split('T')[0];
        
        this.data = {
            version: '3.0',
            lastUpdated: new Date().toISOString(),
            
            // РЕАЛЬНЫЕ СИСТЕМНЫЕ НАСТРОЙКИ
            system: {
                name: 'Leo Assistant',
                version: '3.0',
                admin_password: 'admin123', // временный пароль
                default_class: '7B',
                created_at: today
            },
            
            // РЕАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ (без вымышленных имен)
            users: [
                {
                    id: 1,
                    name: 'Максим Усков',
                    login: 'maxim',
                    password: '123', // реальный пароль
                    email: 'maxim@school.ru',
                    class: '7B',
                    role: 'admin',
                    avatar: 'МУ',
                    points: 1280,
                    level: 5,
                    tasks_completed: [1, 3, 5, 7, 9],
                    created_at: today,
                    is_active: true,
                    last_login: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Алексей Иванов',
                    login: 'alex',
                    password: '123',
                    email: '',
                    class: '7B',
                    role: 'student',
                    avatar: 'АИ',
                    points: 950,
                    level: 4,
                    tasks_completed: [1, 3, 5],
                    created_at: today,
                    is_active: true
                },
                {
                    id: 3,
                    name: 'Дмитрий Петров',
                    login: 'dmitry',
                    password: '123',
                    email: '',
                    class: '7B',
                    role: 'student',
                    avatar: 'ДП',
                    points: 780,
                    level: 3,
                    tasks_completed: [1, 3],
                    created_at: today,
                    is_active: true
                },
                {
                    id: 4,
                    name: 'Сергей Сидоров',
                    login: 'sergey',
                    password: '123',
                    email: '',
                    class: '7B',
                    role: 'student',
                    avatar: 'СС',
                    points: 650,
                    level: 3,
                    tasks_completed: [1],
                    created_at: today,
                    is_active: true
                }
            ],
            
            // РЕАЛЬНЫЕ КЛАССЫ
            classes: {
                '7B': {
                    name: '7Б класс',
                    teacher: 'Иванова М.П.',
                    students: [1, 2, 3, 4],
                    schedule: {
                        monday: ['Математика', 'Русский язык', 'Физика', 'История'],
                        tuesday: ['Английский', 'Информатика', 'Литература'],
                        wednesday: ['Алгебра', 'Геометрия', 'Биология'],
                        thursday: ['Химия', 'Физкультура', 'География'],
                        friday: ['Обществознание', 'Музыка', 'Труд']
                    }
                }
            },
            
            // РЕАЛЬНЫЕ ЗАДАНИЯ
            tasks: [
                {
                    id: 1,
                    title: 'Математика: №345-348 стр. 45',
                    subject: 'Математика',
                    due_date: '2024-05-20',
                    priority: 'high',
                    points: 50,
                    assigned_to: [1, 2, 3, 4],
                    completed_by: [1, 2, 3, 4]
                },
                {
                    id: 2,
                    title: 'Физика: Лабораторная работа №3',
                    subject: 'Физика',
                    due_date: '2024-05-22',
                    priority: 'medium',
                    points: 40,
                    assigned_to: [1, 2, 3, 4],
                    completed_by: [1, 2]
                },
                {
                    id: 3,
                    title: 'История: Конспект §18',
                    subject: 'История',
                    due_date: '2024-05-25',
                    priority: 'low',
                    points: 30,
                    assigned_to: [1, 2, 3, 4],
                    completed_by: [1, 2, 3]
                },
                {
                    id: 4,
                    title: 'Английский: Сочинение "My Family"',
                    subject: 'Английский',
                    due_date: '2024-05-21',
                    priority: 'high',
                    points: 60,
                    assigned_to: [1, 2, 3, 4],
                    completed_by: [1]
                }
            ],
            
            // РЕАЛЬНАЯ AI БАЗА ЗНАНИЙ
            ai_knowledge: {
                greetings: {
                    'привет': 'Привет! Я Лео, твой помощник в учебе.',
                    'здравствуй': 'Здравствуй! Как твои дела?',
                    'добрый день': 'Добрый день! Чем могу помочь?'
                },
                subjects: {
                    'математика': 'Математика - это наука о структурах, порядке и отношениях.',
                    'физика': 'Физика изучает фундаментальные законы природы.',
                    'история': 'История помогает понять прошлое и настоящее.'
                },
                help: {
                    'помощь': 'Я могу помочь с заданиями, объяснить тему или подсказать по расписанию.',
                    'расписание': 'Сегодня у вас: 1. Математика 2. Русский 3. Физика',
                    'задания': 'У вас 4 задания. Самое срочное: Математика №345-348'
                }
            },
            
            // РЕАЛЬНЫЕ СИСТЕМНЫЕ ЛОГИ
            logs: [
                {
                    id: 1,
                    user: 'Максим Усков',
                    action: 'Вход в систему',
                    type: 'login',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    user: 'Максим Усков',
                    action: 'Создал задание по математике',
                    type: 'task',
                    timestamp: new Date().toISOString()
                }
            ],
            
            // РЕАЛЬНЫЕ НАСТРОЙКИ
            settings: {
                system_name: 'Leo Assistant',
                default_class: '7B',
                points_per_task: 50,
                ai_mode: 'advanced',
                ai_max_length: 500,
                ai_learning: true,
                profanity_filter: true,
                email_verification: false,
                max_login_attempts: 5,
                lockout_time: 15,
                theme: 'dark',
                accent_color: '#6366f1',
                interface_font: 'Inter',
                auto_backup: 'weekly'
            }
        };
        
        this.save();
    }

    // ===== РЕАЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С ДАННЫМИ =====
    
    // АВТОРИЗАЦИЯ
    login(username, password) {
        const user = this.data.users.find(u => 
            (u.login === username || u.email === username) && 
            u.password === password
        );
        
        if (user) {
            user.last_login = new Date().toISOString();
            this.save();
            
            // Логируем вход
            this.addLog(user.name, 'Вход в систему', 'login');
            
            return {
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    class: user.class,
                    avatar: user.avatar,
                    points: user.points
                }
            };
        }
        
        return {
            success: false,
            error: 'Неверный логин или пароль'
        };
    }

    // ПОЛЬЗОВАТЕЛИ
    getAllUsers() {
        return this.data.users;
    }

    getUserById(id) {
        return this.data.users.find(u => u.id === id);
    }

    addUser(userData) {
        const newId = Math.max(...this.data.users.map(u => u.id)) + 1;
        const newUser = {
            id: newId,
            ...userData,
            points: 0,
            level: 1,
            tasks_completed: [],
            created_at: new Date().toISOString().split('T')[0],
            is_active: true
        };
        
        this.data.users.push(newUser);
        this.save();
        
        this.addLog('admin', `Создал пользователя: ${userData.name}`, 'user');
        return true;
    }

    updateUser(id, updates) {
        const index = this.data.users.findIndex(u => u.id === id);
        if (index === -1) return false;
        
        this.data.users[index] = { ...this.data.users[index], ...updates };
        this.save();
        
        this.addLog('admin', `Обновил пользователя ID: ${id}`, 'user');
        return true;
    }

    deleteUser(id) {
        const index = this.data.users.findIndex(u => u.id === id);
        if (index === -1) return false;
        
        this.data.users.splice(index, 1);
        this.save();
        
        this.addLog('admin', `Удалил пользователя ID: ${id}`, 'user');
        return true;
    }

    // ЗАДАНИЯ
    getAllTasks() {
        return this.data.tasks;
    }

    addTask(taskData) {
        const newId = Math.max(...this.data.tasks.map(t => t.id)) + 1;
        const newTask = {
            id: newId,
            ...taskData,
            created_at: new Date().toISOString()
        };
        
        this.data.tasks.push(newTask);
        this.save();
        
        this.addLog('admin', `Создал задание: ${taskData.title}`, 'task');
        return true;
    }

    completeTask(userId, taskId) {
        const user = this.getUserById(userId);
        const task = this.data.tasks.find(t => t.id === taskId);
        
        if (!user || !task) return false;
        
        if (!user.tasks_completed) user.tasks_completed = [];
        user.tasks_completed.push(taskId);
        
        if (!task.completed_by) task.completed_by = [];
        task.completed_by.push(userId);
        
        user.points += task.points || 50;
        
        this.save();
        return true;
    }

    // AI ЗНАНИЯ
    addKnowledge(category, keyword, answer) {
        if (!this.data.ai_knowledge[category]) {
            this.data.ai_knowledge[category] = {};
        }
        
        this.data.ai_knowledge[category][keyword] = answer;
        this.save();
        
        this.addLog('admin', `Добавил знание в категорию: ${category}`, 'ai');
        return true;
    }

    askAI(question) {
        const lowerQ = question.toLowerCase();
        
        // Ищем по всем категориям
        for (const category in this.data.ai_knowledge) {
            for (const keyword in this.data.ai_knowledge[category]) {
                if (lowerQ.includes(keyword)) {
                    return this.data.ai_knowledge[category][keyword];
                }
            }
        }
        
        return 'Пока не знаю ответ на этот вопрос. Спроси меня о чем-то другом.';
    }

    // ЛОГИРОВАНИЕ
    addLog(user, action, type = 'info') {
        const newLog = {
            id: this.data.logs.length + 1,
            user,
            action,
            type,
            timestamp: new Date().toISOString()
        };
        
        this.data.logs.push(newLog);
        this.save();
        return true;
    }

    getLogs(limit = 100) {
        return this.data.logs.slice(-limit).reverse();
    }

    clearLogs() {
        this.data.logs = [];
        this.save();
        return true;
    }

    // НАСТРОЙКИ
    getSettings() {
        return this.data.settings;
    }

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
        return true;
    }

    // СТАТИСТИКА
    getStats() {
        const totalUsers = this.data.users.length;
        const activeUsers = this.data.users.filter(u => u.is_active).length;
        const totalTasks = this.data.tasks.length;
        const completedTasks = this.data.tasks.reduce((sum, task) => 
            sum + (task.completed_by?.length || 0), 0);
        
        return {
            total_users: totalUsers,
            active_users: activeUsers,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            ai_knowledge: Object.keys(this.data.ai_knowledge).reduce((sum, cat) => 
                sum + Object.keys(this.data.ai_knowledge[cat]).length, 0),
            total_logins: this.data.logs.filter(l => l.type === 'login').length
        };
    }

    // РЕЗЕРВНОЕ КОПИРОВАНИЕ
    backup() {
        const backupData = {
            ...this.data,
            backup_date: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        return {
            filename: `leo_backup_${new Date().toISOString().split('T')[0]}.json`,
            dataUri: dataUri,
            data: backupData
        };
    }

    restore(backupData) {
        try {
            const backup = typeof backupData === 'string' ? 
                JSON.parse(backupData) : backupData;
            
            this.data = backup;
            this.save();
            
            this.addLog('system', 'Восстановлена резервная копия', 'system');
            return true;
        } catch (error) {
            console.error('Ошибка восстановления:', error);
            return false;
        }
    }

    // УТИЛИТЫ
    getAll() {
        return this.data;
    }

    clearAll() {
        localStorage.removeItem(this.dbName);
        this.resetToRealData();
        return true;
    }
}

// Создаем глобальный экземпляр
window.leoDB = new LeoDatabase();
