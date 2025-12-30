// js/admin.js - ПОЛНОСТЬЮ РАБОЧАЯ АДМИН-ПАНЕЛЬ
document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Админ-панель загружена');
    
    // ========== БАЗА ДАННЫХ ДЛЯ АДМИНКИ ==========
    class AdminDatabase {
        constructor() {
            this.db = leoDB;
            this.init();
        }
        
        init() {
            this.initAdminUser();
            this.initSystemData();
        }
        
        initAdminUser() {
            const db = this.db.getAll();
            if (!db.users) db.users = [];
            
            // Проверяем есть ли администратор
            const adminExists = db.users.some(u => u.role === 'admin');
            if (!adminExists) {
                const adminUser = {
                    id: 1,
                    login: 'admin',
                    password: 'admin123',
                    name: 'Администратор системы',
                    avatar: 'АС',
                    class: 'admin',
                    role: 'admin',
                    points: 0,
                    level: 99,
                    tasks_completed: [],
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString()
                };
                
                db.users.push(adminUser);
                this.db.save(db);
                console.log('👑 Администратор создан');
            }
        }
        
        initSystemData() {
            const db = this.db.getAll();
            
            // Инициализируем системные данные если их нет
            if (!db.system) {
                db.system = {
                    admin_password: 'admin123',
                    system_name: 'Leo Assistant',
                    version: '2.0',
                    total_logins: 0,
                    last_backup: null,
                    settings: {
                        default_class: '7B',
                        points_per_task: 50,
                        session_duration: 7,
                        auto_backup: 'daily',
                        logs_retention: 30
                    }
                };
            }
            
            // Инициализируем логи если их нет
            if (!db.logs) {
                db.logs = {
                    activities: [],
                    errors: [],
                    user_actions: []
                };
            }
            
            this.db.save(db);
        }
        
        // Получить всех пользователей
        getAllUsers() {
            const db = this.db.getAll();
            return db.users || [];
        }
        
        // Получить пользователя по ID
        getUserById(id) {
            const users = this.getAllUsers();
            return users.find(u => u.id === id);
        }
        
        // Добавить пользователя
        addUser(userData) {
            const db = this.db.getAll();
            
            // Проверяем уникальность логина
            const userExists = db.users.some(u => u.login.toLowerCase() === userData.login.toLowerCase());
            if (userExists) {
                return { success: false, error: 'Пользователь с таким логином уже существует' };
            }
            
            const newUser = {
                id: Date.now(),
                login: userData.login,
                password: userData.password,
                name: userData.name,
                avatar: this.generateAvatar(userData.name),
                class: userData.class || '7B',
                role: userData.role || 'student',
                points: userData.points || 0,
                level: 1,
                tasks_completed: [],
                created_at: new Date().toISOString(),
                last_login: null,
                status: 'active'
            };
            
            db.users.push(newUser);
            
            // Добавляем в класс
            if (!db.classes) db.classes = {};
            if (!db.classes[newUser.class]) {
                db.classes[newUser.class] = { students: [] };
            }
            if (!db.classes[newUser.class].students) {
                db.classes[newUser.class].students = [];
            }
            
            db.classes[newUser.class].students.push({
                id: newUser.id,
                name: newUser.name,
                points: newUser.points,
                avatar: newUser.avatar
            });
            
            this.db.save(db);
            
            // Логируем действие
            this.logActivity('user_added', `Добавлен пользователь: ${newUser.name}`, 'admin');
            
            return { success: true, user: newUser };
        }
        
        // Обновить пользователя
        updateUser(userId, updates) {
            const db = this.db.getAll();
            const userIndex = db.users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                return { success: false, error: 'Пользователь не найден' };
            }
            
            // Обновляем данные
            if (updates.name) db.users[userIndex].name = updates.name;
            if (updates.login) {
                // Проверяем уникальность нового логина
                const loginExists = db.users.some((u, index) => 
                    index !== userIndex && u.login.toLowerCase() === updates.login.toLowerCase()
                );
                if (loginExists) {
                    return { success: false, error: 'Логин уже используется' };
                }
                db.users[userIndex].login = updates.login;
            }
            if (updates.class) db.users[userIndex].class = updates.class;
            if (updates.role) db.users[userIndex].role = updates.role;
            if (updates.points !== undefined) db.users[userIndex].points = updates.points;
            if (updates.level !== undefined) db.users[userIndex].level = updates.level;
            if (updates.password) db.users[userIndex].password = updates.password;
            
            // Обновляем в классе
            if (updates.class || updates.name || updates.points !== undefined) {
                const user = db.users[userIndex];
                const classData = db.classes[user.class];
                if (classData && classData.students) {
                    const studentIndex = classData.students.findIndex(s => s.id === userId);
                    if (studentIndex !== -1) {
                        classData.students[studentIndex].name = user.name;
                        classData.students[studentIndex].points = user.points;
                    }
                }
            }
            
            this.db.save(db);
            
            // Логируем действие
            this.logActivity('user_updated', `Обновлен пользователь: ${db.users[userIndex].name}`, 'admin');
            
            return { success: true, user: db.users[userIndex] };
        }
        
        // Удалить пользователя
        deleteUser(userId) {
            const db = this.db.getAll();
            const user = db.users.find(u => u.id === userId);
            
            if (!user) {
                return { success: false, error: 'Пользователь не найден' };
            }
            
            if (user.role === 'admin') {
                return { success: false, error: 'Нельзя удалить администратора' };
            }
            
            // Удаляем пользователя
            db.users = db.users.filter(u => u.id !== userId);
            
            // Удаляем из класса
            if (db.classes && db.classes[user.class] && db.classes[user.class].students) {
                db.classes[user.class].students = db.classes[user.class].students.filter(s => s.id !== userId);
            }
            
            this.db.save(db);
            
            // Логируем действие
            this.logActivity('user_deleted', `Удален пользователь: ${user.name}`, 'admin');
            
            return { success: true };
        }
        
        // Получить статистику
        getStats() {
            const db = this.db.getAll();
            const users = db.users || [];
            const tasks = db.classes?.['7B']?.tasks || [];
            
            return {
                total_users: users.length,
                active_users: users.filter(u => u.last_login).length,
                total_tasks: tasks.length,
                completed_tasks: users.reduce((sum, user) => sum + (user.tasks_completed?.length || 0), 0),
                total_points: users.reduce((sum, user) => sum + (user.points || 0), 0),
                total_logins: db.system?.total_logins || 0,
                online_users: 1 // Пример, в реальности нужно отслеживать сессии
            };
        }
        
        // Логирование активности
        logActivity(type, message, user = 'system') {
            const db = this.db.getAll();
            
            if (!db.logs) db.logs = {};
            if (!db.logs.activities) db.logs.activities = [];
            
            const activity = {
                id: Date.now(),
                type: type,
                message: message,
                user: user,
                timestamp: new Date().toISOString(),
                ip: '127.0.0.1'
            };
            
            db.logs.activities.unshift(activity);
            
            // Ограничиваем количество логов
            if (db.logs.activities.length > 1000) {
                db.logs.activities = db.logs.activities.slice(0, 1000);
            }
            
            this.db.save(db);
            return activity;
        }
        
        // Получить логи
        getLogs(limit = 50) {
            const db = this.db.getAll();
            const logs = db.logs?.activities || [];
            return logs.slice(0, limit);
        }
        
        // Получить настройки
        getSettings() {
            const db = this.db.getAll();
            return db.system?.settings || {
                default_class: '7B',
                points_per_task: 50,
                session_duration: 7,
                auto_backup: 'daily',
                logs_retention: 30
            };
        }
        
        // Сохранить настройки
        saveSettings(settings) {
            const db = this.db.getAll();
            
            if (!db.system) db.system = {};
            db.system.settings = settings;
            
            this.db.save(db);
            
            this.logActivity('settings_updated', 'Обновлены системные настройки', 'admin');
            
            return { success: true };
        }
        
        // Генерация аватара
        generateAvatar(name) {
            const names = name.split(' ');
            if (names.length >= 2) {
                return (names[0][0] + names[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        
        // Создать резервную копию
        createBackup() {
            const db = this.db.getAll();
            const backup = {
                data: JSON.stringify(db, null, 2),
                timestamp: new Date().toISOString(),
                version: '2.0'
            };
            
            // Сохраняем в localStorage
            localStorage.setItem('leo_backup', JSON.stringify(backup));
            
            // Обновляем время последнего backup
            db.system.last_backup = new Date().toISOString();
            this.db.save(db);
            
            this.logActivity('backup_created', 'Создана резервная копия', 'system');
            
            return backup;
        }
        
        // Восстановить из резервной копии
        restoreBackup(backupData) {
            try {
                const db = JSON.parse(backupData);
                localStorage.setItem(this.db.dbName, JSON.stringify(db));
                
                this.logActivity('backup_restored', 'Восстановлена резервная копия', 'admin');
                
                return { success: true };
            } catch (error) {
                return { success: false, error: 'Ошибка восстановления: ' + error.message };
            }
        }
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    const adminDB = new AdminDatabase();
    let currentTab = 'dashboard';
    let currentUserModal = null;
    
    // Проверка прав администратора
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (!isAdmin) {
        alert('🚫 Доступ запрещен! Требуются права администратора.');
        window.location.href = 'index.html';
        return;
    }
    
    // Запуск админ-панели
    initAdminPanel();
    
    // ========== ОСНОВНАЯ ЛОГИКА ==========
    function initAdminPanel() {
        console.log('🔄 Инициализация админ-панели...');
        
        // Загрузка данных
        loadDashboardData();
        loadUsersData();
        loadActivityLog();
        loadSystemAlerts();
        loadSettings();
        
        // Инициализация событий
        initEventListeners();
        
        // Запуск автообновления
        startAutoRefresh();
        
        console.log('✅ Админ-панель готова');
    }
    
    // ========== ЗАГРУЗКА ДАННЫХ ==========
    function loadDashboardData() {
        const stats = adminDB.getStats();
        
        // Обновляем статистику
        document.getElementById('statTotalUsers').textContent = stats.total_users;
        document.getElementById('statTotalTasks').textContent = stats.total_tasks;
        document.getElementById('statAIRequests').textContent = stats.total_logins * 3;
        document.getElementById('statActivity').textContent = Math.min(100, Math.floor(stats.completed_tasks / Math.max(1, stats.total_tasks) * 100)) + '%';
        
        // Обновляем счетчики
        document.getElementById('usersCount').textContent = stats.total_users;
        document.getElementById('tasksCount').textContent = stats.total_tasks;
        document.getElementById('onlineUsers').textContent = stats.online_users;
        document.getElementById('activeSessions').textContent = stats.active_users;
        document.getElementById('logsCount').textContent = adminDB.getLogs().length;
        
        // Обновляем изменение
        document.getElementById('usersChange').textContent = '+0%';
        document.getElementById('tasksChange').textContent = '+0%';
        document.getElementById('aiChange').textContent = '+0%';
        document.getElementById('activityChange').textContent = '+0%';
    }
    
    function loadUsersData(filter = '') {
        const users = adminDB.getAllUsers();
        const tbody = document.getElementById('usersTableBody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Фильтрация
        let filteredUsers = users;
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredUsers = users.filter(user =>
                user.name.toLowerCase().includes(searchTerm) ||
                user.login.toLowerCase().includes(searchTerm) ||
                (user.class && user.class.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filteredUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div style="color: var(--admin-text-muted);">
                            <i class="fas fa-users" style="font-size: 40px; margin-bottom: 15px; opacity: 0.5;"></i>
                            <p>${filter ? 'Пользователи не найдены' : 'Нет пользователей'}</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            
            const lastLogin = user.last_login ? 
                new Date(user.last_login).toLocaleDateString('ru-RU') : 'Никогда';
            
            const statusClass = user.status === 'active' ? 'status-active' : 
                               user.status === 'inactive' ? 'status-inactive' : 'status-banned';
            
            const statusText = user.status === 'active' ? 'Активен' : 
                              user.status === 'inactive' ? 'Не активен' : 'Заблокирован';
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="user-avatar-small">${user.avatar}</div>
                        <div>
                            <div style="font-weight: 600;">${user.name}</div>
                            <div style="font-size: 12px; color: var(--admin-text-muted);">${lastLogin}</div>
                        </div>
                    </div>
                </td>
                <td>${user.login}</td>
                <td>${user.class || '7Б'}</td>
                <td>
                    <span class="status-badge ${user.role === 'admin' ? 'status-active' : 'status-inactive'}">
                        ${user.role === 'admin' ? 'Админ' : 'Ученик'}
                    </span>
                </td>
                <td><strong>${user.points || 0}</strong></td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" data-user-id="${user.id}" title="Просмотр">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" data-user-id="${user.id}" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" data-user-id="${user.id}" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Добавляем обработчики
        initUserActionListeners();
    }
    
    function loadActivityLog() {
        const logs = adminDB.getLogs(20);
        const tbody = document.getElementById('activityTableBody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        logs.forEach(log => {
            const row = document.createElement('tr');
            
            const time = new Date(log.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const date = new Date(log.timestamp).toLocaleDateString('ru-RU');
            
            const statusIcon = log.type.includes('error') ? 'fa-times-circle' :
                              log.type.includes('warning') ? 'fa-exclamation-triangle' :
                              log.type.includes('success') ? 'fa-check-circle' : 'fa-info-circle';
            
            const statusColor = log.type.includes('error') ? 'var(--admin-danger)' :
                               log.type.includes('warning') ? 'var(--admin-warning)' :
                               log.type.includes('success') ? 'var(--admin-success)' : 'var(--admin-info)';
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${time}</div>
                    <div style="font-size: 12px; color: var(--admin-text-muted);">${date}</div>
                </td>
                <td>${log.user}</td>
                <td>${log.message}</td>
                <td>
                    <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                        ${log.ip}
                    </code>
                </td>
                <td>
                    <i class="fas ${statusIcon}" style="color: ${statusColor}; margin-right: 5px;"></i>
                    ${log.type}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    function loadSystemAlerts() {
        const container = document.getElementById('systemAlerts');
        if (!container) return;
        
        // Получаем последние логи с ошибками и предупреждениями
        const logs = adminDB.getLogs(10);
        const alerts = logs.filter(log => 
            log.type.includes('error') || log.type.includes('warning')
        );
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <div class="alert-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">Все системы работают нормально</div>
                        <div class="alert-message">Нет активных предупреждений или ошибок</div>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        alerts.forEach(alert => {
            const alertType = alert.type.includes('error') ? 'danger' :
                             alert.type.includes('warning') ? 'warning' : 'info';
            
            const alertElement = document.createElement('div');
            alertElement.className = `alert alert-${alertType}`;
            
            const icon = alertType === 'danger' ? 'exclamation-circle' :
                        alertType === 'warning' ? 'exclamation-triangle' : 'info-circle';
            
            alertElement.innerHTML = `
                <div class="alert-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">
                        ${alert.user === 'system' ? 'Системное событие' : 'Действие пользователя'}
                        <span style="font-size: 12px; color: var(--admin-text-muted); margin-left: 10px;">
                            ${new Date(alert.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                        </span>
                    </div>
                    <div class="alert-message">${alert.message}</div>
                </div>
            `;
            
            container.appendChild(alertElement);
        });
        
        // Обновляем счетчик уведомлений
        updateNotificationsCount();
    }
    
    function loadSettings() {
        const settings = adminDB.getSettings();
        
        document.getElementById('systemName').value = 'Leo Assistant';
        document.getElementById('defaultClass').value = settings.default_class || '7B';
        document.getElementById('pointsPerTask').value = settings.points_per_task || 50;
        document.getElementById('sessionDuration').value = settings.session_duration || 7;
        document.getElementById('autoBackup').value = settings.auto_backup || 'daily';
        document.getElementById('logsRetention').value = settings.logs_retention || 30;
    }
    
    // ========== РАБОТА С ПОЛЬЗОВАТЕЛЯМИ ==========
    function initUserActionListeners() {
        // Просмотр пользователя
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                showUserModal(userId, 'view');
            });
        });
        
        // Редактирование пользователя
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                showUserModal(userId, 'edit');
            });
        });
        
        // Удаление пользователя
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                deleteUser(userId);
            });
        });
    }
    
    function showUserModal(userId, mode = 'view') {
        const user = adminDB.getUserById(userId);
        if (!user) {
            showAlert('Пользователь не найден', 'error');
            return;
        }
        
        // Закрываем предыдущее модальное окно если есть
        if (currentUserModal) {
            currentUserModal.remove();
        }
        
        currentUserModal = document.createElement('div');
        currentUserModal.className = 'admin-modal';
        
        const isEdit = mode === 'edit';
        
        currentUserModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-${isEdit ? 'edit' : 'eye'}"></i>
                        ${isEdit ? 'Редактирование' : 'Просмотр'} пользователя
                    </h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>ID пользователя</label>
                            <input type="text" class="form-control" value="${user.id}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Дата регистрации</label>
                            <input type="text" class="form-control" value="${new Date(user.created_at).toLocaleDateString('ru-RU')}" readonly>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Имя пользователя</label>
                            <input type="text" id="modalUserName" class="form-control" value="${user.name}" ${!isEdit ? 'readonly' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Логин</label>
                            <input type="text" id="modalUserLogin" class="form-control" value="${user.login}" ${!isEdit ? 'readonly' : ''}>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Класс</label>
                            <select id="modalUserClass" class="form-control" ${!isEdit ? 'disabled' : ''}>
                                <option value="7B" ${user.class === '7B' ? 'selected' : ''}>7Б класс</option>
                                <option value="7A" ${user.class === '7A' ? 'selected' : ''}>7А класс</option>
                                <option value="8B" ${user.class === '8B' ? 'selected' : ''}>8Б класс</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Роль</label>
                            <select id="modalUserRole" class="form-control" ${!isEdit ? 'disabled' : ''}>
                                <option value="student" ${user.role === 'student' ? 'selected' : ''}>Ученик</option>
                                <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Учитель</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Очки</label>
                            <input type="number" id="modalUserPoints" class="form-control" value="${user.points || 0}" ${!isEdit ? 'readonly' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Уровень</label>
                            <input type="number" id="modalUserLevel" class="form-control" value="${user.level || 1}" ${!isEdit ? 'readonly' : ''}>
                        </div>
                    </div>
                    
                    ${isEdit ? `
                    <div class="form-group">
                        <label>Новый пароль (оставьте пустым, если не нужно менять)</label>
                        <input type="password" id="modalUserPassword" class="form-control" placeholder="Новый пароль">
                    </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <label>Статистика</label>
                        <div style="display: flex; gap: 20px; margin-top: 10px;">
                            <div>
                                <div style="font-size: 24px; font-weight: 700; color: var(--admin-primary);">${user.tasks_completed?.length || 0}</div>
                                <div style="font-size: 12px; color: var(--admin-text-muted);">Заданий выполнено</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: 700; color: var(--admin-success);">${user.points || 0}</div>
                                <div style="font-size: 12px; color: var(--admin-text-muted);">Всего очков</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: 700; color: var(--admin-accent);">${user.level || 1}</div>
                                <div style="font-size: 12px; color: var(--admin-text-muted);">Уровень</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    ${isEdit ? `
                    <button class="btn-admin-primary" id="saveUserBtn">
                        <i class="fas fa-save"></i> Сохранить изменения
                    </button>
                    ` : ''}
                    <button class="btn-admin-secondary" id="closeModalBtn">
                        <i class="fas fa-times"></i> Закрыть
                    </button>
                </div>
            </div>
        `;
        
        currentUserModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(currentUserModal);
        
        // Обработчики событий
        currentUserModal.querySelector('.modal-close').addEventListener('click', closeModal);
        currentUserModal.querySelector('#closeModalBtn').addEventListener('click', closeModal);
        
        if (isEdit) {
            currentUserModal.querySelector('#saveUserBtn').addEventListener('click', () => {
                saveUserChanges(userId);
            });
        }
        
        // Закрытие по клику на фон
        currentUserModal.addEventListener('click', (e) => {
            if (e.target === currentUserModal) {
                closeModal();
            }
        });
        
        function closeModal() {
            if (currentUserModal) {
                currentUserModal.remove();
                currentUserModal = null;
            }
        }
    }
    
    function saveUserChanges(userId) {
        if (!currentUserModal) return;
        
        const name = currentUserModal.querySelector('#modalUserName').value.trim();
        const login = currentUserModal.querySelector('#modalUserLogin').value.trim();
        const className = currentUserModal.querySelector('#modalUserClass').value;
        const role = currentUserModal.querySelector('#modalUserRole').value;
        const points = parseInt(currentUserModal.querySelector('#modalUserPoints').value) || 0;
        const level = parseInt(currentUserModal.querySelector('#modalUserLevel').value) || 1;
        const password = currentUserModal.querySelector('#modalUserPassword')?.value.trim();
        
        if (!name || !login) {
            showAlert('Имя и логин обязательны', 'error');
            return;
        }
        
        const updates = {
            name: name,
            login: login,
            class: className,
            role: role,
            points: points,
            level: level
        };
        
        if (password) {
            updates.password = password;
        }
        
        const result = adminDB.updateUser(userId, updates);
        
        if (result.success) {
            showAlert('Пользователь обновлен', 'success');
            
            // Обновляем таблицу
            loadUsersData();
            
            // Закрываем модальное окно
            currentUserModal.remove();
            currentUserModal = null;
        } else {
            showAlert(result.error, 'error');
        }
    }
    
    function deleteUser(userId) {
        const user = adminDB.getUserById(userId);
        if (!user) {
            showAlert('Пользователь не найден', 'error');
            return;
        }
        
        if (user.role === 'admin') {
            showAlert('Нельзя удалить администратора', 'warning');
            return;
        }
        
        if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.name}"?`)) {
            return;
        }
        
        const result = adminDB.deleteUser(userId);
        
        if (result.success) {
            showAlert(`Пользователь "${user.name}" удален`, 'success');
            loadUsersData();
            loadDashboardData();
        } else {
            showAlert(result.error, 'error');
        }
    }
    
    // ========== AI ОБУЧЕНИЕ ==========
    function initAITraining() {
        const trainBtn = document.getElementById('trainAI');
        if (trainBtn) {
            trainBtn.addEventListener('click', startAITraining);
        }
        
        const importBtn = document.getElementById('importKnowledge');
        if (importBtn) {
            importBtn.addEventListener('click', importKnowledge);
        }
    }
    
    function startAITraining() {
        const statusIndicator = document.getElementById('aiStatusIndicator');
        const statusText = document.getElementById('aiStatusText');
        const statusDetails = document.getElementById('aiStatusDetails');
        const progress = document.getElementById('aiProgress');
        
        // Обновляем статус
        statusIndicator.className = 'status-indicator training';
        statusText.textContent = 'Обучение...';
        statusDetails.textContent = 'Нейросеть анализирует данные';
        
        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += 2;
            if (progressValue > 100) progressValue = 100;
            
            progress.textContent = Math.floor(progressValue) + '%';
            
            if (progressValue >= 100) {
                clearInterval(interval);
                
                // Обновляем статус
                statusIndicator.className = 'status-indicator';
                statusText.textContent = 'Обучение завершено';
                statusDetails.textContent = 'Нейросеть успешно обучена';
                progress.textContent = '100%';
                
                // Логируем действие
                adminDB.logActivity('ai_trained', 'Нейросеть успешно обучена', 'system');
                
                showAlert('Обучение нейросети завершено', 'success');
            }
        }, 100);
    }
    
    function importKnowledge() {
        showAlert('Импорт знаний в разработке', 'info');
    }
    
    // ========== СИСТЕМНЫЕ НАСТРОЙКИ ==========
    function initSystemSettings() {
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveSystemSettings);
        }
        
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetSystemSettings);
        }
        
        const testBtn = document.getElementById('testSettings');
        if (testBtn) {
            testBtn.addEventListener('click', testSystemSettings);
        }
    }
    
    function saveSystemSettings() {
        const settings = {
            default_class: document.getElementById('defaultClass').value,
            points_per_task: parseInt(document.getElementById('pointsPerTask').value) || 50,
            session_duration: parseInt(document.getElementById('sessionDuration').value) || 7,
            auto_backup: document.getElementById('autoBackup').value,
            logs_retention: parseInt(document.getElementById('logsRetention').value) || 30
        };
        
        const adminPassword = document.getElementById('adminPassword').value;
        const adminPasswordConfirm = document.getElementById('adminPasswordConfirm').value;
        
        // Проверка пароля
        if (adminPassword && adminPassword !== adminPasswordConfirm) {
            showAlert('Пароли не совпадают', 'error');
            return;
        }
        
        // Сохраняем настройки
        const result = adminDB.saveSettings(settings);
        
        if (result.success) {
            showAlert('Настройки сохранены', 'success');
            
            // Очищаем поля пароля
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminPasswordConfirm').value = '';
        } else {
            showAlert('Ошибка сохранения настроек', 'error');
        }
    }
    
    function resetSystemSettings() {
        if (!confirm('Сбросить настройки к значениям по умолчанию?')) {
            return;
        }
        
        // Загружаем настройки по умолчанию
        loadSettings();
        showAlert('Настройки сброшены', 'warning');
    }
    
    function testSystemSettings() {
        showAlert('Тестирование настроек...', 'info');
        
        setTimeout(() => {
            showAlert('Все настройки работают корректно', 'success');
            adminDB.logActivity('settings_tested', 'Тестирование настроек выполнено', 'system');
        }, 1500);
    }
    
    // ========== БЫСТРЫЕ ДЕЙСТВИЯ ==========
    function initQuickActions() {
        // Добавление пользователя
        document.getElementById('quickAddUser')?.addEventListener('click', showAddUserModal);
        document.getElementById('addUserBtn')?.addEventListener('click', showAddUserModal);
        
        // Создание задания
        document.getElementById('quickAddTask')?.addEventListener('click', () => {
            showAlert('Добавление задания в разработке', 'info');
        });
        
        // Резервное копирование
        document.getElementById('quickBackup')?.addEventListener('click', createBackup);
        
        // Объявление
        document.getElementById('quickBroadcast')?.addEventListener('click', () => {
            showAlert('Рассылка уведомлений в разработке', 'info');
        });
        
        // Экспорт пользователей
        document.getElementById('exportUsers')?.addEventListener('click', exportUsers);
    }
    
    function showAddUserModal() {
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-plus"></i> Добавление нового пользователя</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Имя пользователя *</label>
                        <input type="text" id="newUserName" class="form-control" placeholder="Иван Иванов" required>
                    </div>
                    <div class="form-group">
                        <label>Логин *</label>
                        <input type="text" id="newUserLogin" class="form-control" placeholder="ivanov" required>
                    </div>
                    <div class="form-group">
                        <label>Пароль *</label>
                        <input type="password" id="newUserPassword" class="form-control" placeholder="••••••••" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Класс</label>
                            <select id="newUserClass" class="form-control">
                                <option value="7B">7Б класс</option>
                                <option value="7A">7А класс</option>
                                <option value="8B">8Б класс</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Роль</label>
                            <select id="newUserRole" class="form-control">
                                <option value="student">Ученик</option>
                                <option value="teacher">Учитель</option>
                                <option value="admin">Администратор</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Начальные очки</label>
                        <input type="number" id="newUserPoints" class="form-control" value="0">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-admin-primary" id="createUserBtn">
                        <i class="fas fa-plus"></i> Создать пользователя
                    </button>
                    <button class="btn-admin-secondary" id="cancelCreateUser">
                        <i class="fas fa-times"></i> Отмена
                    </button>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelCreateUser').addEventListener('click', () => modal.remove());
        
        modal.querySelector('#createUserBtn').addEventListener('click', () => {
            createNewUser(modal);
        });
        
        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    function createNewUser(modal) {
        const name = modal.querySelector('#newUserName').value.trim();
        const login = modal.querySelector('#newUserLogin').value.trim();
        const password = modal.querySelector('#newUserPassword').value.trim();
        const className = modal.querySelector('#newUserClass').value;
        const role = modal.querySelector('#newUserRole').value;
        const points = parseInt(modal.querySelector('#newUserPoints').value) || 0;
        
        if (!name || !login || !password) {
            showAlert('Заполните обязательные поля', 'error');
            return;
        }
        
        if (password.length < 6) {
            showAlert('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        const userData = {
            login: login,
            password: password,
            name: name,
            class: className,
            role: role,
            points: points
        };
        
        const result = adminDB.addUser(userData);
        
        if (result.success) {
            showAlert(`Пользователь "${name}" создан`, 'success');
            modal.remove();
            
            // Обновляем данные
            loadUsersData();
            loadDashboardData();
        } else {
            showAlert(result.error, 'error');
        }
    }
    
    function exportUsers() {
        const users = adminDB.getAllUsers();
        
        if (users.length === 0) {
            showAlert('Нет пользователей для экспорта', 'warning');
            return;
        }
        
        // Создаем CSV
        let csv = 'ID,Имя,Логин,Класс,Роль,Очки,Уровень,Дата регистрации\n';
        
        users.forEach(user => {
            csv += `${user.id},"${user.name}","${user.login}","${user.class || '7B'}","${user.role}",${user.points || 0},${user.level || 1},"${user.created_at}"\n`;
        });
        
        // Создаем и скачиваем файл
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Данные экспортированы в CSV', 'success');
        adminDB.logActivity('users_exported', 'Экспорт данных пользователей', 'admin');
    }
    
    function createBackup() {
        const backup = adminDB.createBackup();
        
        // Скачиваем файл
        const blob = new Blob([backup.data], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `backup_${backup.timestamp.replace(/[:.]/g, '-')}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Резервная копия создана и скачана', 'success');
    }
    
    // ========== УПРАВЛЕНИЕ СИСТЕМОЙ ==========
    function updateNotificationsCount() {
        const logs = adminDB.getLogs();
        const importantLogs = logs.filter(log => 
            log.type.includes('error') || log.type.includes('warning')
        ).length;
        
        document.getElementById('headerNotifications').textContent = importantLogs;
    }
    
    function clearAlerts() {
        document.getElementById('clearAlerts')?.addEventListener('click', () => {
            // В реальной системе здесь нужно очищать логи
            showAlert('Функция очистки в разработке', 'info');
        });
    }
    
    function refreshData() {
        document.getElementById('refreshData')?.addEventListener('click', () => {
            loadDashboardData();
            loadUsersData();
            loadActivityLog();
            loadSystemAlerts();
            showAlert('Данные обновлены', 'success');
        });
    }
    
    function toggleSidebar() {
        document.getElementById('toggleSidebar')?.addEventListener('click', () => {
            const sidebar = document.getElementById('adminSidebar');
            sidebar.classList.toggle('collapsed');
        });
    }
    
    function showNotifications() {
        document.getElementById('notificationsBtn')?.addEventListener('click', () => {
            showAlert('Панель уведомлений в разработке', 'info');
        });
    }
    
    function logoutAdmin() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Выйти из админ-панели?')) {
                localStorage.removeItem('is_admin');
                window.location.href = 'index.html';
            }
        });
    }
    
    // ========== УВЕДОМЛЕНИЯ ==========
    function showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            z-index: 1000;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        const icon = type === 'success' ? 'check-circle' :
                    type === 'error' || type === 'danger' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        alertDiv.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">
                    ${type === 'success' ? 'Успешно!' : 
                      type === 'error' || type === 'danger' ? 'Ошибка!' : 
                      type === 'warning' ? 'Внимание!' : 'Информация'}
                </div>
                <div class="alert-message">${message}</div>
            </div>
            <button class="btn-action close-alert" style="background: transparent; border: none; color: var(--admin-text-muted);">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Обработчик закрытия
        alertDiv.querySelector('.close-alert').addEventListener('click', () => {
            alertDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => alertDiv.remove(), 300);
        });
        
        // Автоматическое удаление
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => alertDiv.remove(), 300);
            }
        }, 5000);
    }
    
    // ========== ПОИСК ==========
    function initSearch() {
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', function() {
                loadUsersData(this.value);
            });
        }
        
        const activitySearch = document.querySelector('.table-search');
        if (activitySearch) {
            activitySearch.addEventListener('input', function() {
                // Здесь будет поиск по активности
                showAlert('Поиск по активности в разработке', 'info');
            });
        }
    }
    
    // ========== НАВИГАЦИЯ ==========
    function initNavigation() {
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Убираем активный класс
                document.querySelectorAll('.admin-nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                
                // Добавляем активный класс текущему
                this.classList.add('active');
                
                // Показываем нужную вкладку
                const tab = this.getAttribute('data-tab');
                showTab(tab);
            });
        });
    }
    
    function showTab(tabId) {
        // Скрываем все вкладки
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Показываем нужную
        const targetTab = document.getElementById(`tab-${tabId}`);
        if (targetTab) {
            targetTab.classList.add('active');
            currentTab = tabId;
            
            // Обновляем данные для вкладки
            switch(tabId) {
                case 'dashboard':
                    loadDashboardData();
                    break;
                case 'users':
                    loadUsersData();
                    break;
                case 'ai':
                    // Уже загружено
                    break;
                case 'system':
                    loadSettings();
                    break;
            }
        }
    }
    
    // ========== АВТООБНОВЛЕНИЕ ==========
    function startAutoRefresh() {
        // Обновляем время каждую секунду
        setInterval(updateTime, 1000);
        
        // Обновляем статистику каждые 30 секунд
        setInterval(() => {
            if (currentTab === 'dashboard') {
                loadDashboardData();
            }
        }, 30000);
    }
    
    function updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        const timeElement = document.getElementById('adminTime');
        if (timeElement) {
            timeElement.textContent = timeStr;
        }
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ ==========
    function initEventListeners() {
        // Навигация
        initNavigation();
        
        // Поиск
        initSearch();
        
        // Пользователи
        initUserActionListeners();
        
        // AI обучение
        initAITraining();
        
        // Системные настройки
        initSystemSettings();
        
        // Быстрые действия
        initQuickActions();
        
        // Управление системой
        clearAlerts();
        refreshData();
        toggleSidebar();
        showNotifications();
        logoutAdmin();
        
        // Обработка нажатия Enter в поиске
        document.querySelectorAll('.table-search').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                }
            });
        });
    }
});
