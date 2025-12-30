// js/admin.js - ПОЛНАЯ ЛОГИКА АДМИН-ПАНЕЛИ
class AdminPanel {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🚀 Админ-панель инициализирована');
        
        // Проверка авторизации
        this.checkAuth();
        
        // Инициализация компонентов
        this.initNavigation();
        this.initDatabase();
        this.initStatistics();
        this.initUsers();
        this.initTasks();
        this.initAI();
        this.initEvents();
        
        // Обновление данных
        this.updateAllData();
    }
    
    // ==================== АВТОРИЗАЦИЯ ====================
    
    checkAuth() {
        if (!localStorage.getItem('is_admin')) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
    
    // ==================== БАЗА ДАННЫХ ====================
    
    initDatabase() {
        this.db = {
            name: 'leo_admin_db',
            get: () => {
                const data = localStorage.getItem(this.db.name);
                return data ? JSON.parse(data) : null;
            },
            save: (data) => {
                localStorage.setItem(this.db.name, JSON.stringify(data));
            },
            init: () => {
                if (!localStorage.getItem(this.db.name)) {
                    const initialData = {
                        users: [],
                        tasks: [],
                        ai_knowledge: {
                            math: ['Математика изучает числа и их свойства'],
                            physics: ['Физика - наука о природе'],
                            history: ['История изучает прошлое человечества'],
                            general: ['AI готов помогать с учебой']
                        },
                        system: {
                            version: '1.0.0',
                            total_logins: Math.floor(Math.random() * 100) + 50,
                            start_date: new Date().toISOString(),
                            last_backup: null
                        },
                        notifications: []
                    };
                    this.db.save(initialData);
                }
            }
        };
        
        this.db.init();
    }
    
    // ==================== НАВИГАЦИЯ ====================
    
    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.getAttribute('data-tab');
                
                // Скрыть все вкладки
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // Убрать активность у всех пунктов меню
                navItems.forEach(nav => {
                    nav.classList.remove('active');
                });
                
                // Показать выбранную вкладку
                const targetTab = document.getElementById(`tab-${tab}`);
                if (targetTab) {
                    targetTab.classList.add('active');
                    item.classList.add('active');
                    this.updatePageTitle(tab);
                    
                    // Загрузить данные для вкладки
                    this.loadTabData(tab);
                }
            });
        });
    }
    
    updatePageTitle(tab) {
        const titles = {
            dashboard: 'Панель управления',
            users: 'Управление пользователями',
            tasks: 'Управление заданиями',
            schedule: 'Расписание',
            ai: 'AI Обучение',
            system: 'Настройки системы',
            analytics: 'Аналитика',
            notifications: 'Уведомления'
        };
        
        const descriptions = {
            dashboard: 'Полный контроль над системой Leo Assistant',
            users: 'Управление пользователями и их правами',
            tasks: 'Создание и управление заданиями',
            schedule: 'Настройка расписания занятий',
            ai: 'Обучение и управление искусственным интеллектом',
            system: 'Настройки безопасности и системные операции',
            analytics: 'Статистика и аналитика системы',
            notifications: 'Управление уведомлениями'
        };
        
        const titleElement = document.getElementById('pageTitle');
        const descElement = document.getElementById('pageDescription');
        
        if (titleElement) {
            titleElement.textContent = titles[tab] || 'Панель управления';
        }
        if (descElement) {
            descElement.textContent = descriptions[tab] || 'Полный контроль над системой Leo Assistant';
        }
    }
    
    loadTabData(tab) {
        switch(tab) {
            case 'users':
                this.renderUsersTable();
                break;
            case 'tasks':
                this.renderTasksTable();
                break;
            case 'ai':
                this.renderKnowledgeTable();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
        }
    }
    
    // ==================== СТАТИСТИКА ====================
    
    initStatistics() {
        this.updateStatistics();
        
        // Обновление статистики каждые 30 секунд
        setInterval(() => {
            this.updateStatistics();
        }, 30000);
    }
    
    updateStatistics() {
        const db = this.db.get();
        if (!db) return;
        
        // Обновить счетчики в навигации
        this.updateNavCounters(db);
        
        // Обновить основную статистику
        this.updateMainStats(db);
        
        // Обновить системную информацию
        this.updateSystemInfo(db);
    }
    
    updateNavCounters(db) {
        const updateCounter = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };
        
        updateCounter('usersCount', db.users.length);
        updateCounter('tasksCount', db.tasks.length);
        
        const aiCount = Object.values(db.ai_knowledge).flat().length;
        updateCounter('aiCount', aiCount);
        updateCounter('notificationsCount', db.notifications.length);
    }
    
    updateMainStats(db) {
        // Пользователи
        const usersElement = document.getElementById('statUsers');
        if (usersElement) {
            usersElement.textContent = db.users.length;
        }
        
        // Задания
        const tasksElement = document.getElementById('statTasks');
        if (tasksElement) {
            tasksElement.textContent = db.tasks.length;
        }
        
        // Знания AI
        const aiCount = Object.values(db.ai_knowledge).flat().length;
        const aiElement = document.getElementById('statAI');
        if (aiElement) {
            aiElement.textContent = aiCount;
        }
        
        // Проблемы (пользователи без очков)
        const issues = db.users.filter(user => user.points === 0).length;
        const issuesElement = document.getElementById('statIssues');
        if (issuesElement) {
            issuesElement.textContent = issues;
        }
        
        // Процентные изменения (демо-данные)
        this.updatePercentageChanges();
    }
    
    updatePercentageChanges() {
        const changes = {
            usersChange: `+${Math.floor(Math.random() * 10)}%`,
            tasksChange: `+${Math.floor(Math.random() * 15)}%`,
            aiChange: `+${Math.floor(Math.random() * 20)}%`,
            issuesChange: `-${Math.floor(Math.random() * 5)}%`
        };
        
        Object.entries(changes).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    updateSystemInfo(db) {
        const updateInfo = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };
        
        // Версия системы
        updateInfo('systemVersion', db.system.version);
        
        // Всего логинов
        updateInfo('totalLogins', db.system.total_logins);
        
        // Объем данных
        const dataSize = JSON.stringify(db).length;
        updateInfo('dataSize', `${Math.round(dataSize / 1024)} KB`);
        
        // Дата запуска
        if (db.system.start_date) {
            const startDate = new Date(db.system.start_date);
            updateInfo('systemStartDate', startDate.toLocaleDateString('ru-RU'));
        }
        
        // Дата последнего бэкапа
        if (db.system.last_backup) {
            const backupDate = new Date(db.system.last_backup);
            const backupElement = document.getElementById('lastBackupDate');
            if (backupElement) {
                backupElement.textContent = backupDate.toLocaleDateString('ru-RU');
            }
        }
    }
    
    // ==================== ПОЛЬЗОВАТЕЛИ ====================
    
    initUsers() {
        this.renderUsersTable();
        this.initUserSearch();
        this.initUserFilter();
    }
    
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        const db = this.db.get();
        if (!db || !db.users || db.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>Нет пользователей</h3>
                        <p>Создайте первого пользователя</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Сортировка по очкам (по убыванию)
        const sortedUsers = [...db.users].sort((a, b) => b.points - a.points);
        
        let html = '';
        sortedUsers.forEach((user, index) => {
            // Статус пользователя
            let statusClass = '';
            let statusText = '';
            
            if (user.role === 'admin') {
                statusClass = 'badge-danger';
                statusText = 'Админ';
            } else if (user.points >= 1000) {
                statusClass = 'badge-success';
                statusText = 'Активен';
            } else if (user.points === 0) {
                statusClass = 'badge-warning';
                statusText = 'Новичок';
            } else {
                statusClass = 'badge-primary';
                statusText = 'Ученик';
            }
            
            // Аватар (первые буквы имени)
            const avatar = user.name.split(' ').map(word => word[0]).join('').toUpperCase();
            
            html += `
                <tr>
                    <td>${user.id || index + 1}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); 
                                    border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                                    color: white; font-weight: bold; font-size: 14px;">
                                ${avatar}
                            </div>
                            <div>
                                <div style="font-weight: 600;">${user.name}</div>
                                <div style="font-size: 12px; color: #94a3b8;">@${user.login}</div>
                            </div>
                        </div>
                    </td>
                    <td>${user.class || '7Б'}</td>
                    <td>
                        <div style="font-weight: 700; color: #8b5cf6;">${user.points || 0}</div>
                    </td>
                    <td>${user.tasks_completed || 0}</td>
                    <td>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-edit-user" data-user-id="${user.id || index}" 
                                    style="padding: 5px 10px; background: rgba(59, 130, 246, 0.2); 
                                    color: #3b82f6; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-user" data-user-id="${user.id || index}"
                                    style="padding: 5px 10px; background: rgba(239, 68, 68, 0.2); 
                                    color: #ef4444; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Добавить обработчики для кнопок действий
        this.initUserActions();
    }
    
    initUserSearch() {
        const searchInput = document.getElementById('userSearch');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#usersTableBody tr');
            
            rows.forEach(row => {
                const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const login = row.querySelector('td:nth-child(2) div:nth-child(2)').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || login.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    initUserFilter() {
        const filterSelect = document.getElementById('userFilter');
        if (!filterSelect) return;
        
        filterSelect.addEventListener('change', (e) => {
            const filter = e.target.value;
            const rows = document.querySelectorAll('#usersTableBody tr');
            
            rows.forEach(row => {
                const status = row.querySelector('td:nth-child(6) span').textContent.toLowerCase();
                
                if (filter === 'all' || 
                    (filter === 'students' && (status === 'ученик' || status === 'новичок')) ||
                    (filter === 'teachers' && (status === 'админ' || status === 'учитель'))) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    initUserActions() {
        // Редактирование пользователя
        document.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('button').getAttribute('data-user-id');
                this.editUser(userId);
            });
        });
        
        // Удаление пользователя
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('button').getAttribute('data-user-id');
                this.deleteUser(userId);
            });
        });
    }
    
    addUser(userData) {
        const db = this.db.get();
        if (!db) return false;
        
        // Проверить, нет ли уже такого логина
        const userExists = db.users.some(user => user.login === userData.login);
        if (userExists) {
            this.showNotification('Пользователь с таким логином уже существует', 'error');
            return false;
        }
        
        // Создать нового пользователя
        const newUser = {
            id: Date.now(),
            name: userData.name,
            login: userData.login,
            password: userData.password,
            class: userData.class || '7Б',
            role: userData.role || 'student',
            points: 0,
            level: 1,
            tasks_completed: 0,
            created_at: new Date().toISOString()
        };
        
        db.users.push(newUser);
        db.system.total_logins++;
        this.db.save(db);
        
        // Обновить интерфейс
        this.updateStatistics();
        this.renderUsersTable();
        
        this.showNotification('Пользователь успешно создан', 'success');
        return true;
    }
    
    editUser(userId) {
        this.showNotification('Редактирование пользователя (в разработке)', 'info');
    }
    
    deleteUser(userId) {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            return;
        }
        
        const db = this.db.get();
        if (!db) return;
        
        const userIndex = db.users.findIndex(user => user.id == userId);
        if (userIndex !== -1) {
            db.users.splice(userIndex, 1);
            this.db.save(db);
            
            this.updateStatistics();
            this.renderUsersTable();
            this.showNotification('Пользователь удален', 'success');
        }
    }
    
    // ==================== ЗАДАНИЯ ====================
    
    initTasks() {
        this.renderTasksTable();
        this.initTaskSearch();
        this.initTaskFilter();
    }
    
    renderTasksTable() {
        const tbody = document.getElementById('tasksTableBody');
        if (!tbody) return;
        
        const db = this.db.get();
        if (!db || !db.tasks || db.tasks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-tasks"></i>
                        <h3>Нет заданий</h3>
                        <p>Создайте первое задание</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Сортировка по дате сдачи
        const sortedTasks = [...db.tasks].sort((a, b) => {
            const dateA = new Date(a.dueDate || '9999-12-31');
            const dateB = new Date(b.dueDate || '9999-12-31');
            return dateA - dateB;
        });
        
        let html = '';
        sortedTasks.forEach((task, index) => {
            // Цвет приоритета
            let priorityClass = '';
            let priorityText = '';
            
            switch(task.priority) {
                case 'high':
                    priorityClass = 'badge-danger';
                    priorityText = 'Высокий';
                    break;
                case 'medium':
                    priorityClass = 'badge-warning';
                    priorityText = 'Средний';
                    break;
                case 'low':
                    priorityClass = 'badge-success';
                    priorityText = 'Низкий';
                    break;
                default:
                    priorityClass = 'badge-primary';
                    priorityText = task.priority;
            }
            
            // Название предмета
            const subjectNames = {
                math: 'Математика',
                physics: 'Физика',
                history: 'История',
                english: 'Английский',
                informatics: 'Информатика'
            };
            
            // Форматирование даты
            const dueDate = task.dueDate ? 
                new Date(task.dueDate).toLocaleDateString('ru-RU') : 
                'Не указано';
            
            html += `
                <tr>
                    <td>${task.id || index + 1}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 8px; height: 8px; border-radius: 50%; 
                                    background: ${this.getSubjectColor(task.subject)};"></div>
                            <span>${subjectNames[task.subject] || task.subject}</span>
                        </div>
                    </td>
                    <td>
                        <div style="font-weight: 600;">${task.title || 'Без названия'}</div>
                        ${task.description ? `
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">
                            ${task.description.substring(0, 60)}${task.description.length > 60 ? '...' : ''}
                        </div>` : ''}
                    </td>
                    <td>${dueDate}</td>
                    <td>
                        <span class="badge ${priorityClass}">${priorityText}</span>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #8b5cf6;">
                            ${task.completed_by ? task.completed_by.length : 0}
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-edit-task" data-task-id="${task.id || index}"
                                    style="padding: 5px 10px; background: rgba(59, 130, 246, 0.2); 
                                    color: #3b82f6; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete-task" data-task-id="${task.id || index}"
                                    style="padding: 5px 10px; background: rgba(239, 68, 68, 0.2); 
                                    color: #ef4444; border: none; border-radius: 6px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Добавить обработчики для кнопок действий
        this.initTaskActions();
    }
    
    getSubjectColor(subject) {
        const colors = {
            math: '#8b5cf6',
            physics: '#3b82f6',
            history: '#10b981',
            english: '#f59e0b',
            informatics: '#ef4444'
        };
        return colors[subject] || '#6b7280';
    }
    
    initTaskSearch() {
        const searchInput = document.getElementById('taskSearch');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#tasksTableBody tr');
            
            rows.forEach(row => {
                const title = row.querySelector('td:nth-child(3) div:nth-child(1)').textContent.toLowerCase();
                const subject = row.querySelector('td:nth-child(2) span').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || subject.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    initTaskFilter() {
        const filterSelect = document.getElementById('taskFilter');
        if (!filterSelect) return;
        
        filterSelect.addEventListener('change', (e) => {
            const filter = e.target.value;
            const rows = document.querySelectorAll('#tasksTableBody tr');
            
            rows.forEach(row => {
                const completed = parseInt(row.querySelector('td:nth-child(6) div').textContent);
                
                if (filter === 'all' || 
                    (filter === 'active' && completed === 0) ||
                    (filter === 'completed' && completed > 0)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    initTaskActions() {
        // Редактирование задания
        document.querySelectorAll('.btn-edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('button').getAttribute('data-task-id');
                this.editTask(taskId);
            });
        });
        
        // Удаление задания
        document.querySelectorAll('.btn-delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('button').getAttribute('data-task-id');
                this.deleteTask(taskId);
            });
        });
    }
    
    createTask(taskData) {
        const db = this.db.get();
        if (!db) return false;
        
        const newTask = {
            id: Date.now(),
            subject: taskData.subject,
            priority: taskData.priority,
            dueDate: taskData.dueDate,
            title: `Задание по ${this.getSubjectName(taskData.subject)}`,
            description: taskData.description,
            completed_by: [],
            created_at: new Date().toISOString()
        };
        
        if (!db.tasks) db.tasks = [];
        db.tasks.push(newTask);
        this.db.save(db);
        
        // Обновить интерфейс
        this.updateStatistics();
        this.renderTasksTable();
        
        this.showNotification('Задание успешно создано', 'success');
        return true;
    }
    
    getSubjectName(subject) {
        const names = {
            math: 'Математике',
            physics: 'Физике',
            history: 'Истории',
            english: 'Английскому',
            informatics: 'Информатике'
        };
        return names[subject] || subject;
    }
    
    editTask(taskId) {
        this.showNotification('Редактирование задания (в разработке)', 'info');
    }
    
    deleteTask(taskId) {
        if (!confirm('Вы уверены, что хотите удалить это задание?')) {
            return;
        }
        
        const db = this.db.get();
        if (!db || !db.tasks) return;
        
        const taskIndex = db.tasks.findIndex(task => task.id == taskId);
        if (taskIndex !== -1) {
            db.tasks.splice(taskIndex, 1);
            this.db.save(db);
            
            this.updateStatistics();
            this.renderTasksTable();
            this.showNotification('Задание удалено', 'success');
        }
    }
    
    // ==================== AI ОБУЧЕНИЕ ====================
    
    initAI() {
        this.renderKnowledgeTable();
        this.initKnowledgeSearch();
        this.initKnowledgeFilter();
    }
    
    renderKnowledgeTable() {
        const tbody = document.getElementById('knowledgeTableBody');
        if (!tbody) return;
        
        const db = this.db.get();
        if (!db || !db.ai_knowledge) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-brain"></i>
                        <h3>База знаний пуста</h3>
                        <p>Добавьте первое знание для обучения AI</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Преобразовать объект знаний в массив
        const knowledgeArray = [];
        Object.entries(db.ai_knowledge).forEach(([category, items]) => {
            items.forEach((text, index) => {
                knowledgeArray.push({
                    id: `${category}_${index}`,
                    text: text,
                    category: category,
                    added: new Date().toISOString(),
                    used: Math.floor(Math.random() * 50)
                });
            });
        });
        
        if (knowledgeArray.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-brain"></i>
                        <h3>База знаний пуста</h3>
                        <p>Добавьте первое знание для обучения AI</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Обновить счетчик знаний
        const knowledgeCount = document.getElementById('knowledgeCount');
        if (knowledgeCount) {
            knowledgeCount.textContent = `${knowledgeArray.length} знаний`;
        }
        
        let html = '';
        knowledgeArray.forEach((item, index) => {
            // Название категории
            const categoryNames = {
                math: 'Математика',
                physics: 'Физика',
                history: 'История',
                general: 'Общие знания'
            };
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <div style="max-width: 300px;">${item.text}</div>
                    </td>
                    <td>
                        <span class="badge badge-primary">${categoryNames[item.category] || item.category}</span>
                    </td>
                    <td>
                        ${new Date(item.added).toLocaleDateString('ru-RU')}
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #8b5cf6;">${item.used}</div>
                    </td>
                    <td>
                        <button class="btn-delete-knowledge" data-knowledge-id="${item.id}"
                                style="padding: 5px 10px; background: rgba(239, 68, 68, 0.2); 
                                color: #ef4444; border: none; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Добавить обработчики для кнопок удаления
        this.initKnowledgeActions();
    }
    
    initKnowledgeSearch() {
        const searchInput = document.getElementById('knowledgeSearch');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#knowledgeTableBody tr');
            
            rows.forEach(row => {
                const text = row.querySelector('td:nth-child(2) div').textContent.toLowerCase();
                
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    initKnowledgeFilter() {
        const filterSelect = document.getElementById('knowledgeFilter');
        if (!filterSelect) return;
        
        filterSelect.addEventListener('change', (e) => {
            const filter = e.target.value;
            const rows = document.querySelectorAll('#knowledgeTableBody tr');
            
            rows.forEach(row => {
                const category = row.querySelector('td:nth-child(3) span').textContent.toLowerCase();
                
                if (filter === 'all' || category.includes(filter)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    initKnowledgeActions() {
        document.querySelectorAll('.btn-delete-knowledge').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const knowledgeId = e.target.closest('button').getAttribute('data-knowledge-id');
                this.deleteKnowledge(knowledgeId);
            });
        });
    }
    
    addKnowledge(category, text) {
        const db = this.db.get();
        if (!db) return false;
        
        if (!db.ai_knowledge[category]) {
            db.ai_knowledge[category] = [];
        }
        
        db.ai_knowledge[category].push(text);
        this.db.save(db);
        
        // Обновить интерфейс
        this.updateStatistics();
        this.renderKnowledgeTable();
        
        this.showNotification('Знание добавлено в базу AI', 'success');
        return true;
    }
    
    deleteKnowledge(knowledgeId) {
        if (!confirm('Вы уверены, что хотите удалить это знание?')) {
            return;
        }
        
        const db = this.db.get();
        if (!db || !db.ai_knowledge) return;
        
        // knowledgeId в формате "category_index"
        const [category, index] = knowledgeId.split('_');
        
        if (db.ai_knowledge[category] && db.ai_knowledge[category][parseInt(index)]) {
            db.ai_knowledge[category].splice(parseInt(index), 1);
            this.db.save(db);
            
            this.updateStatistics();
            this.renderKnowledgeTable();
            this.showNotification('Знание удалено', 'success');
        }
    }
    
    startAITraining() {
        const startBtn = document.getElementById('startTrainingBtn');
        const stopBtn = document.getElementById('stopTrainingBtn');
        const progressBar = document.getElementById('trainingProgress');
        const statusText = document.getElementById('trainingStatus');
        
        if (!startBtn || !stopBtn || !progressBar || !statusText) return;
        
        // Отключить кнопку старта, включить кнопку остановки
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = progress + '%';
            statusText.textContent = `Обучение: ${Math.round(progress)}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                startBtn.disabled = false;
                stopBtn.disabled = true;
                statusText.textContent = 'Обучение завершено!';
                this.showNotification('AI успешно обучен', 'success');
            }
        }, 500);
        
        // Обработчик для кнопки остановки
        const stopHandler = () => {
            clearInterval(interval);
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusText.textContent = 'Обучение остановлено';
            this.showNotification('Обучение остановлено', 'warning');
            
            // Удалить обработчик после использования
            stopBtn.removeEventListener('click', stopHandler);
        };
        
        stopBtn.addEventListener('click', stopHandler);
    }
    
    resetAI() {
        if (!confirm('Вы уверены, что хотите сбросить AI? Все обученные данные будут удалены.')) {
            return;
        }
        
        const db = this.db.get();
        if (!db) return;
        
        db.ai_knowledge = {
            math: ['Математика изучает числа и их свойства'],
            physics: ['Физика - наука о природе'],
            history: ['История изучает прошлое человечества'],
            general: ['AI готов помогать с учебой']
        };
        
        this.db.save(db);
        
        this.updateStatistics();
        this.renderKnowledgeTable();
        this.showNotification('AI сброшен к начальному состоянию', 'success');
    }
    
    // ==================== АНАЛИТИКА ====================
    
    renderAnalytics() {
        // В будущем здесь можно добавить графики и диаграммы
        console.log('Загрузка аналитики...');
    }
    
    // ==================== ОБЩИЕ СИСТЕМНЫЕ ФУНКЦИИ ====================
    
    clearCache() {
        // Сохраняем только системные данные
        const db = this.db.get();
        if (!db) return;
        
        const systemData = {
            system: db.system,
            ai_knowledge: db.ai_knowledge
        };
        
        this.db.save(systemData);
        
        this.updateStatistics();
        this.renderUsersTable();
        this.renderTasksTable();
        this.showNotification('Кэш очищен', 'success');
    }
    
    createBackup() {
        const db = this.db.get();
        if (!db) return;
        
        const backupData = {
            ...db,
            backup_date: new Date().toISOString()
        };
        
        // Обновить дату последнего бэкапа
        db.system.last_backup = new Date().toISOString();
        this.db.save(db);
        
        // Создать файл для скачивания
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `leo_backup_${new Date().toISOString().slice(0,10)}.json`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        this.showNotification('Резервная копия создана', 'success');
        this.updateStatistics();
    }
    
    exportData() {
        const db = this.db.get();
        if (!db) return;
        
        const exportData = {
            users: db.users || [],
            tasks: db.tasks || [],
            ai_knowledge: db.ai_knowledge || {},
            statistics: {
                total_users: db.users.length,
                total_tasks: db.tasks.length,
                total_logins: db.system.total_logins,
                ai_knowledge_count: Object.values(db.ai_knowledge).flat().length
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `leo_export_${new Date().toISOString().slice(0,10)}.json`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        this.showNotification('Данные экспортированы', 'success');
    }
    
    // ==================== СОБЫТИЯ ====================
    
    initEvents() {
        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите выйти?')) {
                    localStorage.removeItem('is_admin');
                    window.location.href = 'index.html';
                }
            });
        }
        
        // Кнопка обновления
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.updateAllData();
                this.showNotification('Данные обновлены', 'success');
            });
        }
        
        // Кнопка экспорта
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        // Быстрые действия
        this.initQuickActions();
        
        // Форма создания пользователя
        this.initUserForm();
        
        // Форма создания задания
        this.initTaskForm();
        
        // Форма добавления знаний AI
        this.initKnowledgeForm();
        
        // AI обучение
        this.initAITraining();
    }
    
    initQuickActions() {
        // Добавить пользователя
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showUserModal();
            });
        }
        
        const newUserBtn = document.getElementById('newUserBtn');
        if (newUserBtn) {
            newUserBtn.addEventListener('click', () => {
                this.showUserModal();
            });
        }
        
        // Создать задание
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                // Перейти на вкладку заданий
                document.querySelector('[data-tab="tasks"]').click();
            });
        }
        
        // Создать резервную копию
        const backupBtn = document.getElementById('backupBtn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }
        
        // Очистить кэш
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.clearCache();
            });
        }
    }
    
    showUserModal() {
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    initUserForm() {
        const userForm = document.getElementById('userForm');
        if (!userForm) return;
        
        userForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('modalUserName').value.trim();
            const login = document.getElementById('modalUserLogin').value.trim();
            const password = document.getElementById('modalUserPassword').value;
            const confirmPassword = document.getElementById('modalUserConfirmPassword').value;
            const userClass = document.getElementById('modalUserClass').value;
            const role = document.getElementById('modalUserRole').value;
            
            // Валидация
            if (!name || !login || !password || !confirmPassword) {
                this.showNotification('Заполните все поля', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showNotification('Пароли не совпадают', 'error');
                return;
            }
            
            if (password.length < 4) {
                this.showNotification('Пароль должен быть не менее 4 символов', 'error');
                return;
            }
            
            // Создать пользователя
            const success = this.addUser({
                name: name,
                login: login,
                password: password,
                class: userClass,
                role: role
            });
            
            if (success) {
                // Закрыть модальное окно
                const modal = document.getElementById('userModal');
                if (modal) {
                    modal.classList.remove('active');
                }
                
                // Очистить форму
                userForm.reset();
            }
        });
        
        // Закрытие модального окна
        const closeButtons = document.querySelectorAll('.modal-close, #cancelUserModal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = document.getElementById('userModal');
                if (modal) {
                    modal.classList.remove('active');
                    userForm.reset();
                }
            });
        });
        
        // Клик вне модального окна
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    userForm.reset();
                }
            });
        }
    }
    
    initTaskForm() {
        const createTaskBtn = document.getElementById('createTaskBtn');
        if (!createTaskBtn) return;
        
        createTaskBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const subject = document.getElementById('taskSubject').value;
            const priority = document.getElementById('taskPriority').value;
            const dueDate = document.getElementById('taskDueDate').value;
            const description = document.getElementById('taskDescription').value.trim();
            
            if (!description) {
                this.showNotification('Введите описание задания', 'error');
                return;
            }
            
            const success = this.createTask({
                subject: subject,
                priority: priority,
                dueDate: dueDate,
                description: description
            });
            
            if (success) {
                // Очистить форму
                document.getElementById('taskDescription').value = '';
                document.getElementById('taskDueDate').value = '';
                
                // Показать уведомление
                this.showNotification('Задание создано успешно', 'success');
            }
        });
        
        // Очистка формы
        const clearTaskFormBtn = document.getElementById('clearTaskFormBtn');
        if (clearTaskFormBtn) {
            clearTaskFormBtn.addEventListener('click', () => {
                document.getElementById('taskDescription').value = '';
                document.getElementById('taskDueDate').value = '';
            });
        }
    }
    
    initKnowledgeForm() {
        const addKnowledgeBtn = document.getElementById('addKnowledgeBtn');
        if (!addKnowledgeBtn) return;
        
        addKnowledgeBtn.addEventListener('click', () => {
            const text = document.getElementById('newKnowledgeInput').value.trim();
            const category = document.getElementById('knowledgeCategory').value;
            
            if (!text) {
                this.showNotification('Введите текст знания', 'error');
                return;
            }
            
            const success = this.addKnowledge(category, text);
            
            if (success) {
                // Очистить поле ввода
                document.getElementById('newKnowledgeInput').value = '';
            }
        });
    }
    
    initAITraining() {
        const startTrainingBtn = document.getElementById('startTrainingBtn');
        if (startTrainingBtn) {
            startTrainingBtn.addEventListener('click', () => {
                this.startAITraining();
            });
        }
        
        const resetAiBtn = document.getElementById('resetAiBtn');
        if (resetAiBtn) {
            resetAiBtn.addEventListener('click', () => {
                this.resetAI();
            });
        }
    }
    
    // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
    
    updateAllData() {
        this.updateStatistics();
        this.renderUsersTable();
        this.renderTasksTable();
        this.renderKnowledgeTable();
    }
    
    showNotification(message, type = 'info') {
        // Удалить старые уведомления
        const oldNotification = document.querySelector('.admin-notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        // Создать новое уведомление
        const notification = document.createElement('div');
        notification.className = 'admin-notification';
        
        // Иконка в зависимости от типа
        let icon = 'info-circle';
        let backgroundColor = '#3b82f6';
        
        switch(type) {
            case 'success':
                icon = 'check-circle';
                backgroundColor = '#10b981';
                break;
            case 'error':
                icon = 'exclamation-circle';
                backgroundColor = '#ef4444';
                break;
            case 'warning':
                icon = 'exclamation-triangle';
                backgroundColor = '#f59e0b';
                break;
        }
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        // Стили уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        document.body.appendChild(notification);
        
        // Удалить через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    animateStatistics() {
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(element => {
            const finalValue = parseInt(element.textContent);
            if (isNaN(finalValue)) return;
            
            let current = 0;
            const increment = Math.ceil(finalValue / 50);
            const timer = setInterval(() => {
                current += increment;
                if (current >= finalValue) {
                    current = finalValue;
                    clearInterval(timer);
                }
                element.textContent = current;
            }, 30);
        });
    }
}

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', () => {
    // Добавить стили для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .btn {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        
        .action-btn {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .action-btn:hover {
            background: rgba(139, 92, 246, 0.1) !important;
            border-color: #8b5cf6 !important;
            transform: translateY(-5px) !important;
        }
        
        .stat-card {
            transition: all 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            border-color: #8b5cf6 !important;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3) !important;
        }
        
        table tbody tr {
            transition: all 0.2s ease;
        }
        
        table tbody tr:hover {
            background: rgba(255, 255, 255, 0.03) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Создать и инициализировать админ-панель
    const adminPanel = new AdminPanel();
    
    // Запустить анимацию статистики через 1 секунду
    setTimeout(() => {
        adminPanel.animateStatistics();
    }, 1000);
    
    // Обновлять статистику каждые 5 минут
    setInterval(() => {
        adminPanel.updateStatistics();
        adminPanel.animateStatistics();
    }, 300000);
});
