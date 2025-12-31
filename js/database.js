// REAL DATABASE - ТОЛЬКО РЕАЛЬНЫЕ ДАННЫЕ
class LeoDatabase {
    constructor() {
        this.dbName = 'leo_assistant_db';
        this.currentUserId = null;
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.dbName)) {
            this.resetToEmpty();
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

    resetToEmpty() {
        this.data = {
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            
            // СИСТЕМА
            system: {
                name: 'Leo Assistant',
                admin_password: 'admin',
                created_at: new Date().toISOString().split('T')[0]
            },
            
            // ТОЛЬКО РЕАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ (в начале только админ)
            users: [
                {
                    id: 1,
                    name: 'Администратор',
                    login: 'admin',
                    password: 'admin',
                    role: 'admin',
                    created_at: new Date().toISOString().split('T')[0],
                    last_login: null,
                    is_active: true
                }
            ],
            
            // ЗАДАНИЯ (пусто - будет заполняться через админку)
            tasks: [],
            
            // AI БАЗА ЗНАНИЙ (только базовые)
            ai_knowledge: {
                greetings: {
                    'привет': 'Привет! Я Лео. Чем могу помочь?',
                    'здравствуй': 'Здравствуй!',
                    'добрый день': 'Добрый день!'
                },
                help: {
                    'помощь': 'Я могу помочь с учебой. Задай вопрос.',
                    'что ты умеешь': 'Я помогаю с учебой, отвечаю на вопросы.'
                }
            },
            
            // СИСТЕМНЫЕ ЛОГИ
            logs: [],
            
            // НАСТРОЙКИ
            settings: {
                system_name: 'Leo Assistant',
                theme: 'dark',
                accent_color: '#4f46e5'
            }
        };
        
        this.save();
    }

    // ===== РЕАЛЬНАЯ АВТОРИЗАЦИЯ =====
    login(username, password) {
        const user = this.data.users.find(u => 
            u.login === username && u.password === password
        );
        
        if (user) {
            user.last_login = new Date().toISOString();
            this.currentUserId = user.id;
            this.save();
            
            this.addLog(user.id, `Вход в систему`, 'login');
            return { success: true, user };
        }
        
        return { success: false, error: 'Неверный логин или пароль' };
    }

    logout() {
        this.currentUserId = null;
        return true;
    }

    // ===== РЕАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ =====
    getCurrentUser() {
        if (!this.currentUserId) return null;
        return this.data.users.find(u => u.id === this.currentUserId);
    }

    getAllUsers() {
        return this.data.users;
    }

    addUser(userData) {
        // Генерируем ID
        const newId = this.data.users.length > 0 ? 
            Math.max(...this.data.users.map(u => u.id)) + 1 : 1;
        
        const newUser = {
            id: newId,
            ...userData,
            points: 0,
            level: 1,
            tasks_completed: [],
            created_at: new Date().toISOString().split('T')[0],
            last_login: null,
            is_active: true
        };
        
        this.data.users.push(newUser);
        this.save();
        
        this.addLog(this.currentUserId, `Добавил пользователя: ${userData.name}`, 'user');
        return { success: true, user: newUser };
    }

    updateUser(id, updates) {
        const index = this.data.users.findIndex(u => u.id === id);
        if (index === -1) return { success: false, error: 'Пользователь не найден' };
        
        this.data.users[index] = { ...this.data.users[index], ...updates };
        this.save();
        
        this.addLog(this.currentUserId, `Обновил пользователя ID: ${id}`, 'user');
        return { success: true };
    }

    deleteUser(id) {
        // Нельзя удалить себя (админа)
        if (id === this.currentUserId) {
            return { success: false, error: 'Нельзя удалить себя' };
        }
        
        const index = this.data.users.findIndex(u => u.id === id);
        if (index === -1) return { success: false, error: 'Пользователь не найден' };
        
        this.data.users.splice(index, 1);
        this.save();
        
        this.addLog(this.currentUserId, `Удалил пользователя ID: ${id}`, 'user');
        return { success: true };
    }

    // ===== РЕАЛЬНЫЕ ЗАДАНИЯ =====
    getAllTasks() {
        return this.data.tasks;
    }

    addTask(taskData) {
        const newId = this.data.tasks.length > 0 ? 
            Math.max(...this.data.tasks.map(t => t.id)) + 1 : 1;
        
        const newTask = {
            id: newId,
            ...taskData,
            created_by: this.currentUserId,
            created_at: new Date().toISOString(),
            completed_by: [],
            is_active: true
        };
        
        this.data.tasks.push(newTask);
        this.save();
        
        this.addLog(this.currentUserId, `Добавил задание: ${taskData.title}`, 'task');
        return { success: true, task: newTask };
    }

    updateTask(id, updates) {
        const index = this.data.tasks.findIndex(t => t.id === id);
        if (index === -1) return { success: false, error: 'Задание не найдено' };
        
        this.data.tasks[index] = { ...this.data.tasks[index], ...updates };
        this.save();
        
        this.addLog(this.currentUserId, `Обновил задание ID: ${id}`, 'task');
        return { success: true };
    }

    deleteTask(id) {
        const index = this.data.tasks.findIndex(t => t.id === id);
        if (index === -1) return { success: false, error: 'Задание не найдено' };
        
        this.data.tasks.splice(index, 1);
        this.save();
        
        this.addLog(this.currentUserId, `Удалил задание ID: ${id}`, 'task');
        return { success: true };
    }

    completeTask(userId, taskId) {
        const user = this.data.users.find(u => u.id === userId);
        const task = this.data.tasks.find(t => t.id === taskId);
        
        if (!user || !task) return { success: false, error: 'Не найдено' };
        
        // Добавляем в выполненные
        if (!user.tasks_completed) user.tasks_completed = [];
        if (!user.tasks_completed.includes(taskId)) {
            user.tasks_completed.push(taskId);
        }
        
        // Добавляем в список выполнивших
        if (!task.completed_by.includes(userId)) {
            task.completed_by.push(userId);
        }
        
        // Начисляем очки
        user.points = (user.points || 0) + 50;
        
        this.save();
        this.addLog(userId, `Выполнил задание: ${task.title}`, 'task');
        return { success: true, points: user.points };
    }

    // ===== РЕАЛЬНЫЙ AI =====
    askAI(question) {
        const lowerQ = question.toLowerCase().trim();
        
        // Ищем точное совпадение в знаниях
        for (const category in this.data.ai_knowledge) {
            for (const keyword in this.data.ai_knowledge[category]) {
                if (lowerQ.includes(keyword.toLowerCase())) {
                    return this.data.ai_knowledge[category][keyword];
                }
            }
        }
        
        // Если не нашли - стандартный ответ
        return 'Пока не знаю ответ на этот вопрос. Попробуй спросить иначе.';
    }

    addKnowledge(category, keyword, answer) {
        if (!this.data.ai_knowledge[category]) {
            this.data.ai_knowledge[category] = {};
        }
        
        this.data.ai_knowledge[category][keyword] = answer;
        this.save();
        
        this.addLog(this.currentUserId, `Добавил знание в категорию ${category}`, 'ai');
        return { success: true };
    }

    // ===== РЕАЛЬНЫЕ ЛОГИ =====
    addLog(userId, action, type = 'info') {
        const user = this.data.users.find(u => u.id === userId);
        const userName = user ? user.name : 'System';
        
        const newLog = {
            id: this.data.logs.length + 1,
            user_id: userId,
            user_name: userName,
            action: action,
            type: type,
            timestamp: new Date().toISOString()
        };
        
        this.data.logs.push(newLog);
        this.save();
        return true;
    }

    getLogs(limit = 50) {
        return this.data.logs.slice(-limit).reverse();
    }

    clearLogs() {
        this.data.logs = [];
        this.save();
        this.addLog(this.currentUserId, 'Очистил логи системы', 'system');
        return { success: true };
    }

    // ===== РЕАЛЬНЫЕ НАСТРОЙКИ =====
    getSettings() {
        return this.data.settings;
    }

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
        
        this.addLog(this.currentUserId, 'Обновил системные настройки', 'settings');
        return { success: true };
    }

    // ===== РЕАЛЬНЫЕ СТАТИСТИКИ =====
    getStats() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        
        const todayLogins = this.data.logs.filter(log => 
            log.type === 'login' && log.timestamp.includes(today)
        ).length;
        
        return {
            total_users: this.data.users.length,
            active_users: this.data.users.filter(u => u.is_active).length,
            total_tasks: this.data.tasks.length,
            active_tasks: this.data.tasks.filter(t => t.is_active).length,
            total_logs: this.data.logs.length,
            today_logins: todayLogins,
            system_uptime: Math.floor((Date.now() - new Date(this.data.lastUpdated).getTime()) / (1000 * 60 * 60)) + 'ч'
        };
    }

    // ===== УТИЛИТЫ =====
    backup() {
        const backupData = {
            ...this.data,
            backup_date: new Date().toISOString(),
            backup_type: 'manual'
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        return {
            filename: `leo_backup_${new Date().toISOString().split('T')[0]}.json`,
            dataUri: dataUri
        };
    }

    restore(backupData) {
        try {
            const backup = typeof backupData === 'string' ? 
                JSON.parse(backupData) : backupData;
            
            // Сохраняем текущего пользователя
            const currentUserBackup = this.currentUserId;
            
            // Восстанавливаем данные
            this.data = backup;
            this.currentUserId = currentUserBackup;
            this.data.lastUpdated = new Date().toISOString();
            
            this.save();
            this.addLog(this.currentUserId, 'Восстановил базу данных из резервной копии', 'system');
            return { success: true };
        } catch (error) {
            console.error('Ошибка восстановления:', error);
            return { success: false, error: 'Некорректный файл резервной копии' };
        }
    }

    resetAll() {
        this.resetToEmpty();
        this.currentUserId = null;
        return { success: true };
    }

    getAllData() {
        return this.data;
    }
}

// Создаем глобальный экземпляр
window.leoDB = new LeoDatabase();
