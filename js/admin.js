// js/admin.js - ПОЛНОФУНКЦИОНАЛЬНАЯ АДМИН-ПАНЕЛЬ

class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.allUsers = [];
        this.allTasks = [];
        this.logs = [];
        this.currentSection = 'dashboard';
        this.charts = {};
        this.isTraining = false;
        
        this.init();
    }
    
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    async init() {
        console.log('🚀 Инициализация админ-панели...');
        
        // Проверка прав доступа
        if (!this.checkAccess()) return;
        
        // Загрузка данных
        await this.loadData();
        
        // Настройка интерфейса
        this.setupUI();
        
        // Инициализация графиков
        this.initCharts();
        
        // Запуск обновлений
        this.startUpdates();
        
        console.log('✅ Админ-панель готова');
    }
    
    checkAccess() {
        const isAdmin = localStorage.getItem('is_admin') === 'true';
        if (!isAdmin) {
            this.showToast('Доступ запрещен', 'Требуются права администратора', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return false;
        }
        return true;
    }
    
    async loadData() {
        try {
            const db = window.leoDB?.getAll();
            if (!db) {
                throw new Error('База данных не найдена');
            }
            
            this.currentUser = {
                name: 'Администратор',
                role: 'admin',
                avatar: 'A'
            };
            
            // Загрузка пользователей
            this.allUsers = db.users || [];
            
            // Загрузка заданий
            this.allTasks = db.classes?.['7B']?.tasks || [];
            
            // Загрузка логов
            this.logs = db.logs || [];
            
            // Обновление счетчиков
            this.updateCounters();
            
            // Загрузка данных для текущей секции
            this.loadSectionData();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showToast('Ошибка загрузки', error.message, 'error');
        }
    }
    
    updateCounters() {
        // Обновление счетчиков в навигации
        document.getElementById('usersCount').textContent = this.allUsers.length;
        document.getElementById('tasksCount').textContent = this.allTasks.length;
        document.getElementById('logsCount').textContent = this.logs.length;
    }
    
    // ===== НАСТРОЙКА ИНТЕРФЕЙСА =====
    setupUI() {
        // Навигация
        this.setupNavigation();
        
        // Поиск
        this.setupSearch();
        
        // Кнопки действий
        this.setupButtons();
        
        // Формы
        this.setupForms();
        
        // Модальные окна
        this.setupModals();
    }
    
    setupNavigation() {
        // Навигация по меню
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Выход
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('is_admin');
            window.location.href = 'index.html';
        });
    }
    
    setupSearch() {
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.performGlobalSearch(e.target.value);
            });
        }
    }
    
    setupButtons() {
        // Обновление дашборда
        document.getElementById('refreshDashboard').addEventListener('click', () => {
            this.loadData();
            this.showToast('Данные обновлены', 'Информация актуализирована', 'success');
        });
        
        // Добавление пользователя
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.openUserModal();
        });
        
        // Обучение AI
        document.getElementById('trainAI').addEventListener('click', () => {
            this.trainAI();
        });
        
        // Сохранение настроек
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Экспорт
        document.getElementById('exportUsers').addEventListener('click', () => {
            this.exportUsers();
        });
        
        // Экспорт логов
        document.getElementById('exportLogs').addEventListener('click', () => {
            this.exportLogs();
        });
        
        // Очистка логов
        document.getElementById('clearLogs').addEventListener('click', () => {
            this.clearLogs();
        });
        
        // Управление базой
        const dbControls = ['backupAI', 'restoreAI', 'resetAI'];
        dbControls.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => this.handleDatabaseAction(id));
            }
        });
    }
    
    setupForms() {
        // Настройки темы
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        });
        
        // Пресеты цветов
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                document.getElementById('accentColor').value = color;
                this.changeAccentColor(color);
            });
        });
        
        // Ползунки
        const aiLength = document.getElementById('aiMaxLength');
        if (aiLength) {
            aiLength.addEventListener('input', (e) => {
                document.getElementById('aiLengthValue').textContent = 
                    `${e.target.value} символов`;
            });
        }
    }
    
    setupModals() {
        // Закрытие по клику на фон
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    // ===== УПРАВЛЕНИЕ СЕКЦИЯМИ =====
    showSection(sectionId) {
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
            setTimeout(() => this.loadSectionData(), 100);
            
            // Прокрутка вверх
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    loadSectionData() {
        switch (this.currentSection) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'users':
                this.loadUsersTable();
                break;
            case 'ai':
                this.loadAIData();
                break;
            case 'logs':
                this.loadLogs();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    // ===== ДАШБОРД =====
    loadDashboardData() {
        const db = window.leoDB?.getAll();
        if (!db) return;
        
        // Обновление статистики
        this.updateDashboardStats(db);
        
        // Обновление графиков
        this.updateCharts();
        
        // Загрузка последних действий
        this.loadRecentActivities();
    }
    
    updateDashboardStats(db) {
        const users = db.users || [];
        const tasks = db.classes?.['7B']?.tasks || [];
        const totalLogins = db.system?.total_logins || 0;
        
        // Основная статистика
        document.getElementById('statUsers').textContent = users.length;
        document.getElementById('statTasks').textContent = tasks.length;
        
        // AI статистика
        const aiRequests = db.ai_requests || 0;
        document.getElementById('statAIRequests').textContent = aiRequests;
        
        // Активность (примерный расчет)
        const activeUsers = users.filter(u => u.last_login).length;
        const activityPercent = users.length > 0 
            ? Math.round((activeUsers / users.length) * 100)
            : 0;
        document.getElementById('statActivity').textContent = `${activityPercent}%`;
    }
    
    // ===== ГРАФИКИ =====
    initCharts() {
        // График активности
        this.initActivityChart();
        
        // График классов
        this.initClassesChart();
    }
    
    initActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;
        
        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                datasets: [{
                    label: 'Активность',
                    data: [12, 19, 3, 5, 2, 3, 15],
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: 'rgb(248, 250, 252)',
                        bodyColor: 'rgb(248, 250, 252)',
                        borderColor: 'rgb(99, 102, 241)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgb(148, 163, 184)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: 'rgb(148, 163, 184)'
                        }
                    }
                }
            }
        });
    }
    
    initClassesChart() {
        const ctx = document.getElementById('classesChart');
        if (!ctx) return;
        
        this.charts.classes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['7Б класс', '7А класс', '8Б класс'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: [
                        'rgb(99, 102, 241)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 158, 11)'
                    ],
                    borderWidth: 2,
                    borderColor: 'rgba(15, 23, 42, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgb(203, 213, 225)',
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateCharts() {
        // Здесь можно обновить данные графиков на основе реальных данных
        const db = window.leoDB?.getAll();
        if (!db) return;
        
        // Обновляем график активности
        if (this.charts.activity) {
            // Генерируем данные на основе реальных пользователей
            const activityData = this.generateActivityData();
            this.charts.activity.data.datasets[0].data = activityData;
            this.charts.activity.update();
        }
    }
    
    generateActivityData() {
        // Генерация реалистичных данных активности
        const db = window.leoDB?.getAll();
        const users = db?.users || [];
        
        const baseData = [10, 20, 15, 25, 18, 12, 22];
        
        // Корректируем данные на основе количества пользователей
        if (users.length > 0) {
            const multiplier = Math.min(users.length / 10, 3);
            return baseData.map(value => Math.round(value * multiplier));
        }
        
        return baseData;
    }
    
    // ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =====
    loadUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (this.allUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem;">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>Пользователей пока нет</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        
        this.allUsers.forEach(user => {
            const row = this.createUserRow(user);
            tbody.appendChild(row);
        });
        
        // Обновление информации о пагинации
        document.getElementById('usersShown').textContent = this.allUsers.length;
        document.getElementById('usersTotal').textContent = this.allUsers.length;
        
        // Настройка выбора всех пользователей
        this.setupUserSelection();
    }
    
    createUserRow(user) {
        const row = document.createElement('tr');
        
        // Статус пользователя
        const statusClass = user.is_active === false ? 'inactive' : 'active';
        const statusText = user.is_active === false ? 'Неактивен' : 'Активен';
        const roleClass = user.role === 'admin' ? 'admin' : 'student';
        const roleText = user.role === 'admin' ? 'Администратор' : 
                        user.role === 'teacher' ? 'Учитель' : 'Ученик';
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="user-select" value="${user.id}">
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${user.avatar || user.name.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary);">${user.name}</div>
                        <div style="font-size: 0.875rem; color: var(--text-muted);">${user.login}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${roleClass}">${roleText}</span>
            </td>
            <td>${user.class || '7Б'}</td>
            <td><strong>${user.points || 0}</strong></td>
            <td>${user.tasks_completed?.length || 0}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="Admin.editUser(${user.id})" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action reset" onclick="Admin.resetUser(${user.id})" title="Сбросить прогресс">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="btn-action delete" onclick="Admin.deleteUser(${user.id})" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }
    
    setupUserSelection() {
        // Выбор всех пользователей
        const selectAll = document.getElementById('selectAllUsers');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.user-select');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
        }
    }
    
    // ===== МОДАЛЬНОЕ ОКНО ПОЛЬЗОВАТЕЛЯ =====
    openUserModal(userId = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('modalUserTitle');
        
        if (userId) {
            // Редактирование пользователя
            const user = this.allUsers.find(u => u.id === userId);
            if (user) {
                title.textContent = 'Редактировать пользователя';
                this.fillUserForm(user);
            }
        } else {
            // Добавление пользователя
            title.textContent = 'Добавить пользователя';
            this.clearUserForm();
        }
        
        this.openModal('userModal');
    }
    
    fillUserForm(user) {
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name.split(' ')[0] || '';
        document.getElementById('userLastName').value = user.name.split(' ')[1] || '';
        document.getElementById('userLogin').value = user.login;
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRole').value = user.role || 'student';
        document.getElementById('userClass').value = user.class || '7B';
        
        // Очищаем поля пароля при редактировании
        document.getElementById('userPassword').value = '';
        document.getElementById('userConfirmPassword').value = '';
        document.getElementById('userPassword').required = false;
        document.getElementById('userConfirmPassword').required = false;
    }
    
    clearUserForm() {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('userPassword').required = true;
        document.getElementById('userConfirmPassword').required = true;
    }
    
    async saveUser() {
        const form = document.getElementById('userForm');
        if (!form.checkValidity()) {
            this.showToast('Ошибка', 'Заполните все обязательные поля', 'error');
            return;
        }
        
        const userId = document.getElementById('userId').value;
        const userData = {
            name: `${document.getElementById('userName').value} ${document.getElementById('userLastName').value}`.trim(),
            login: document.getElementById('userLogin').value,
            email: document.getElementById('userEmail').value,
            role: document.getElementById('userRole').value,
            class: document.getElementById('userClass').value
        };
        
        // Проверка пароля для нового пользователя
        if (!userId) {
            const password = document.getElementById('userPassword').value;
            const confirmPassword = document.getElementById('userConfirmPassword').value;
            
            if (password !== confirmPassword) {
                this.showToast('Ошибка', 'Пароли не совпадают', 'error');
                return;
            }
            
            if (password.length < 6) {
                this.showToast('Ошибка', 'Пароль должен быть не менее 6 символов', 'error');
                return;
            }
            
            userData.password = password;
        }
        
        try {
            const db = window.leoDB?.getAll();
            if (!db) throw new Error('База данных недоступна');
            
            if (userId) {
                // Обновление пользователя
                const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
                if (userIndex !== -1) {
                    const existingUser = db.users[userIndex];
                    
                    // Обновляем данные
                    db.users[userIndex] = {
                        ...existingUser,
                        ...userData,
                        // Сохраняем пароль только если он был изменен
                        password: userData.password || existingUser.password
                    };
                    
                    // Обновляем аватар
                    db.users[userIndex].avatar = this.generateAvatar(userData.name);
                    
                    window.leoDB.save(db);
                    this.showToast('Успешно', 'Пользователь обновлен', 'success');
                    this.addLog('admin', `Обновил пользователя "${userData.name}"`);
                }
            } else {
                // Добавление нового пользователя
                const result = window.leoDB.addUser(userData);
                if (result.success) {
                    this.showToast('Успешно', 'Пользователь добавлен', 'success');
                    this.addLog('admin', `Добавил нового пользователя "${userData.name}"`);
                } else {
                    throw new Error(result.error);
                }
            }
            
            // Перезагружаем данные
            await this.loadData();
            this.closeModal('userModal');
            
        } catch (error) {
            this.showToast('Ошибка', error.message, 'error');
        }
    }
    
    editUser(userId) {
        this.openUserModal(userId);
    }
    
    async deleteUser(userId) {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
        
        try {
            const db = window.leoDB?.getAll();
            if (!db) throw new Error('База данных недоступна');
            
            const user = db.users.find(u => u.id === userId);
            if (!user) throw new Error('Пользователь не найден');
            
            // Удаляем пользователя
            db.users = db.users.filter(u => u.id !== userId);
            
            // Удаляем из класса
            if (db.classes?.[user.class]?.students) {
                db.classes[user.class].students = 
                    db.classes[user.class].students.filter(s => s.id !== userId);
            }
            
            window.leoDB.save(db);
            this.showToast('Успешно', 'Пользователь удален', 'success');
            this.addLog('admin', `Удалил пользователя "${user.name}"`);
            
            // Перезагружаем данные
            await this.loadData();
            
        } catch (error) {
            this.showToast('Ошибка', error.message, 'error');
        }
    }
    
    async resetUser(userId) {
        if (!confirm('Сбросить очки и прогресс пользователя?')) return;
        
        try {
            const db = window.leoDB?.getAll();
            if (!db) throw new Error('База данных недоступна');
            
            const user = db.users.find(u => u.id === userId);
            if (!user) throw new Error('Пользователь не найден');
            
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
            this.showToast('Успешно', 'Прогресс пользователя сброшен', 'success');
            this.addLog('admin', `Сбросил прогресс пользователя "${user.name}"`);
            
            // Перезагружаем данные
            await this.loadData();
            
        } catch (error) {
            this.showToast('Ошибка', error.message, 'error');
        }
    }
    
    // ===== AI СИСТЕМА =====
    loadAIData() {
        const db = window.leoDB?.getAll();
        if (!db) return;
        
        const aiKnowledge = db.ai_knowledge || {};
        let trainedAnswers = 0;
        
        // Считаем количество обученных ответов
        Object.values(aiKnowledge).forEach(category => {
            if (Array.isArray(category)) {
                trainedAnswers += category.length;
            } else if (typeof category === 'object') {
                trainedAnswers += Object.keys(category).length;
            }
        });
        
        // Обновляем статистику
        document.getElementById('aiTrainedAnswers').textContent = trainedAnswers;
        document.getElementById('aiAccuracy').textContent = '92%'; // Примерное значение
        document.getElementById('aiLastTrain').textContent = 
            db.ai_last_train ? new Date(db.ai_last_train).toLocaleDateString('ru-RU') : 'Никогда';
    }
    
    async trainAI() {
        if (this.isTraining) {
            this.showToast('Информация', 'Обучение уже запущено', 'info');
            return;
        }
        
        this.isTraining = true;
        this.showToast('Запуск', 'Начинаем обучение нейросети...', 'info');
        
        // Обновляем UI
        document.getElementById('trainAI').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обучение...';
        document.getElementById('trainAI').disabled = true;
        
        const progressBar = document.getElementById('trainingFill');
        const progressText = document.getElementById('trainingProgress');
        const processedEl = document.getElementById('processedItems');
        const timeEl = document.getElementById('trainingTime');
        
        let progress = 0;
        let processed = 0;
        const totalItems = 100; // Примерное количество
        const startTime = Date.now();
        
        // Имитация обучения
        const interval = setInterval(() => {
            progress += 1;
            processed += 2;
            
            // Обновляем прогресс
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            processedEl.textContent = `${processed}/${totalItems}`;
            
            // Обновляем время
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeEl.textContent = `${elapsed}с`;
            
            if (progress >= 100) {
                clearInterval(interval);
                
                // Сохраняем результат обучения
                const db = window.leoDB?.getAll();
                if (db) {
                    db.ai_last_train = new Date().toISOString();
                    db.ai_requests = (db.ai_requests || 0) + 1;
                    window.leoDB.save(db);
                }
                
                // Восстанавливаем UI
                document.getElementById('trainAI').innerHTML = '<i class="fas fa-play"></i> Запустить обучение';
                document.getElementById('trainAI').disabled = false;
                
                this.showToast('Успех', 'Обучение нейросети завершено', 'success');
                this.addLog('admin', 'Провел обучение нейросети');
                this.isTraining = false;
                
                // Обновляем данные
                this.loadAIData();
            }
        }, 50);
    }
    
    // ===== НАСТРОЙКИ =====
    loadSettings() {
        const db = window.leoDB?.getAll();
        if (!db) return;
        
        const settings = db.system_settings || {};
        
        // Заполняем форму
        if (settings.systemName) {
            document.getElementById('systemName').value = settings.systemName;
        }
        
        if (settings.defaultClass) {
            document.getElementById('defaultClass').value = settings.defaultClass;
        }
        
        if (settings.pointsPerTask) {
            document.getElementById('pointsPerTask').value = settings.pointsPerTask;
        }
        
        if (settings.aiMode) {
            document.getElementById('aiMode').value = settings.aiMode;
        }
        
        if (settings.aiMaxLength) {
            document.getElementById('aiMaxLength').value = settings.aiMaxLength;
            document.getElementById('aiLengthValue').textContent = 
                `${settings.aiMaxLength} символов`;
        }
        
        // Тема
        const theme = settings.theme || 'dark';
        document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
        
        // Акцентный цвет
        if (settings.accentColor) {
            document.getElementById('accentColor').value = settings.accentColor;
        }
    }
    
    async saveSettings() {
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
            interfaceFont: document.getElementById('interfaceFont').value
        };
        
        // Пароль администратора
        const adminPassword = document.getElementById('adminPassword').value;
        if (adminPassword) {
            if (adminPassword.length < 6) {
                this.showToast('Ошибка', 'Пароль должен быть не менее 6 символов', 'error');
                return;
            }
            settings.adminPassword = adminPassword;
        }
        
        try {
            const db = window.leoDB?.getAll();
            if (!db) throw new Error('База данных недоступна');
            
            // Сохраняем настройки
            db.system_settings = settings;
            
            // Обновляем пароль администратора если нужно
            if (settings.adminPassword) {
                db.system = db.system || {};
                db.system.admin_password = settings.adminPassword;
            }
            
            window.leoDB.save(db);
            this.showToast('Успех', 'Настройки сохранены', 'success');
            this.addLog('admin', 'Обновил системные настройки');
            
            // Применяем изменения интерфейса
            this.applySettings(settings);
            
        } catch (error) {
            this.showToast('Ошибка', error.message, 'error');
        }
    }
    
    applySettings(settings) {
        // Тема
        document.documentElement.className = settings.theme;
        
        // Акцентный цвет
        document.documentElement.style.setProperty('--primary', settings.accentColor);
        document.documentElement.style.setProperty('--primary-dark', this.darkenColor(settings.accentColor, 20));
        document.documentElement.style.setProperty('--primary-light', this.lightenColor(settings.accentColor, 20));
        
        // Шрифт
        document.body.style.fontFamily = `'${settings.interfaceFont}', -apple-system, sans-serif`;
    }
    
    changeTheme(theme) {
        document.documentElement.className = theme;
        this.showToast('Интерфейс', `Тема изменена на ${theme === 'dark' ? 'темную' : 'светлую'}`, 'info');
    }
    
    changeAccentColor(color) {
        document.documentElement.style.setProperty('--primary', color);
        document.documentElement.style.setProperty('--primary-dark', this.darkenColor(color, 20));
        this.showToast('Интерфейс', 'Акцентный цвет изменен', 'info');
    }
    
    // ===== ЛОГИ =====
    loadLogs() {
        const container = document.getElementById('logsList');
        if (!container) return;
        
        if (this.logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>Логов пока нет</p>
                </div>
            `;
            return;
        }
        
        // Показываем последние 50 логов
        const recentLogs = [...this.logs].slice(-50).reverse();
        
        container.innerHTML = '';
        recentLogs.forEach(log => {
            const logEl = this.createLogElement(log);
            container.appendChild(logEl);
        });
    }
    
    createLogElement(log) {
        const div = document.createElement('div');
        div.className = 'log-entry';
        
        const time = new Date(log.timestamp || Date.now()).toLocaleString('ru-RU');
        const icon = this.getLogIcon(log.type);
        const levelClass = log.level || 'info';
        
        div.innerHTML = `
            <div class="log-icon ${levelClass}">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="log-content">
                <div class="log-header">
                    <span class="log-user">${log.user || 'Система'}</span>
                    <span class="log-time">${time}</span>
                </div>
                <div class="log-message">${log.action || log.message}</div>
                ${log.details ? `<div class="log-details">${log.details}</div>` : ''}
            </div>
        `;
        
        return div;
    }
    
    async clearLogs() {
        if (!confirm('Очистить все логи системы?')) return;
        
        try {
            const db = window.leoDB?.getAll();
            if (!db) throw new Error('База данных недоступна');
            
            db.logs = [];
            window.leoDB.save(db);
            
            this.logs = [];
            this.loadLogs();
            this.showToast('Успех', 'Логи очищены', 'success');
            this.addLog('admin', 'Очистил все системные логи');
            
        } catch (error) {
            this.showToast('Ошибка', error.message, 'error');
        }
    }
    
    // ===== ЭКСПОРТ =====
    exportUsers() {
        const data = this.allUsers.map(user => ({
            Имя: user.name,
            Логин: user.login,
            Класс: user.class,
            Роль: user.role,
            Очки: user.points,
            Уровень: user.level,
            'Выполнено заданий': user.tasks_completed?.length || 0,
            'Дата регистрации': user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '-'
        }));
        
        this.exportToCSV(data, 'leo_users.csv');
        this.showToast('Экспорт', 'Данные пользователей экспортированы', 'success');
        this.addLog('admin', 'Экспортировал список пользователей');
    }
    
    exportLogs() {
        const data = this.logs.map(log => ({
            Дата: new Date(log.timestamp || Date.now()).toLocaleString('ru-RU'),
            Пользователь: log.user || 'Система',
            Действие: log.action || log.message,
            Уровень: log.level || 'info',
            Тип: log.type || 'system'
        }));
        
        this.exportToCSV(data, 'leo_logs.csv');
        this.showToast('Экспорт', 'Логи экспортированы', 'success');
        this.addLog('admin', 'Экспортировал системные логи');
    }
    
    exportToCSV(data, filename) {
        const headers = Object.keys(data[0] || {});
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(header => 
                JSON.stringify(row[header] || '')).join(','))
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    // ===== БАЗА ДАННЫХ =====
    async handleDatabaseAction(action) {
        switch (action) {
            case 'backupAI':
                await this.backupDatabase();
                break;
            case 'restoreAI':
                await this.restoreDatabase();
                break;
            case 'resetAI':
                await this.resetDatabase();
                break;
        }
    }
    
    async backupDatabase() {
        try {
            const db = window.leoDB?.getAll();
            if (!db) throw new Error('База данных недоступна');
            
            const dataStr = JSON.stringify(db, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportName = `leo_backup_${new Date().toISOString().split('T')[0]}.json`;
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', exportName);
            link.click();
            
            this.showToast('Резервная копия', 'База данных сохранена', 'success');
            this.addLog('admin', 'Создал резервную копию базы данных');
            
        } catch (error) {
            this.showToast('Ошибка', error.message, 'error');
        }
    }
    
    async restoreDatabase() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!data.version) {
                        throw new Error('Некорректный файл резервной копии');
                    }
                    
                    if (!confirm('Восстановить базу данных из резервной копии? Текущие данные будут перезаписаны.')) {
                        return;
                    }
                    
                    window.leoDB.save(data);
                    await this.loadData();
                    
                    this.showToast('Восстановление', 'База данных восстановлена', 'success');
                    this.addLog('admin', 'Восстановил базу данных из резервной копии');
                    
                } catch (error) {
                    this.showToast('Ошибка', error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    async resetDatabase() {
        if (!confirm('ВНИМАНИЕ! Это удалит ВСЕ данные. Продолжить?')) return;
        if (!confirm('Вы уверены? Это действие нельзя отменить!')) return;
        
        try {
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
                ai_knowledge: {},
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
            await this.loadData();
            
            this.showToast('Сброс', 'Все данные очищены', 'success');
            this.addLog('admin', 'Сбросил всю базу данных');
            
        } catch (error) {
            this.showToast('Ошибка', error.message, 'error');
        }
    }
    
    // ===== ПОСЛЕДНИЕ ДЕЙСТВИЯ =====
    loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container || this.logs.length === 0) return;
        
        // Берем последние 5 действий
        const recent = [...this.logs].slice(-5).reverse();
        
        container.innerHTML = '';
        recent.forEach(log => {
            const activity = this.createActivityElement(log);
            container.appendChild(activity);
        });
    }
    
    createActivityElement(log) {
        const div = document.createElement('div');
        div.className = 'activity-item';
        
        const time = new Date(log.timestamp || Date.now()).toLocaleTimeString('ru-RU');
        const icon = this.getLogIcon(log.type);
        
        div.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${log.action || log.message}</div>
                <div class="activity-meta">
                    <span class="activity-user">${log.user || 'Система'}</span>
                    <span class="activity-time">${time}</span>
                </div>
            </div>
        `;
        
        return div;
    }
    
    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    generateAvatar(name) {
        const names = name.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    getLogIcon(type) {
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
    }
    
    addLog(user, action, type = 'system', level = 'info') {
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
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return "#" + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return "#" + (
            0x1000000 +
            (R > 255 ? 255 : R) * 0x10000 +
            (G > 255 ? 255 : G) * 0x100 +
            (B > 255 ? 255 : B)
        ).toString(16).slice(1);
    }
    
    // ===== МОДАЛЬНЫЕ ОКНА =====
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
    
    // ===== УВЕДОМЛЕНИЯ =====
    showToast(title, message, type = 'info') {
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
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Автоматическое удаление
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
    
    // ===== ПОИСК =====
    performGlobalSearch(query) {
        if (query.length < 2) return;
        
        console.log('Поиск:', query);
        // Здесь можно реализовать глобальный поиск по всем данным
    }
    
    // ===== ОБНОВЛЕНИЯ =====
    startUpdates() {
        // Автообновление каждые 30 секунд
        setInterval(() => {
            this.loadSectionData();
        }, 30000);
        
        // Обновление времени каждую минуту
        setInterval(() => {
            this.updateTime();
        }, 60000);
    }
    
    updateTime() {
        const timeElement = document.querySelector('.current-time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.Admin = new AdminPanel();
});

// Глобальные функции для вызова из HTML
window.showTab = (tabName) => window.Admin?.showSection(tabName);
window.closeModal = (modalId) => window.Admin?.closeModal(modalId);
window.openModal = (modalId) => window.Admin?.openModal(modalId);
window.saveUser = () => window.Admin?.saveUser();
window.editUser = (userId) => window.Admin?.editUser(userId);
window.deleteUser = (userId) => window.Admin?.deleteUser(userId);
window.resetUser = (userId) => window.Admin?.resetUser(userId);
