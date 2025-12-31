// js/database.js - РАБОЧАЯ БАЗА ДАННЫХ БЕЗ ДЕМО-ДАННЫХ
class Database {
    constructor() {
        this.dbName = 'leo_assistant_real_db';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.dbName)) {
            const initialData = {
                version: "3.0",
                users: [], // ПОЛНОСТЬЮ ПУСТОЙ СПИСОК
                classes: {
                    "7B": {
                        schedule: [],
                        tasks: [],
                        students: []
                    }
                },
                ai_knowledge: {
                    greetings: [
                        "Привет! Я Лео, ваш AI-помощник. Готов помочь с учебой!",
                        "Здравствуйте! Чем могу быть полезен сегодня?"
                    ],
                    subjects: {},
                    help: "Я могу помочь с заданиями, объяснить тему или показать расписание."
                },
                notifications: [], // РЕАЛЬНЫЕ УВЕДОМЛЕНИЯ
                achievements: [],
                system: {
                    admin_password: "admin123",
                    total_logins: 0,
                    last_backup: null
                }
            };
            this.save(initialData);
        }
        console.log('📊 Реальная база данных инициализирована');
    }

    // ===== РАБОТА С ПОЛЬЗОВАТЕЛЯМИ =====
    addUser(userData) {
        const db = this.getAll();
        if (!db) return { success: false, error: "База данных не найдена" };

        // Проверяем существование логина
        const existingUser = db.users.find(u => u.login.toLowerCase() === userData.login.toLowerCase());
        if (existingUser) {
            return { success: false, error: "Этот логин уже занят" };
        }

        const newUser = {
            id: Date.now(),
            login: userData.login,
            password: userData.password,
            name: userData.name,
            avatar: this.generateAvatar(userData.name),
            class: userData.class || "7B",
            role: "student",
            points: 0,
            level: 1,
            experience: 0,
            completed_tasks: [],
            created_at: new Date().toISOString(),
            last_login: null,
            settings: {
                theme: "dark",
                notifications: true,
                voice_enabled: true
            },
            stats: {
                total_tasks_completed: 0,
                consecutive_days: 0,
                last_active: null
            }
        };

        db.users.push(newUser);
        
        // Добавляем в список класса
        if (!db.classes["7B"].students) {
            db.classes["7B"].students = [];
        }
        
        db.classes["7B"].students.push({
            id: newUser.id,
            name: newUser.name,
            points: 0,
            level: 1,
            avatar: newUser.avatar
        });

        this.save(db);
        
        // Создаем приветственное уведомление
        this.addNotification({
            user_id: newUser.id,
            type: "welcome",
            title: "Добро пожаловать в Leo Assistant!",
            message: `Рады видеть вас, ${newUser.name}! Начните с настройки профиля.`,
            icon: "👋",
            read: false
        });

        return { success: true, user: newUser };
    }

    authUser(login, password) {
        const db = this.getAll();
        if (!db || !db.users) return null;

        const user = db.users.find(u => 
            u.login === login && u.password === password
        );

        if (user) {
            // Обновляем статистику
            user.last_login = new Date().toISOString();
            user.stats.last_active = new Date().toISOString();
            db.system.total_logins++;
            
            this.save(db);
            
            // Убираем пароль из ответа
            const { password: _, ...safeUser } = user;
            return safeUser;
        }

        return null;
    }

    // ===== РЕЙТИНГ =====
    getClassRating(classId = "7B") {
        const db = this.getAll();
        if (!db || !db.classes[classId] || !db.classes[classId].students) {
            return [];
        }

        return db.classes[classId].students
            .sort((a, b) => b.points - a.points)
            .map((student, index) => ({
                rank: index + 1,
                ...student
            }));
    }

    updateUserPoints(userId, points) {
        const db = this.getAll();
        if (!db) return false;

        const user = db.users.find(u => u.id === userId);
        if (!user) return false;

        user.points += points;
        user.stats.total_tasks_completed += 1;
        
        // Обновляем в классе
        const student = db.classes["7B"]?.students?.find(s => s.id === userId);
        if (student) {
            student.points = user.points;
        }

        this.save(db);
        return true;
    }

    // ===== УВЕДОМЛЕНИЯ =====
    addNotification(notification) {
        const db = this.getAll();
        if (!db) return false;

        const newNotification = {
            id: Date.now(),
            ...notification,
            created_at: new Date().toISOString(),
            read: false
        };

        if (!db.notifications) {
            db.notifications = [];
        }

        db.notifications.push(newNotification);
        this.save(db);
        return newNotification.id;
    }

    getUserNotifications(userId) {
        const db = this.getAll();
        if (!db || !db.notifications) return [];

        return db.notifications
            .filter(n => n.user_id === userId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    markNotificationAsRead(notificationId) {
        const db = this.getAll();
        if (!db || !db.notifications) return false;

        const notification = db.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.save(db);
            return true;
        }

        return false;
    }

    getUnreadNotificationsCount(userId) {
        const notifications = this.getUserNotifications(userId);
        return notifications.filter(n => !n.read).length;
    }

    // ===== ЗАДАНИЯ =====
    addTask(taskData) {
        const db = this.getAll();
        if (!db) return false;

        const newTask = {
            id: Date.now(),
            ...taskData,
            created_at: new Date().toISOString(),
            completed_by: []
        };

        if (!db.classes["7B"].tasks) {
            db.classes["7B"].tasks = [];
        }

        db.classes["7B"].tasks.push(newTask);
        this.save(db);

        // Уведомление для всех пользователей о новом задании
        if (db.users && db.users.length > 0) {
            db.users.forEach(user => {
                if (user.role === 'student') {
                    this.addNotification({
                        user_id: user.id,
                        type: "task",
                        title: "Новое задание",
                        message: `Добавлено задание по предмету: ${taskData.subject}`,
                        icon: "📝",
                        data: { task_id: newTask.id }
                    });
                }
            });
        }

        return true;
    }

    getUserTasks(userId) {
        const db = this.getAll();
        if (!db || !db.classes["7B"] || !db.classes["7B"].tasks) return [];

        const user = db.users.find(u => u.id === userId);
        if (!user) return [];

        return db.classes["7B"].tasks.map(task => ({
            ...task,
            completed: user.completed_tasks?.includes(task.id) || false
        }));
    }

    completeTask(userId, taskId) {
        const db = this.getAll();
        if (!db) return { success: false };

        const user = db.users.find(u => u.id === userId);
        const task = db.classes["7B"]?.tasks?.find(t => t.id === taskId);

        if (!user || !task) {
            return { success: false, error: "Задание или пользователь не найдены" };
        }

        if (user.completed_tasks?.includes(taskId)) {
            return { success: false, error: "Задание уже выполнено" };
        }

        // Отмечаем задание выполненным
        if (!user.completed_tasks) user.completed_tasks = [];
        user.completed_tasks.push(taskId);

        // Добавляем в список выполнивших
        if (!task.completed_by) task.completed_by = [];
        task.completed_by.push(userId);

        // Начисляем очки
        const pointsEarned = 50;
        user.points += pointsEarned;
        user.stats.total_tasks_completed += 1;

        // Проверяем повышение уровня
        const experienceNeeded = user.level * 100;
        user.experience += 100;
        
        if (user.experience >= experienceNeeded) {
            user.level += 1;
            user.experience = 0;
            
            // Уведомление о повышении уровня
            this.addNotification({
                user_id: userId,
                type: "level_up",
                title: "Поздравляем!",
                message: `Вы достигли ${user.level} уровня!`,
                icon: "⭐",
                data: { new_level: user.level }
            });
        }

        // Обновляем в рейтинге класса
        const student = db.classes["7B"]?.students?.find(s => s.id === userId);
        if (student) {
            student.points = user.points;
            student.level = user.level;
        }

        this.save(db);

        // Уведомление о выполнении задания
        this.addNotification({
            user_id: userId,
            type: "task_completed",
            title: "Задание выполнено!",
            message: `Вы получили ${pointsEarned} очков за задание "${task.title}"`,
            icon: "✅",
            data: { task_id: taskId, points: pointsEarned }
        });

        return { 
            success: true, 
            points: pointsEarned, 
            level_up: user.level > 1,
            new_level: user.level
        };
    }

    // ===== РАСПИСАНИЕ =====
    updateSchedule(scheduleData) {
        const db = this.getAll();
        if (!db) return false;

        if (!db.classes["7B"]) {
            db.classes["7B"] = {};
        }

        db.classes["7B"].schedule = scheduleData;
        this.save(db);
        return true;
    }

    getSchedule() {
        const db = this.getAll();
        return db?.classes?.["7B"]?.schedule || [];
    }

    getTodaySchedule() {
        const schedule = this.getSchedule();
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1; // Воскресенье = 6
        
        return schedule[dayIndex] || { day: "Сегодня", lessons: [] };
    }

    // ===== ПОМОЩНИКИ =====
    generateAvatar(name) {
        const names = name.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    save(data) {
        try {
            localStorage.setItem(this.dbName, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            return false;
        }
    }

    getAll() {
        try {
            const data = localStorage.getItem(this.dbName);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            return null;
        }
    }

    // ===== АДМИНИСТРАТОР =====
    getAdminStats() {
        const db = this.getAll();
        if (!db) return null;

        return {
            total_users: db.users.length,
            active_users: db.users.filter(u => u.last_login).length,
            total_tasks: db.classes["7B"]?.tasks?.length || 0,
            total_notifications: db.notifications?.length || 0,
            system_logins: db.system.total_logins || 0
        };
    }

    // ===== СБРОС =====
    clearAllData() {
        try {
            localStorage.removeItem(this.dbName);
            this.init();
            return true;
        } catch (error) {
            console.error('Ошибка очистки:', error);
            return false;
        }
    }
}

// Глобальный экземпляр базы данных
const leoDB = new Database();
