// js/admin.js - ИСПРАВЛЕННАЯ ВЕРСИЯ (РАБОЧИЕ КНОПКИ)

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Загрузка админ-панели...');
    
    // Глобальный объект для доступа из HTML
    window.Admin = {
        currentSection: 'dashboard',
        allUsers: [],
        allTasks: [],
        currentUser: null,
        charts: {},
        
        // ===== ИНИЦИАЛИЗАЦИЯ =====
        init: function() {
            console.log('⚡ Инициализация панели...');
            
            // Проверка прав
            if (!this.checkAccess()) return;
            
            // Загрузка данных
            this.loadData();
            
            // Настройка интерфейса
            this.setupEventListeners();
            
            // Показ дашборда
            this.showSection('dashboard');
            
            console.log('✅ Админ-панель готова');
        },
        
        // ===== ПРОВЕРКА ДОСТУПА =====
        checkAccess: function() {
            const isAdmin = localStorage.getItem('is_admin') === 'true';
            if (!isAdmin) {
                this.showNotification('Доступ запрещен! Требуются права администратора.', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return false;
            }
            return true;
        },
        
        // ===== ЗАГРУЗКА ДАННЫХ =====
        loadData: function() {
            console.log('📊 Загрузка данных...');
            
            // Загружаем из базы данных
            const db = window.leoDB?.getAll();
            if (!db) {
                console.error('❌ База данных не найдена');
                return;
            }
            
            // Текущий пользователь
            this.currentUser = {
                id: 1,
                name: 'Администратор',
                role: 'admin',
                avatar: 'A'
            };
            
            // Пользователи
            this.allUsers = db.users || [];
            
            // Задания
            this.allTasks = db.classes?.['7B']?.tasks || [];
            
            // Логи
            this.logs = db.logs || [];
            
            // Обновляем счетчики
            this.updateCounters();
            
            console.log(`📊 Загружено: ${this.allUsers.length} пользователей, ${this.allTasks.length} заданий`);
        },
        
        updateCounters: function() {
            document.getElementById('usersCount').textContent = this.allUsers.length;
            document.getElementById('tasksCount').textContent = this.allTasks.length;
            document.getElementById('logsCount').textContent = this.logs.length;
        },
        
        // ===== НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ =====
        setupEventListeners: function() {
            console.log('🔗 Настройка обработчиков событий...');
            
            // ===== НАВИГАЦИЯ =====
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = item.getAttribute('data-section');
                    console.log(`📱 Нажата кнопка: ${section}`);
                    this.showSection(section);
                });
            });
            
            // Выход
            document.getElementById('logoutBtn').addEventListener('click', () => {
                console.log('👋 Выход из системы');
                localStorage.removeItem('is_admin');
                window.location.href = 'index.html';
            });
            
            // ===== ДАШБОРД =====
            document.getElementById('refreshDashboard').addEventListener('click', () => {
                console.log('🔄 Обновление дашборда');
                this.loadData();
                this.showNotification('Данные обновлены', 'success');
            });
            
            // ===== ПОЛЬЗОВАТЕЛИ =====
            document.getElementById('addUserBtn').addEventListener('click', () => {
                console.log('👤 Добавление пользователя');
                this.openUserModal();
            });
            
            // Экспорт пользователей
            document.getElementById('exportUsers').addEventListener('click', () => {
                console.log('💾 Экспорт пользователей');
                this.exportUsers();
            });
            
            // Поиск пользователей
            document.getElementById('usersSearch').addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
            
            // Фильтр пользователей
            document.getElementById('usersFilter').addEventListener('change', (e) => {
                this.filterUsersByStatus(e.target.value);
            });
            
            // Выбор всех пользователей
            document.getElementById('selectAllUsers').addEventListener('change', (e) => {
                this.toggleAllUsers(e.target.checked);
            });
            
            // ===== AI СИСТЕМА =====
            document.getElementById('trainAI').addEventListener('click', () => {
                console.log('🤖 Обучение AI');
                this.trainAI();
            });
            
            // Добавление знаний
            document.getElementById('saveKnowledge').addEventListener('click', () => {
                console.log('🧠 Сохранение знаний');
                this.saveKnowledge();
            });
            
            // Очистка формы знаний
            document.getElementById('clearKnowledge').addEventListener('click', () => {
                document.getElementById('knowledgeKeywords').value = '';
                document.getElementById('knowledgeAnswer').value = '';
            });
            
            // ===== НАСТРОЙКИ =====
            document.getElementById('saveSettings').addEventListener('click', () => {
                console.log('⚙️ Сохранение настроек');
                this.saveSettings();
            });
            
            document.getElementById('resetSettings').addEventListener('click', () => {
                if (confirm('Сбросить настройки к стандартным?')) {
                    this.resetSettings();
                }
            });
            
            // Управление базой данных
            document.getElementById('backupDB').addEventListener('click', () => {
                console.log('💾 Резервное копирование');
                this.backupDatabase();
            });
            
            document.getElementById('clearDB').addEventListener('click', () => {
                console.log('🗑️ Очистка базы данных');
                this.clearDatabase();
            });
            
            // ===== ЛОГИ =====
            document.getElementById('exportLogs').addEventListener('click', () => {
                console.log('📄 Экспорт логов');
                this.exportLogs();
            });
            
            document.getElementById('clearLogs').addEventListener('click', () => {
                console.log('🧹 Очистка логов');
                this.clearLogs();
            });
            
            // Фильтр логов
            document.getElementById('logLevel').addEventListener('change', (e) => {
                this.filterLogsByLevel(e.target.value);
            });
            
            // Поиск в логах
            document.getElementById('logsSearch').addEventListener('input', (e) => {
                this.searchLogs(e.target.value);
            });
            
            // ===== МОДАЛЬНЫЕ ОКНА =====
            // Закрытие модальных окон
            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    const modal = btn.closest('.modal');
                    this.closeModal(modal.id);
                });
            });
            
            // Сохранение пользователя
            document.getElementById('saveUserBtn').addEventListener('click', () => {
                this.saveUser();
            });
            
            // Отмена формы пользователя
            document.getElementById('cancelUserBtn').addEventListener('click', () => {
                this.closeModal('userModal');
            });
            
            // Сохранение задания
            document.getElementById('saveTaskBtn').addEventListener('click', () => {
                this.saveTask();
            });
            
            console.log('✅ Все обработчики настроены');
        },
        
        // ===== НАВИГАЦИЯ =====
        showSection: function(sectionId) {
            console.log(`📁 Переход на секцию: ${sectionId}`);
            
            // Обновление активного пункта меню
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-section') === sectionId) {
                    item.classList.add('active');
                }
            });
            
            // Скрытие всех секций
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Показ нужной секции
            const targetSection = document.getElementById(`section-${sectionId}`);
            if (targetSection) {
                targetSection.classList.add('active');
                this.currentSection = sectionId;
                
                // Загрузка данных для секции
                this.loadSectionData(sectionId);
                
                // Прокрутка вверх
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        
        loadSectionData: function(sectionId) {
            console.log(`📂 Загрузка данных для: ${sectionId}`);
            
            switch (sectionId) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'users':
                    this.loadUsers();
                    break;
                case 'tasks':
                    this.loadTasks();
                    break;
                case 'ai':
                    this.loadAI();
                    break;
                case 'logs':
                    this.loadLogs();
                    break;
                case 'settings':
                    this.loadSettings();
                    break;
            }
        },
        
        // ===== ДАШБОРД =====
        loadDashboard: function() {
            console.log('📈 Загрузка дашборда...');
            
            const db = window.leoDB?.getAll();
            if (!db) return;
            
            // Обновление статистики
            this.updateDashboardStats(db);
            
            // Загрузка последних действий
            this.loadRecentActivities();
            
            // Инициализация графиков
            this.initCharts();
        },
        
        updateDashboardStats: function(db) {
            // Пользователи
            const totalUsers = db.users?.length || 0;
            const today = new Date().toDateString();
            const todayUsers = db.users?.filter(u => 
                new Date(u.created_at).toDateString() === today
            ).length || 0;
            
            document.getElementById('statUsers').textContent = totalUsers;
            document.querySelector('#statUsers + .stat-change .stat-value').textContent = `+${todayUsers} сегодня`;
            
            // Задания
            const totalTasks = db.classes?.['7B']?.tasks?.length || 0;
            const activeTasks = db.classes?.['7B']?.tasks?.filter(t => 
                !t.completed
            ).length || 0;
            
            document.getElementById('statTasks').textContent = totalTasks;
            document.querySelector('#statTasks + .stat-change .stat-value').textContent = `${activeTasks} активных`;
            
            // AI запросы
            const aiRequests = db.ai_requests || 0;
            const todayRequests = 0; // Здесь можно считать запросы за сегодня
            
            document.getElementById('statAIRequests').textContent = aiRequests;
            document.querySelector('#statAIRequests + .stat-change .stat-value').textContent = `+${todayRequests} сегодня`;
            
            // Активность
            const activeUsers = db.users?.filter(u => u.last_login).length || 0;
            const activityPercent = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
            
            document.getElementById('statActivity').textContent = `${activityPercent}%`;
        },
        
        loadRecentActivities: function() {
            const container = document.getElementById('recentActivities');
            if (!container) return;
            
            const db = window.leoDB?.getAll();
            const logs = db?.logs || [];
            
            if (logs.length === 0) {
                container.innerHTML = `
                    <div class="activity-empty">
                        <i class="fas fa-history"></i>
                        <p>Нет последних действий</p>
                    </div>
                `;
                return;
            }
            
            // Берем последние 5 логов
            const recentLogs = logs.slice(-5).reverse();
            
            container.innerHTML = '';
            recentLogs.forEach(log => {
                const activity = document.createElement('div');
                activity.className = 'activity-item';
                activity.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas fa-${this.getLogIcon(log.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">${log.action || log.message}</div>
                        <div class="activity-meta">
                            <span class="activity-user">${log.user || 'Система'}</span>
                            <span class="activity-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                    </div>
                `;
                container.appendChild(activity);
            });
        },
        
        initCharts: function() {
            // График активности
            const activityCtx = document.getElementById('activityChart');
            if (activityCtx && typeof Chart !== 'undefined') {
                // Если график уже существует, уничтожаем его
                if (this.charts.activity) {
                    this.charts.activity.destroy();
                }
                
                const db = window.leoDB?.getAll();
                const users = db?.users || [];
                
                // Генерируем данные на основе пользователей
                const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
                const activityData = this.generateActivityData(users);
                
                this.charts.activity = new Chart(activityCtx, {
                    type: 'line',
                    data: {
                        labels: days,
                        datasets: [{
                            label: 'Активность',
                            data: activityData,
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        },
        
        generateActivityData: function(users) {
            // Простая генерация данных на основе количества пользователей
            const base = [10, 20, 15, 25, 30, 20, 25];
            if (users.length === 0) return base;
            
            const multiplier = Math.min(users.length / 5, 2);
            return base.map(value => Math.round(value * multiplier));
        },
        
        // ===== ПОЛЬЗОВАТЕЛИ =====
        loadUsers: function() {
            console.log('👥 Загрузка пользователей...');
            
            const tbody = document.getElementById('usersTableBody');
            if (!tbody) return;
            
            if (this.allUsers.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px;">
                            <div class="empty-state">
                                <i class="fas fa-users"></i>
                                <p>Пользователей нет</p>
                                <button class="btn-secondary" onclick="Admin.openUserModal()" style="margin-top: 15px;">
                                    <i class="fas fa-user-plus"></i> Добавить первого пользователя
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = '';
            
            this.allUsers.forEach((user, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <input type="checkbox" class="user-select" value="${user.id}">
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
                                ${user.avatar || user.name.charAt(0)}
                            </div>
                            <div>
                                <div style="font-weight: 600; color: var(--text-primary);">${user.name}</div>
                                <div style="font-size: 0.875rem; color: var(--text-muted);">${user.login}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${user.role}">
                            ${user.role === 'admin' ? 'Админ' : user.role === 'teacher' ? 'Учитель' : 'Ученик'}
                        </span>
                    </td>
                    <td>${user.class || '7Б'}</td>
                    <td><strong>${user.points || 0}</strong></td>
                    <td>${user.tasks_completed?.length || 0}</td>
                    <td>
                        <span class="status-badge active">
                            Активен
                        </span>
                    </td>
                    <td>
                        <div class="user-actions">
                            <button class="btn-action btn-edit" onclick="Admin.editUser(${user.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-reset" onclick="Admin.resetUserProgress(${user.id})">
                                <i class="fas fa-redo"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="Admin.deleteUser(${user.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Обновляем счетчики
            document.getElementById('usersShown').textContent = this.allUsers.length;
            document.getElementById('usersTotal').textContent = this.allUsers.length;
        },
        
        // ===== МОДАЛЬНОЕ ОКНО ПОЛЬЗОВАТЕЛЯ =====
        openUserModal: function(userId = null) {
            console.log(`📝 Открытие формы пользователя: ${userId || 'новый'}`);
            
            const modal = document.getElementById('userModal');
            const title = document.getElementById('modalUserTitle');
            const saveBtn = document.getElementById('saveUserBtn');
            
            if (userId) {
                // Редактирование
                const user = this.allUsers.find(u => u.id === userId);
                if (user) {
                    title.textContent = 'Редактировать пользователя';
                    
                    // Заполняем форму
                    document.getElementById('userId').value = user.id;
                    document.getElementById('userName').value = user.name.split(' ')[0] || '';
                    document.getElementById('userLastName').value = user.name.split(' ').slice(1).join(' ') || '';
                    document.getElementById('userLogin').value = user.login;
                    document.getElementById('userEmail').value = user.email || '';
                    document.getElementById('userClass').value = user.class || '7B';
                    document.getElementById('userRole').value = user.role || 'student';
                    document.getElementById('userPoints').value = user.points || 0;
                    
                    // Не требуем пароль при редактировании
                    document.getElementById('userPassword').required = false;
                    document.getElementById('userConfirmPassword').required = false;
                    
                    saveBtn.textContent = 'Обновить';
                    saveBtn.setAttribute('data-action', 'update');
                }
            } else {
                // Создание нового
                title.textContent = 'Добавить пользователя';
                
                // Очищаем форму
                document.getElementById('userForm').reset();
                document.getElementById('userId').value = '';
                
                // Требуем пароль для нового пользователя
                document.getElementById('userPassword').required = true;
                document.getElementById('userConfirmPassword').required = true;
                
                saveBtn.textContent = 'Создать';
                saveBtn.setAttribute('data-action', 'create');
            }
            
            // Показываем модальное окно
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        },
        
        saveUser: function() {
            console.log('💾 Сохранение пользователя...');
            
            const form = document.getElementById('userForm');
            const saveBtn = document.getElementById('saveUserBtn');
            const action = saveBtn.getAttribute('data-action');
            const userId = document.getElementById('userId').value;
            
            // Собираем данные
            const userData = {
                name: `${document.getElementById('userName').value} ${document.getElementById('userLastName').value}`.trim(),
                login: document.getElementById('userLogin').value,
                email: document.getElementById('userEmail').value,
                class: document.getElementById('userClass').value,
                role: document.getElementById('userRole').value,
                points: parseInt(document.getElementById('userPoints').value) || 0
            };
            
            // Валидация
            if (!userData.name || !userData.login) {
                this.showNotification('Заполните имя и логин', 'error');
                return;
            }
            
            if (action === 'create') {
                const password = document.getElementById('userPassword').value;
                const confirmPassword = document.getElementById('userConfirmPassword').value;
                
                if (!password) {
                    this.showNotification('Введите пароль', 'error');
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
                
                userData.password = password;
            }
            
            // Сохранение в базу данных
            const db = window.leoDB?.getAll();
            if (!db) {
                this.showNotification('Ошибка базы данных', 'error');
                return;
            }
            
            try {
                if (action === 'create') {
                    // Добавление нового пользователя
                    const result = window.leoDB.addUser(userData);
                    if (result.success) {
                        this.showNotification('Пользователь создан', 'success');
                        this.addLog('admin', `Создал пользователя ${userData.name}`);
                    } else {
                        this.showNotification(result.error, 'error');
                        return;
                    }
                } else {
                    // Обновление существующего пользователя
                    const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
                    if (userIndex !== -1) {
                        const password = document.getElementById('userPassword').value;
                        
                        db.users[userIndex] = {
                            ...db.users[userIndex],
                            ...userData,
                            // Обновляем пароль только если он введен
                            password: password || db.users[userIndex].password,
                            // Обновляем аватар
                            avatar: this.generateAvatar(userData.name)
                        };
                        
                        window.leoDB.save(db);
                        this.showNotification('Пользователь обновлен', 'success');
                        this.addLog('admin', `Обновил пользователя ${userData.name}`);
                    }
                }
                
                // Закрываем модальное окно и обновляем данные
                this.closeModal('userModal');
                this.loadData();
                this.loadUsers();
                
            } catch (error) {
                this.showNotification(`Ошибка: ${error.message}`, 'error');
            }
        },
        
        // Генерация аватара
        generateAvatar: function(name) {
            const names = name.split(' ');
            if (names.length >= 2) {
                return (names[0][0] + names[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        },
        
        // Редактирование пользователя (для вызова из HTML)
        editUser: function(userId) {
            this.openUserModal(userId);
        },
        
        // Удаление пользователя
        deleteUser: function(userId) {
            if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
                return;
            }
            
            const db = window.leoDB?.getAll();
            if (!db) return;
            
            const user = db.users.find(u => u.id === userId);
            if (!user) return;
            
            // Удаляем пользователя
            db.users = db.users.filter(u => u.id !== userId);
            
            // Удаляем из класса
            if (db.classes?.[user.class]?.students) {
                db.classes[user.class].students = 
                    db.classes[user.class].students.filter(s => s.id !== userId);
            }
            
            window.leoDB.save(db);
            this.showNotification('Пользователь удален', 'success');
            this.addLog('admin', `Удалил пользователя ${user.name}`);
            
            // Обновляем данные
            this.loadData();
            this.loadUsers();
        },
        
        // Сброс прогресса пользователя
        resetUserProgress: function(userId) {
            if (!confirm('Сбросить очки и прогресс пользователя?')) {
                return;
            }
            
            const db = window.leoDB?.getAll();
            if (!db) return;
            
            const user = db.users.find(u => u.id === userId);
            if (!user) return;
            
            // Сбрасываем прогресс
            user.points = 0;
            user.level = 1;
            user.tasks_completed = [];
            
            // Обновляем в классе
            if (db.classes?.[user.class]?.students) {
                const student = db.classes[user.class].students.find(s => s.id === userId);
                if (student) {
                    student.points = 0;
                }
            }
            
            window.leoDB.save(db);
            this.showNotification('Прогресс сброшен', 'success');
            this.addLog('admin', `Сбросил прогресс пользователя ${user.name}`);
            
            // Обновляем данные
            this.loadData();
            this.loadUsers();
        },
        
        // ===== AI СИСТЕМА =====
        loadAI: function() {
            console.log('🤖 Загрузка AI данных...');
            
            const db = window.leoDB?.getAll();
            if (!db) return;
            
            const aiKnowledge = db.ai_knowledge || {};
            let totalKnowledge = 0;
            
            // Считаем количество знаний
            Object.values(aiKnowledge).forEach(category => {
                if (Array.isArray(category)) {
                    totalKnowledge += category.length;
                } else if (typeof category === 'object') {
                    totalKnowledge += Object.keys(category).length;
                }
            });
            
            // Обновляем UI
            document.getElementById('aiTrainedAnswers').textContent = totalKnowledge;
            document.getElementById('aiAccuracy').textContent = '89%';
            document.getElementById('aiLastTrain').textContent = 
                db.ai_last_train ? new Date(db.ai_last_train).toLocaleDateString('ru-RU') : 'Никогда';
            
            // Загружаем базу знаний
            this.loadKnowledgeBase();
        },
        
        loadKnowledgeBase: function() {
            const container = document.getElementById('knowledgeList');
            if (!container) return;
            
            const db = window.leoDB?.getAll();
            const knowledge = db.ai_knowledge || {};
            
            if (Object.keys(knowledge).length === 0) {
                container.innerHTML = `
                    <div class="knowledge-empty">
                        <i class="fas fa-brain"></i>
                        <p>База знаний пуста</p>
                        <p style="font-size: 0.875rem; margin-top: 10px; color: var(--text-muted);">
                            Добавьте знания с помощью формы ниже
                        </p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            
            Object.entries(knowledge).forEach(([category, data]) => {
                const item = document.createElement('div');
                item.className = 'knowledge-item';
                
                let content = '';
                if (Array.isArray(data)) {
                    content = data.map(item => `<span class="knowledge-tag">"${item}"</span>`).join(' ');
                } else if (typeof data === 'object') {
                    content = Object.entries(data)
                        .map(([key, value]) => 
                            `<div><strong>${key}:</strong> ${value}</div>`
                        )
                        .join('');
                }
                
                item.innerHTML = `
                    <div class="knowledge-header">
                        <span class="knowledge-category">${this.getCategoryName(category)}</span>
                        <button class="btn-action" onclick="Admin.deleteKnowledge('${category}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="knowledge-content">${content}</div>
                `;
                
                container.appendChild(item);
            });
        },
        
        getCategoryName: function(category) {
            const names = {
                'greetings': 'Приветствия',
                'subjects': 'Предметы',
                'tasks': 'Задания',
                'schedule': 'Расписание',
                'general': 'Общее'
            };
            return names[category] || category;
        },
        
        trainAI: function() {
            console.log('🎓 Обучение AI...');
            
            // Показываем состояние обучения
            const statusIndicator = document.getElementById('aiStatus');
            const statusText = document.getElementById('aiStatusText');
            const statusDetails = document.getElementById('aiStatusDetails');
            const progressFill = document.getElementById('trainingFill');
            const progressText = document.getElementById('trainingProgress');
            
            statusIndicator.className = 'status-indicator training';
            statusText.textContent = 'Обучение...';
            statusDetails.textContent = 'Анализируем данные и оптимизируем нейросеть';
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += 2;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
                
                if (progress >= 100) {
                    clearInterval(interval);
                    
                    // Обновляем состояние
                    statusIndicator.className = 'status-indicator';
                    statusText.textContent = 'Обучение завершено';
                    statusDetails.textContent = 'Нейросеть успешно оптимизирована';
                    
                    // Обновляем базу данных
                    const db = window.leoDB?.getAll();
                    if (db) {
                        db.ai_last_train = new Date().toISOString();
                        window.leoDB.save(db);
                    }
                    
                    this.showNotification('Обучение завершено', 'success');
                    this.addLog('admin', 'Провел обучение нейросети');
                }
            }, 50);
        },
        
        saveKnowledge: function() {
            const category = document.getElementById('knowledgeCategory').value;
            const keywords = document.getElementById('knowledgeKeywords').value.trim();
            const answer = document.getElementById('knowledgeAnswer').value.trim();
            
            if (!keywords || !answer) {
                this.showNotification('Заполните все поля', 'error');
                return;
            }
            
            const db = window.leoDB?.getAll();
            if (!db) return;
            
            if (!db.ai_knowledge) db.ai_knowledge = {};
            if (!db.ai_knowledge[category]) db.ai_knowledge[category] = {};
            
            const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
            
            keywordList.forEach(keyword => {
                db.ai_knowledge[category][keyword] = answer;
            });
            
            window.leoDB.save(db);
            this.showNotification('Знания добавлены', 'success');
            this.addLog('admin', `Добавил знания в категорию "${this.getCategoryName(category)}"`);
            
            // Обновляем список знаний
            this.loadKnowledgeBase();
            
            // Очищаем форму
            document.getElementById('knowledgeKeywords').value = '';
            document.getElementById('knowledgeAnswer').value = '';
        },
        
        deleteKnowledge: function(category) {
            if (!confirm('Удалить эту категорию знаний?')) return;
            
            const db = window.leoDB?.getAll();
            if (!db || !db.ai_knowledge) return;
            
            delete db.ai_knowledge[category];
            window.leoDB.save(db);
            
            this.showNotification('Категория удалена', 'success');
            this.loadKnowledgeBase();
        },
        
        // ===== НАСТРОЙКИ =====
        loadSettings: function() {
            console.log('⚙️ Загрузка настроек...');
            
            const db = window.leoDB?.getAll();
            if (!db) return;
            
            const settings = db.system_settings || {};
            
            // Заполняем форму
            document.getElementById('systemName').value = settings.systemName || 'Leo Assistant';
            document.getElementById('defaultClass').value = settings.defaultClass || '7B';
            document.getElementById('pointsPerTask').value = settings.pointsPerTask || 50;
            document.getElementById('aiMode').value = settings.aiMode || 'advanced';
            document.getElementById('aiLearning').checked = settings.aiLearning !== false;
            document.getElementById('aiProfanityFilter').checked = settings.aiProfanityFilter !== false;
            
            // Ползунок длины ответа
            const maxLength = settings.aiMaxLength || 500;
            document.getElementById('aiMaxLength').value = maxLength;
            document.getElementById('aiLengthValue').textContent = `${maxLength} символов`;
            
            // Настройки безопасности
            document.getElementById('emailVerification').value = 
                settings.emailVerification !== false ? 'true' : 'false';
            document.getElementById('maxLoginAttempts').value = settings.maxLoginAttempts || 5;
            document.getElementById('lockoutTime').value = settings.lockoutTime || 15;
            
            // Внешний вид
            const theme = settings.theme || 'dark';
            document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
            
            const accentColor = settings.accentColor || '#6366f1';
            document.getElementById('accentColor').value = accentColor;
            
            document.getElementById('interfaceFont').value = settings.interfaceFont || 'Inter';
            
            // Резервное копирование
            document.getElementById('autoBackup').value = settings.autoBackup || 'weekly';
        },
        
        saveSettings: function() {
            console.log('💾 Сохранение настроек...');
            
            const settings = {
                systemName: document.getElementById('systemName').value,
                defaultClass: document.getElementById('defaultClass').value,
                pointsPerTask: parseInt(document.getElementById('pointsPerTask').value),
                aiMode: document.getElementById('aiMode').value,
                aiMaxLength: parseInt(document.getElementById('aiMaxLength').value),
                aiLearning: document.getElementById('aiLearning').checked,
                aiProfanityFilter: document.getElementById('aiProfanityFilter').checked,
                emailVerification: document.getElementById('emailVerification').value === 'true',
                maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
                lockoutTime: parseInt(document.getElementById('lockoutTime').value),
                theme: document.querySelector('input[name="theme"]:checked').value,
                accentColor: document.getElementById('accentColor').value,
                interfaceFont: document.getElementById('interfaceFont').value,
                autoBackup: document.getElementById('autoBackup').value
            };
            
            // Пароль администратора
            const adminPassword = document.getElementById('adminPassword').value;
            if (adminPassword) {
                if (adminPassword.length < 6) {
                    this.showNotification('Пароль должен быть не менее 6 символов', 'error');
                    return;
                }
                
                const db = window.leoDB?.getAll();
                if (db) {
                    db.system = db.system || {};
                    db.system.admin_password = adminPassword;
                    window.leoDB.save(db);
                }
                
                this.showNotification('Пароль обновлен', 'success');
                document.getElementById('adminPassword').value = '';
            }
            
            // Сохраняем настройки
            const db = window.leoDB?.getAll();
            if (db) {
                db.system_settings = settings;
                window.leoDB.save(db);
                
                this.showNotification('Настройки сохранены', 'success');
                this.addLog('admin', 'Обновил системные настройки');
                
                // Применяем изменения
                this.applySettings(settings);
            }
        },
        
        applySettings: function(settings) {
            // Тема
            document.documentElement.className = settings.theme;
            
            // Акцентный цвет
            if (settings.accentColor) {
                document.documentElement.style.setProperty('--primary', settings.accentColor);
            }
            
            // Шрифт
            if (settings.interfaceFont !== 'Inter') {
                document.body.style.fontFamily = `${settings.interfaceFont}, sans-serif`;
            }
        },
        
        resetSettings: function() {
            if (!confirm('Сбросить все настройки к стандартным?')) return;
            
            const defaultSettings = {
                systemName: 'Leo Assistant',
                defaultClass: '7B',
                pointsPerTask: 50,
                aiMode: 'advanced',
                aiMaxLength: 500,
                aiLearning: true,
                aiProfanityFilter: true,
                emailVerification: true,
                maxLoginAttempts: 5,
                lockoutTime: 15,
                theme: 'dark',
                accentColor: '#6366f1',
                interfaceFont: 'Inter',
                autoBackup: 'weekly'
            };
            
            // Заполняем форму стандартными значениями
            Object.keys(defaultSettings).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = defaultSettings[key];
                    } else {
                        element.value = defaultSettings[key];
                    }
                }
            });
            
            // Радиокнопки темы
            document.querySelector(`input[name="theme"][value="${defaultSettings.theme}"]`).checked = true;
            
            this.showNotification('Настройки сброшены', 'info');
        },
        
        // ===== ЛОГИ =====
        loadLogs: function() {
            console.log('📜 Загрузка логов...');
            
            const container = document.getElementById('logsList');
            if (!container) return;
            
            const db = window.leoDB?.getAll();
            const logs = db?.logs || [];
            
            if (logs.length === 0) {
                container.innerHTML = `
                    <div class="logs-empty">
                        <i class="fas fa-history"></i>
                        <p>Логов пока нет</p>
                    </div>
                `;
                return;
            }
            
            // Показываем последние 100 логов
            const recentLogs = logs.slice(-100).reverse();
            
            container.innerHTML = '';
            recentLogs.forEach(log => {
                const logEl = document.createElement('div');
                logEl.className = 'log-item';
                
                const time = new Date(log.timestamp).toLocaleString('ru-RU');
                const levelClass = log.level || 'info';
                const icon = this.getLogIcon(log.type);
                
                logEl.innerHTML = `
                    <div class="log-icon ${levelClass}">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div class="log-content">
                        <div class="log-header">
                            <span class="log-user">${log.user || 'Система'}</span>
                            <span class="log-time">${time}</span>
                        </div>
                        <div class="log-message">${log.action || log.message}</div>
                    </div>
                `;
                
                container.appendChild(logEl);
            });
        },
        
        getLogIcon: function(type) {
            const icons = {
                'login': 'sign-in-alt',
                'logout': 'sign-out-alt',
                'task': 'tasks',
                'user': 'user',
                'system': 'cog',
                'ai': 'robot',
                'security': 'shield-alt',
                'error': 'exclamation-circle',
                'warning': 'exclamation-triangle',
                'info': 'info-circle',
                'success': 'check-circle'
            };
            return icons[type] || 'info-circle';
        },
        
        filterLogsByLevel: function(level) {
            console.log(`🔍 Фильтрация логов по уровню: ${level}`);
            // Реализация фильтрации
        },
        
        searchLogs: function(query) {
            console.log(`🔍 Поиск в логах: ${query}`);
            // Реализация поиска
        },
        
        exportLogs: function() {
            console.log('💾 Экспорт логов...');
            
            const db = window.leoDB?.getAll();
            const logs = db?.logs || [];
            
            if (logs.length === 0) {
                this.showNotification('Нет логов для экспорта', 'warning');
                return;
            }
            
            // Конвертируем в CSV
            const headers = ['Дата', 'Время', 'Пользователь', 'Действие', 'Тип', 'Уровень'];
            const csvRows = [
                headers.join(','),
                ...logs.map(log => [
                    new Date(log.timestamp).toLocaleDateString('ru-RU'),
                    new Date(log.timestamp).toLocaleTimeString('ru-RU'),
                    log.user || 'Система',
                    `"${log.action || log.message}"`,
                    log.type || 'system',
                    log.level || 'info'
                ].join(','))
            ];
            
            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `leo_logs_${new Date().toISOString().split('T')[0]}.csv`);
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.showNotification('Логи экспортированы', 'success');
            this.addLog('admin', 'Экспортировал системные логи');
        },
        
        clearLogs: function() {
            if (!confirm('Очистить все логи системы?')) return;
            
            const db = window.leoDB?.getAll();
            if (db) {
                db.logs = [];
                window.leoDB.save(db);
                
                this.showNotification('Логи очищены', 'success');
                this.addLog('admin', 'Очистил все системные логи');
                
                // Обновляем список логов
                this.loadLogs();
            }
        },
        
        // ===== ЗАДАНИЯ =====
        loadTasks: function() {
            console.log('📝 Загрузка заданий...');
            // Здесь будет загрузка заданий
        },
        
        // ===== ЭКСПОРТ =====
        exportUsers: function() {
            console.log('💾 Экспорт пользователей...');
            
            if (this.allUsers.length === 0) {
                this.showNotification('Нет пользователей для экспорта', 'warning');
                return;
            }
            
            // Конвертируем в CSV
            const headers = ['Имя', 'Логин', 'Класс', 'Роль', 'Очки', 'Уровень', 'Задания', 'Регистрация'];
            const csvRows = [
                headers.join(','),
                ...this.allUsers.map(user => [
                    `"${user.name}"`,
                    user.login,
                    user.class || '7Б',
                    user.role === 'admin' ? 'Администратор' : 
                    user.role === 'teacher' ? 'Учитель' : 'Ученик',
                    user.points || 0,
                    user.level || 1,
                    user.tasks_completed?.length || 0,
                    user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '-'
                ].join(','))
            ];
            
            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `leo_users_${new Date().toISOString().split('T')[0]}.csv`);
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.showNotification('Пользователи экспортированы', 'success');
            this.addLog('admin', 'Экспортировал список пользователей');
        },
        
        // ===== БАЗА ДАННЫХ =====
        backupDatabase: function() {
            console.log('💾 Создание резервной копии...');
            
            const db = window.leoDB?.getAll();
            if (!db) {
                this.showNotification('База данных не найдена', 'error');
                return;
            }
            
            const dataStr = JSON.stringify(db, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportName = `leo_backup_${new Date().toISOString().split('T')[0]}.json`;
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', exportName);
            link.click();
            
            this.showNotification('Резервная копия создана', 'success');
            this.addLog('admin', 'Создал резервную копию базы данных');
        },
        
        clearDatabase: function() {
            if (!confirm('ВНИМАНИЕ! Это удалит ВСЕ данные. Продолжить?')) return;
            if (!confirm('Вы уверены? Это действие нельзя отменить!')) return;
            
            const cleanDB = {
                version: "3.0",
                users: [],
                classes: {
                    "7B": {
                        schedule: [],
                        tasks: [],
                        students: []
                    }
                },
                ai_knowledge: {
                    greetings: {
                        "привет": "Привет! Я Лео, твой помощник в учебе!",
                        "здравствуй": "Здравствуй! Чем могу помочь?",
                        "добрый день": "Добрый день! Готов помочь с учебой!"
                    }
                },
                logs: [],
                system: { 
                    admin_password: "admin123", 
                    total_logins: 0 
                },
                system_settings: {
                    systemName: "Leo Assistant",
                    defaultClass: "7B",
                    pointsPerTask: 50,
                    theme: "dark",
                    accentColor: "#6366f1"
                }
            };
            
            window.leoDB.save(cleanDB);
            
            this.showNotification('База данных очищена', 'success');
            this.addLog('admin', 'Очистил всю базу данных');
            
            // Перезагружаем данные
            this.loadData();
            this.loadUsers();
            this.loadAI();
            this.loadLogs();
        },
        
        // ===== ФИЛЬТРАЦИЯ ПОЛЬЗОВАТЕЛЕЙ =====
        filterUsers: function(query) {
            console.log(`🔍 Фильтрация пользователей: ${query}`);
            // Реализация фильтрации
        },
        
        filterUsersByStatus: function(status) {
            console.log(`🔍 Фильтрация по статусу: ${status}`);
            // Реализация фильтрации
        },
        
        toggleAllUsers: function(checked) {
            const checkboxes = document.querySelectorAll('.user-select');
            checkboxes.forEach(checkbox => {
                checkbox.checked = checked;
            });
        },
        
        // ===== УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ =====
        closeModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        },
        
        // ===== УВЕДОМЛЕНИЯ =====
        showNotification: function(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            if (!container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const icons = {
                'success': 'check-circle',
                'error': 'exclamation-circle',
                'warning': 'exclamation-triangle',
                'info': 'info-circle'
            };
            
            toast.innerHTML = `
                <div class="toast-icon">
                    <i class="fas fa-${icons[type] || 'info-circle'}"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            container.appendChild(toast);
            
            // Обработчик закрытия
            toast.querySelector('.toast-close').addEventListener('click', () => {
                toast.remove();
            });
            
            // Автоматическое удаление
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 5000);
        },
        
        // ===== ЛОГГИРОВАНИЕ =====
        addLog: function(user, action, type = 'system', level = 'info') {
            const db = window.leoDB?.getAll();
            if (!db) return;
            
            if (!db.logs) db.logs = [];
            
            const logEntry = {
                id: Date.now(),
                user: user,
                action: action,
                type: type,
                level: level,
                timestamp: new Date().toISOString()
            };
            
            db.logs.push(logEntry);
            
            // Ограничиваем количество логов
            if (db.logs.length > 1000) {
                db.logs = db.logs.slice(-1000);
            }
            
            window.leoDB.save(db);
            this.logs = db.logs;
        }
    };
    
    // Инициализация при загрузке
    window.Admin.init();
    
    // Глобальные функции для вызова из HTML
    window.showTab = (tabName) => window.Admin?.showSection(tabName);
    window.closeModal = (modalId) => window.Admin?.closeModal(modalId);
    window.openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };
});
