// js/database.js - РЕАЛЬНАЯ БАЗА ДАННЫХ
class LeoDatabase {
    constructor() {
        this.dbName = 'leo_assistant_real_db';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.dbName)) {
            // ТОЛЬКО реальные начальные данные
            const initialData = {
                version: "3.0",
                lastUpdated: new Date().toISOString(),
                
                // === РЕАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ ===
                users: [],
                
                // === РЕАЛЬНЫЕ КЛАССЫ ===
                classes: {
                    "7B": {
                        name: "7Б класс",
                        students: [], // Будет заполняться реальными пользователями
                        schedule: this.getDefaultSchedule(),
                        tasks: [] // Будет заполняться реальными заданиями
                    }
                },
                
                // === РЕАЛЬНЫЕ AI ЗНАНИЯ (базовые) ===
                ai_knowledge: {
                    greetings: {
                        "привет": "Привет! Я Лео, ваш помощник в учебе.",
                        "здравствуй": "Здравствуйте! Чем могу помочь?",
                        "добрый день": "Добрый день! Готов помочь с учебой."
                    },
                    subjects: {
                        "математика": "Математика изучает числа, структуры и пространственные отношения.",
                        "физика": "Физика - наука о природе, изучающая материю, энергию и их взаимодействия.",
                        "история": "История помогает понять прошлое, чтобы осмыслить настоящее."
                    }
                },
                
                // === РЕАЛЬНЫЕ СИСТЕМНЫЕ ДАННЫЕ ===
                system: {
                    admin_password: "admin123",
                    total_logins: 0,
                    system_name: "Leo Assistant"
                },
                
                // === РЕАЛЬНЫЕ НАСТРОЙКИ ===
                settings: {
                    theme: "dark",
                    accent_color: "#6366f1",
                    default_class: "7B",
                    points_per_task: 50,
                    ai_mode: "advanced"
                },
                
                // === РЕАЛЬНЫЕ ЛОГИ ===
                logs: []
            };
            
            this.save(initialData);
            console.log("✅ Создана новая база данных с реальной структурой");
        }
    }

    getDefaultSchedule() {
        return [
            { day: "Понедельник", lessons: [
                { time: "9:00", subject: "Математика", room: "212" },
                { time: "10:00", subject: "Русский язык", room: "108" },
                { time: "11:00", subject: "Физика", room: "305" }
            ]},
            { day: "Вторник", lessons: [
                { time: "9:00", subject: "История", room: "111" },
                { time: "10:00", subject: "Английский", room: "203" },
                { time: "11:00", subject: "Информатика", room: "415" }
            ]}
        ];
    }

    // === РЕАЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С ДАННЫМИ ===

    // Сохранение данных
    save(data) {
        data.lastUpdated = new Date().toISOString();
        localStorage.setItem(this.dbName, JSON.stringify(data));
        return true;
    }

    // Получение всех данных
    getAll() {
        const data = localStorage.getItem(this.dbName);
        return data ? JSON.parse(data) : null;
    }

    // === РЕАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ ===

    // Регистрация реального пользователя
    registerUser(userData) {
        const db = this.getAll();
        if (!db) return { success: false, error: "База данных не найдена" };

        // Проверка, что пользователя еще нет
        const existingUser = db.users.find(u => u.login === userData.login);
        if (existingUser) {
            return { success: false, error: "Пользователь с таким логином уже существует" };
        }

        // Создание реального пользователя
        const newUser = {
            id: Date.now(),
            login: userData.login,
            password: userData.password, // В реальном приложении нужно хэшировать!
            name: userData.name,
            avatar: this.generateAvatar(userData.name),
            class: userData.class || "7B",
            role: userData.role || "student",
            points: parseInt(userData.points) || 0,
            level: 1,
            tasks_completed: [],
            created_at: new Date().toISOString(),
            last_login: null,
            is_active: true
        };

        db.users.push(newUser);

        // Добавляем в класс
        if (!db.classes[newUser.class]) {
            db.classes[newUser.class] = {
                name: `${newUser.class} класс`,
                students: [],
                tasks: [],
                schedule: this.getDefaultSchedule()
            };
        }

        db.classes[newUser.class].students.push({
            id: newUser.id,
            name: newUser.name,
            points: newUser.points,
            avatar: newUser.avatar
        });

        this.save(db);

        // Логируем действие
        this.addLog("system", `Зарегистрирован новый пользователь: ${newUser.name}`);

        return { success: true, user: newUser };
    }

    // Авторизация реального пользователя
    loginUser(login, password) {
        const db = this.getAll();
        if (!db) return null;

        const user = db.users.find(u => 
            u.login === login && u.password === password
        );

        if (user) {
            // Обновляем время последнего входа
            user.last_login = new Date().toISOString();
            user.is_active = true;
            db.system.total_logins++;
            
            this.save(db);
            
            // Логируем вход
            this.addLog(user.login, "Вход в систему", "login");
            
            // Убираем пароль из возвращаемых данных
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }

        return null;
    }

    // Обновление реального пользователя
    updateUser(userId, userData) {
        const db = this.getAll();
        if (!db) return false;

        const userIndex = db.users.findIndex(u => u.id === userId);
        if (userIndex === -1) return false;

        // Обновляем данные пользователя
        db.users[userIndex] = {
            ...db.users[userIndex],
            ...userData,
            avatar: userData.name ? this.generateAvatar(userData.name) : db.users[userIndex].avatar
        };

        // Обновляем в классе
        const classStudents = db.classes[db.users[userIndex].class]?.students;
        if (classStudents) {
            const studentIndex = classStudents.findIndex(s => s.id === userId);
            if (studentIndex !== -1) {
                classStudents[studentIndex] = {
                    ...classStudents[studentIndex],
                    name: db.users[userIndex].name,
                    points: db.users[userIndex].points,
                    avatar: db.users[userIndex].avatar
                };
            }
        }

        this.save(db);
        this.addLog("admin", `Обновлен пользователь: ${db.users[userIndex].name}`);
        return true;
    }

    // Удаление реального пользователя
    deleteUser(userId) {
        const db = this.getAll();
        if (!db) return false;

        const userIndex = db.users.findIndex(u => u.id === userId);
        if (userIndex === -1) return false;

        const userName = db.users[userIndex].name;
        const userClass = db.users[userIndex].class;

        // Удаляем пользователя
        db.users.splice(userIndex, 1);

        // Удаляем из класса
        if (db.classes[userClass]?.students) {
            db.classes[userClass].students = 
                db.classes[userClass].students.filter(s => s.id !== userId);
        }

        this.save(db);
        this.addLog("admin", `Удален пользователь: ${userName}`);
        return true;
    }

    // === РЕАЛЬНЫЕ ЗАДАНИЯ ===

    // Добавление реального задания
    addTask(taskData) {
        const db = this.getAll();
        if (!db) return false;

        const newTask = {
            id: Date.now(),
            subject: taskData.subject,
            title: taskData.title,
            description: taskData.description || "",
            priority: taskData.priority || "medium",
            due_date: taskData.due_date || null,
            created_at: new Date().toISOString(),
            completed_by: [],
            is_active: true
        };

        if (!db.classes[taskData.class]) {
            db.classes[taskData.class] = {
                name: `${taskData.class} класс`,
                students: [],
                tasks: [],
                schedule: this.getDefaultSchedule()
            };
        }

        if (!db.classes[taskData.class].tasks) {
            db.classes[taskData.class].tasks = [];
        }

        db.classes[taskData.class].tasks.push(newTask);
        
        this.save(db);
        this.addLog("admin", `Добавлено задание: ${taskData.title}`);
        return true;
    }

    // Отметка задания как выполненного
    completeTask(userId, taskId) {
        const db = this.getAll();
        if (!db) return false;

        // Находим пользователя
        const user = db.users.find(u => u.id === userId);
        if (!user) return false;

        // Находим задание во всех классах
        let task = null;
        let classKey = null;

        for (const [className, classData] of Object.entries(db.classes)) {
            const foundTask = classData.tasks?.find(t => t.id === taskId);
            if (foundTask) {
                task = foundTask;
                classKey = className;
                break;
            }
        }

        if (!task) return false;

        // Проверяем, не выполнено ли уже задание
        if (!task.completed_by.includes(userId)) {
            // Добавляем пользователя в список выполнивших
            task.completed_by.push(userId);
            
            // Обновляем прогресс пользователя
            user.tasks_completed.push(taskId);
            user.points += 50;
            
            // Обновляем уровень пользователя
            const newLevel = Math.floor(user.tasks_completed.length / 5) + 1;
            if (newLevel > user.level) {
                user.level = newLevel;
            }
            
            // Обновляем в классе
            const studentInClass = db.classes[classKey]?.students?.find(s => s.id === userId);
            if (studentInClass) {
                studentInClass.points = user.points;
            }

            this.save(db);
            this.addLog(user.name, `Выполнил задание: ${task.title}`, "task");
            return true;
        }

        return false;
    }

    // === РЕАЛЬНЫЕ AI ЗНАНИЯ ===

    // Добавление реальных знаний в AI
    addKnowledge(category, keywords, answer) {
        const db = this.getAll();
        if (!db) return false;

        if (!db.ai_knowledge) {
            db.ai_knowledge = {};
        }

        if (!db.ai_knowledge[category]) {
            db.ai_knowledge[category] = {};
        }

        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        
        keywordList.forEach(keyword => {
            db.ai_knowledge[category][keyword] = answer;
        });

        this.save(db);
        this.addLog("admin", `Добавлены знания в категорию: ${category}`, "ai");
        return true;
    }

    // Получение ответа от AI
    getAIResponse(message) {
        const db = this.getAll();
        if (!db || !db.ai_knowledge) return "Извините, база знаний пуста.";

        const lowerMessage = message.toLowerCase();
        
        // Ищем по всем категориям знаний
        for (const [category, knowledge] of Object.entries(db.ai_knowledge)) {
            for (const [keyword, answer] of Object.entries(knowledge)) {
                if (lowerMessage.includes(keyword)) {
                    return answer;
                }
            }
        }

        return "Я еще не знаю ответа на этот вопрос. Можете задать его по-другому?";
    }

    // === РЕАЛЬНЫЕ ЛОГИ ===

    // Добавление лога
    addLog(user, action, type = "system", level = "info") {
        const db = this.getAll();
        if (!db) return false;

        if (!db.logs) db.logs = [];

        const logEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            user: user,
            action: action,
            type: type,
            level: level,
            ip: "system" // В реальном приложении получаем IP
        };

        db.logs.push(logEntry);

        // Ограничиваем количество логов (сохраняем последние 1000)
        if (db.logs.length > 1000) {
            db.logs = db.logs.slice(-1000);
        }

        this.save(db);
        return true;
    }

    // === РЕАЛЬНАЯ СТАТИСТИКА ===

    // Получение реальной статистики системы
    getSystemStats() {
        const db = this.getAll();
        if (!db) return null;

        const stats = {
            total_users: db.users.length,
            active_users: db.users.filter(u => u.is_active).length,
            total_tasks: Object.values(db.classes).reduce((total, classData) => 
                total + (classData.tasks?.length || 0), 0),
            completed_tasks: db.users.reduce((total, user) => 
                total + (user.tasks_completed?.length || 0), 0),
            total_logins: db.system.total_logins || 0,
            ai_knowledge: Object.values(db.ai_knowledge || {}).reduce((total, category) => 
                total + Object.keys(category).length, 0),
            last_updated: db.lastUpdated
        };

        return stats;
    }

    // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

    generateAvatar(name) {
        if (!name) return "??";
        
        const names = name.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    // Резервное копирование
    backup() {
        const db = this.getAll();
        if (!db) return null;

        const dataStr = JSON.stringify(db, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        return {
            data: dataStr,
            dataUri: dataUri,
            filename: `leo_backup_${new Date().toISOString().split('T')[0]}.json`
        };
    }

    // Восстановление из резервной копии
    restore(backupData) {
        try {
            const data = JSON.parse(backupData);
            
            // Проверяем, что это валидная резервная копия
            if (!data.version || !data.users || !data.classes) {
                throw new Error("Некорректный формат резервной копии");
            }

            localStorage.setItem(this.dbName, JSON.stringify(data));
            
            this.addLog("admin", "Восстановлена база данных из резервной копии", "system", "warning");
            return true;
            
        } catch (error) {
            console.error("Ошибка восстановления:", error);
            return false;
        }
    }

    // Очистка всех данных (только для админа!)
    clearAll() {
        const db = this.getAll();
        const adminPassword = db?.system?.admin_password;
        
        if (!adminPassword) {
            localStorage.removeItem(this.dbName);
            this.init();
            return true;
        }

        // Сохраняем только системные настройки и пароль
        const cleanData = {
            version: "3.0",
            users: [],
            classes: {
                "7B": {
                    name: "7Б класс",
                    students: [],
                    tasks: [],
                    schedule: this.getDefaultSchedule()
                }
            },
            ai_knowledge: {
                greetings: {
                    "привет": "Привет! Я Лео, ваш помощник в учебе.",
                    "здравствуй": "Здравствуйте! Чем могу помочь?"
                }
            },
            system: {
                admin_password: adminPassword,
                total_logins: 0,
                system_name: "Leo Assistant"
            },
            settings: db?.settings || {
                theme: "dark",
                accent_color: "#6366f1",
                default_class: "7B",
                points_per_task: 50
            },
            logs: []
        };

        localStorage.setItem(this.dbName, JSON.stringify(cleanData));
        
        this.addLog("admin", "Очищена вся база данных", "system", "danger");
        return true;
    }
}

// Создаем глобальный экземпляр
const leoDB = new LeoDatabase();
