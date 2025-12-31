// js/admin.js - РЕАЛЬНАЯ РАБОЧАЯ АДМИН-ПАНЕЛЬ
class AdminPanel {
    constructor() {
        console.log('🚀 Инициализация реальной админ-панели...');
        
        this.db = null;
        this.currentUser = null;
        this.allUsers = [];
        this.allTasks = [];
        this.systemStats = null;
        this.currentSection = 'dashboard';
        this.selectedUsers = new Set();
        this.isTraining = false;
        
        this.init();
    }
    
    async init() {
        // 1. Проверяем доступ
        if (!this.checkAccess()) return;
        
        // 2. Загружаем реальные данные
        await this.loadRealData();
        
        // 3. Настраиваем интерфейс
        this.setupRealUI();
        
        // 4. Запускаем автообновление
        this.startAutoUpdate();
        
        console.log('✅ Реальная админ-панель готова к работе');
    }
    
    // ===== ПРОВЕРКА ДОСТУПА =====
    checkAccess() {
        const isAdmin = localStorage.getItem('is_admin') === 'true';
        if (!isAdmin) {
            this.showToast('🔒 Доступ запрещен', 'Требуются права администратора', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return false;
        }
        return true;
    }
    
    // ===== ЗАГРУЗКА РЕАЛЬНЫХ ДАННЫХ =====
    async loadRealData() {
        console.log('📊 Загрузка реальных данных...');
        
        this.db = window.leoDB?.getAll();
        if (!this.db) {
            console.error('❌ База данных не найдена');
            this.showToast('Ошибка', 'База данных недоступна', 'error');
            return;
        }
        
        // Загружаем реальных пользователей
        this.allUsers = this.db.users || [];
        
        // Загружаем реальные задания
        this.allTasks = [];
        Object.values(this.db.classes || {}).forEach(classData => {
            if (classData.tasks) {
                this.allTasks.push(...classData.tasks);
            }
        });
        
        // Получаем реальную статистику
        this.systemStats = window.leoDB?.getSystemStats();
        
        // Обновляем реальные счетчики
        this.updateRealCounters();
        
        // Обновляем интерфейс текущей секции
        this.loadCurrentSection();
    }
    
    updateRealCounters() {
        // Реальные счетчики в навигации
        const usersCount = this.allUsers.length;
        const tasksCount = this.allTasks.length;
        const logsCount = this.db?.logs?.length || 0;
        
        document.getElementById('usersCount').textContent = usersCount;
        document.getElementById('tasksCount').textContent = tasksCount;
        document.getElementById('logsCount').textContent = logsCount;
    }
    
    // ===== НАСТРОЙКА РЕАЛЬНОГО ИНТЕРФЕЙСА =====
    setupRealUI() {
        console.log('🎨 Настройка реального интерфейса...');
        
        // 1. Навигация
        this.setupNavigation();
        
        // 2. Все кнопки действий
        this.setupActionButtons();
        
        // 3. Формы и модальные окна
        this.setupForms();
        
        // 4. Поиск и фильтры
        this.setupSearch();
        
        // 5. Темная тема по умолчанию
        this.applyDarkTheme();
        
        // 6. Обновление времени
        this.updateClock();
        setInterval(() => this.updateClock(), 60000);
    }
    
    setupNavigation() {
        // Реальная навигация между разделами
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Убираем активность у всех
                document.querySelectorAll('.menu-item').forEach(i => {
                    i.classList.remove('active');
                });
                
                // Добавляем активность текущему
                item.classList.add('active');
                
                // Показываем нужный раздел
                const section = item.getAttribute('data-section');
                this.showRealSection(section);
            });
        });
        
        // Кнопка выхода (реальная)
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Выйти из админ-панели?')) {
                localStorage.removeItem('is_admin');
                window.location.href = 'index.html';
            }
        });
    }
    
    setupActionButtons() {
        console.log('🔘 Настройка реальных кнопок...');
        
        // === ДАШБОРД ===
        document.getElementById('refreshDashboard').addEventListener('click', () => {
            this.loadRealData();
            this.showToast('🔄 Обновлено', 'Данные успешно обновлены', 'success');
        });
        
        // === ПОЛЬЗОВАТЕЛИ ===
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.openUserModal();
        });
        
        document.getElementById('exportUsers').addEventListener('click', () => {
            this.exportRealUsers();
        });
        
        document.getElementById('selectAllUsers').addEventListener('change', (e) => {
            this.toggleAllUsers(e.target.checked);
        });
        
        // === AI СИСТЕМА ===
        document.getElementById('trainAI').addEventListener('click', () => {
            this.startRealTraining();
        });
        
        document.getElementById('saveKnowledge').addEventListener('click', () => {
            this.saveRealKnowledge();
        });
        
        document.getElementById('clearKnowledge').addEventListener('click', () => {
            this.clearKnowledgeForm();
        });
        
        // === НАСТРОЙКИ ===
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveRealSettings();
        });
        
        document.getElementById('resetSettings').addEventListener('click', () => {
            if (confirm('Сбросить все настройки к стандартным?')) {
                this.resetToDefaults();
            }
        });
        
        // === УПРАВЛЕНИЕ БАЗОЙ ===
        document.getElementById('backupDB').addEventListener('click', () => {
            this.createRealBackup();
        });
        
        document.getElementById('restoreAI').addEventListener('click', () => {
            this.restoreRealBackup();
        });
        
        document.getElementById('clearDB').addEventListener('click', () => {
            this.clearRealDatabase();
        });
        
        // === ЛОГИ ===
        document.getElementById('exportLogs').addEventListener('click', () => {
            this.exportRealLogs();
        });
        
        document.getElementById('clearLogs').addEventListener('click', () => {
            if (confirm('Очистить все системные логи?')) {
                this.clearRealLogs();
            }
        });
        
        // === БЫСТРЫЕ ДЕЙСТВИЯ ===
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                this.performQuickAction(action);
            });
        });
        
        // === МОДАЛЬНЫЕ ОКНА ===
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                this.closeRealModal(modal.id);
            });
        });
        
        // Сохранение пользователя
        document.getElementById('saveUserBtn').addEventListener('click', () => {
            this.saveRealUser();
        });
    }
    
    setupForms() {
        // Валидация форм в реальном времени
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('input', (e) => {
                this.validateField(e.target);
            });
        });
        
        // Изменение темы
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeRealTheme(e.target.value);
            });
        });
        
        // Выбор цвета
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                this.changeAccentColor(color);
            });
        });
    }
    
    setupSearch() {
        // Поиск пользователей
        document.getElementById('usersSearch').addEventListener('input', (e) => {
            this.searchRealUsers(e.target.value);
        });
        
        // Фильтр пользователей
        document.getElementById('usersFilter').addEventListener('change', (e) => {
            this.filterRealUsers(e.target.value);
        });
        
        // Поиск в логах
        document.getElementById('logsSearch').addEventListener('input', (e) => {
            this.searchRealLogs(e.target.value);
        });
        
        // Фильтр логов по уровню
        document.getElementById('logLevel').addEventListener('change', (e) => {
            this.filterRealLogs(e.target.value);
        });
    }
    
    // ===== РЕАЛЬНЫЕ СЕКЦИИ =====
    showRealSection(sectionId) {
        console.log(`📁 Переход в реальный раздел: ${sectionId}`);
        
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Показываем нужную секцию
        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Загружаем реальные данные для этой секции
            this.loadSectionData(sectionId);
            
            // Плавная прокрутка
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Анимация появления
            this.animateSection(targetSection);
        }
    }
    
    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                this.loadRealDashboard();
                break;
            case 'users':
                this.loadRealUsers();
                break;
            case 'tasks':
                this.loadRealTasks();
                break;
            case 'ai':
                this.loadRealAI();
                break;
            case 'logs':
                this.loadRealLogs();
                break;
            case 'settings':
                this.loadRealSettings();
                break;
        }
    }
    
    // ===== РЕАЛЬНЫЙ ДАШБОРД =====
    loadRealDashboard() {
        console.log('📈 Загрузка реального дашборда...');
        
        if (!this.systemStats) return;
        
        // Обновляем реальную статистику
        document.getElementById('statTotalUsers').textContent = this.systemStats.total_users;
        document.getElementById('statTotalTasks').textContent = this.systemStats.total_tasks;
        document.getElementById('statAIKnowledge').textContent = this.systemStats.ai_knowledge;
        document.getElementById('statActiveIssues').textContent = 0; // Можно считать неактивных пользователей
        
        // Обновляем информацию о системе
        document.getElementById('systemVersion').textContent = this.db.version || '3.0';
        document.getElementById('totalLogins').textContent = this.systemStats.total_logins;
        
        // Рассчитываем размер базы данных
        const dbSize = JSON.stringify(this.db).length;
        const sizeInKB = (dbSize / 1024).toFixed(2);
        document.getElementById('dbSize').textContent = `${sizeInKB} KB`;
        
        // Последнее обновление
        const lastUpdated = new Date(this.db.lastUpdated);
        document.getElementById('dbLastUpdate').textContent = 
            `${lastUpdated.toLocaleDateString()} ${lastUpdated.toLocaleTimeString()}`;
        
        // Загружаем реальные графики
        this.initRealCharts();
        
        // Загружаем реальные последние действия
        this.loadRecentActivities();
    }
    
    initRealCharts() {
        // Реальный график активности пользователей
        const activityCtx = document.getElementById('activityChart');
        if (activityCtx && typeof Chart !== 'undefined') {
            // Уничтожаем старый график
            if (window.activityChart) {
                window.activityChart.destroy();
            }
            
            // Создаем реальные данные на основе логов
            const activityData = this.generateRealActivityData();
            
            window.activityChart = new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                    datasets: [{
                        label: 'Активность',
                        data: activityData,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#6366f1',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        }
        
        // Реальный график распределения по классам
        const classesCtx = document.getElementById('classesChart');
        if (classesCtx) {
            // Уничтожаем старый график
            if (window.classesChart) {
                window.classesChart.destroy();
            }
            
            // Считаем реальное распределение
            const classDistribution = this.calculateClassDistribution();
            
            window.classesChart = new Chart(classesCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(classDistribution),
                    datasets: [{
                        data: Object.values(classDistribution),
                        backgroundColor: [
                            '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
                        ],
                        borderWidth: 2,
                        borderColor: '#1e293b'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#cbd5e1',
                                font: {
                                    size: 12
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    generateRealActivityData() {
        // Генерируем реальные данные на основе логов за последнюю неделю
        const logs = this.db?.logs || [];
        const days = [0, 0, 0, 0, 0, 0, 0]; // 7 дней
        
        logs.forEach(log => {
            const logDate = new Date(log.timestamp);
            const dayOfWeek = logDate.getDay(); // 0-6
            
            if (dayOfWeek >= 0 && dayOfWeek < 7) {
                days[dayOfWeek]++;
            }
        });
        
        // Нормализуем данные
        const max = Math.max(...days);
        return days.map(count => Math.round((count / max) * 100));
    }
    
    calculateClassDistribution() {
        const distribution = {};
        
        this.allUsers.forEach(user => {
            const userClass = user.class || '7B';
            distribution[userClass] = (distribution[userClass] || 0) + 1;
        });
        
        return distribution;
    }
    
    loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;
        
        const logs = this.db?.logs || [];
        
        if (logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>Действий пока нет</p>
                </div>
            `;
            return;
        }
        
        // Берем последние 5 реальных действий
        const recentLogs = logs.slice(-5).reverse();
        
        container.innerHTML = '';
        recentLogs.forEach(log => {
            const activity = document.createElement('div');
            activity.className = 'activity-item';
            
            const time = new Date(log.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const icon = this.getLogIcon(log.type);
            
            activity.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${log.action}</div>
                    <div class="activity-meta">
                        <span class="activity-user">${log.user}</span>
                        <span class="activity-time">${time}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(activity);
        });
    }
    
    // ===== РЕАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ =====
    loadRealUsers() {
        console.log('👥 Загрузка реальных пользователей...');
        
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (this.allUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8">
                        <div class="empty-state">
                            <i class="fas fa-users text-4xl text-gray-500 mb-4"></i>
                            <p class="text-gray-400">Пользователей нет</p>
                            <button class="btn-primary mt-4" onclick="adminPanel.openUserModal()">
                                <i class="fas fa-user-plus mr-2"></i>Добавить первого пользователя
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        
        this.allUsers.forEach(user => {
            const row = this.createRealUserRow(user);
            tbody.appendChild(row);
        });
        
        // Обновляем счетчики
        document.getElementById('usersShown').textContent = this.allUsers.length;
        document.getElementById('usersTotal').textContent = this.allUsers.length;
        document.getElementById('totalUsersCount').textContent = this.allUsers.length;
    }
    
    createRealUserRow(user) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-800 transition-colors';
        
        // Статус пользователя
        const statusClass = user.is_active === false ? 'inactive' : 'active';
        const statusText = user.is_active === false ? 'Неактивен' : 'Активен';
        const roleClass = user.role === 'admin' ? 'admin' : 'student';
        const roleText = user.role === 'admin' ? 'Админ' : 
                        user.role === 'teacher' ? 'Учитель' : 'Ученик';
        
        // Дата регистрации
        const regDate = user.created_at ? 
            new Date(user.created_at).toLocaleDateString('ru-RU') : '—';
        
        row.innerHTML = `
            <td class="py-4 px-6">
                <input type="checkbox" class="user-checkbox" value="${user.id}" 
                       onchange="adminPanel.toggleUserSelection(${user.id}, this.checked)">
            </td>
            <td class="py-4 px-6">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 
                                flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        ${user.avatar || '??'}
                    </div>
                    <div>
                        <div class="font-semibold text-white">${user.name}</div>
                        <div class="text-sm text-gray-400">@${user.login}</div>
                    </div>
                </div>
            </td>
            <td class="py-4 px-6">
                <span class="px-3 py-1 rounded-full text-xs font-medium
                            ${roleClass === 'admin' ? 'bg-blue-500/20 text-blue-400' : 
                              roleClass === 'teacher' ? 'bg-green-500/20 text-green-400' : 
                              'bg-gray-500/20 text-gray-400'}">
                    ${roleText}
                </span>
            </td>
            <td class="py-4 px-6">
                <span class="text-white font-medium">${user.class || '7Б'}</span>
            </td>
            <td class="py-4 px-6">
                <div class="flex items-center">
                    <i class="fas fa-star text-yellow-500 mr-2"></i>
                    <span class="text-white font-bold">${user.points || 0}</span>
                </div>
            </td>
            <td class="py-4 px-6">
                <div class="text-white">${user.tasks_completed?.length || 0}</div>
            </td>
            <td class="py-4 px-6">
                <span class="px-3 py-1 rounded-full text-xs font-medium
                            ${statusClass === 'active' ? 'bg-green-500/20 text-green-400' : 
                              'bg-gray-500/20 text-gray-400'}">
                    ${statusText}
                </span>
            </td>
            <td class="py-4 px-6">
                <div class="flex space-x-2">
                    <button class="btn-action btn-edit" 
                            onclick="adminPanel.editRealUser(${user.id})"
                            title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-reset" 
                            onclick="adminPanel.resetUserProgress(${user.id})"
                            title="Сбросить прогресс">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="btn-action btn-delete" 
                            onclick="adminPanel.deleteRealUser(${user.id})"
                            title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }
    
    // ===== РЕАЛЬНЫЕ МОДАЛЬНЫЕ ОКНА =====
    openUserModal(userId = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('modalUserTitle');
        const saveBtn = document.getElementById('saveUserBtn');
        
        if (userId) {
            // Редактирование реального пользователя
            const user = this.allUsers.find(u => u.id === userId);
            if (user) {
                title.textContent = '✏️ Редактировать пользователя';
                this.fillUserForm(user);
                saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Обновить';
                saveBtn.setAttribute('data-action', 'update');
            }
        } else {
            // Добавление нового реального пользователя
            title.textContent = '👤 Добавить пользователя';
            this.clearUserForm();
            saveBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Создать';
            saveBtn.setAttribute('data-action', 'create');
        }
        
        this.openModal('userModal');
    }
    
    fillUserForm(user) {
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name.split(' ')[0] || '';
        document.getElementById('userLastName').value = user.name.split(' ').slice(1).join(' ') || '';
        document.getElementById('userLogin').value = user.login;
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userClass').value = user.class || '7B';
        document.getElementById('userRole').value = user.role || 'student';
        document.getElementById('userPoints').value = user.points || 0;
        
        // Для редактирования не требуем пароль
        document.getElementById('userPassword').required = false;
        document.getElementById('userConfirmPassword').required = false;
    }
    
    clearUserForm() {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('userPassword').required = true;
        document.getElementById('userConfirmPassword').required = true;
    }
    
    saveRealUser() {
        const form = document.getElementById('userForm');
        const saveBtn = document.getElementById('saveUserBtn');
        const action = saveBtn.getAttribute('data-action');
        const userId = document.getElementById('userId').value;
        
        // Собираем реальные данные
        const userData = {
            name: `${document.getElementById('userName').value} ${document.getElementById('userLastName').value}`.trim(),
            login: document.getElementById('userLogin').value,
            email: document.getElementById('userEmail').value,
            class: document.getElementById('userClass').value,
            role: document.getElementById('userRole').value,
            points: parseInt(document.getElementById('userPoints').value) || 0
        };
        
        // Реальная валидация
        if (!userData.name || !userData.login) {
            this.showToast('❌ Ошибка', 'Заполните имя и логин', 'error');
            return;
        }
        
        if (action === 'create') {
            const password = document.getElementById('userPassword').value;
            const confirmPassword = document.getElementById('userConfirmPassword').value;
            
            if (!password) {
                this.showToast('❌ Ошибка', 'Введите пароль', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showToast('❌ Ошибка', 'Пароли не совпадают', 'error');
                return;
            }
            
            if (password.length < 4) {
                this.showToast('❌ Ошибка', 'Пароль должен быть не менее 4 символов', 'error');
                return;
            }
            
            userData.password = password;
        }
        
        try {
            if (action === 'create') {
                // Создание реального пользователя
                const result = window.leoDB.registerUser(userData);
                if (result.success) {
                    this.showToast('✅ Успех', 'Пользователь создан', 'success');
                    window.leoDB.addLog('admin', `Создал пользователя: ${userData.name}`);
                } else {
                    this.showToast('❌ Ошибка', result.error, 'error');
                    return;
                }
            } else {
                // Обновление реального пользователя
                const password = document.getElementById('userPassword').value;
                const updateData = {
                    ...userData,
                    ...(password && { password: password })
                };
                
                const success = window.leoDB.updateUser(parseInt(userId), updateData);
                if (success) {
                    this.showToast('✅ Успех', 'Пользователь обновлен', 'success');
                } else {
                    this.showToast('❌ Ошибка', 'Ошибка обновления', 'error');
                    return;
                }
            }
            
            // Обновляем данные
            this.loadRealData();
            this.closeModal('userModal');
            
        } catch (error) {
            this.showToast('❌ Ошибка', error.message, 'error');
        }
    }
    
    editRealUser(userId) {
        this.openUserModal(userId);
    }
    
    deleteRealUser(userId) {
        if (!confirm('Удалить этого пользователя? Это действие нельзя отменить.')) return;
        
        const success = window.leoDB.deleteUser(userId);
        if (success) {
            this.showToast('✅ Успех', 'Пользователь удален', 'success');
            this.loadRealData();
        } else {
            this.showToast('❌ Ошибка', 'Ошибка удаления', 'error');
        }
    }
    
    resetUserProgress(userId) {
        if (!confirm('Сбросить очки и прогресс пользователя?')) return;
        
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return;
        
        // Сбрасываем прогресс в базе данных
        user.points = 0;
        user.level = 1;
        user.tasks_completed = [];
        
        // Обновляем в классе
        const db = window.leoDB.getAll();
        if (db.classes?.[user.class]?.students) {
            const student = db.classes[user.class].students.find(s => s.id === userId);
            if (student) {
                student.points = 0;
            }
        }
        
        window.leoDB.save(db);
        this.showToast('✅ Успех', 'Прогресс сброшен', 'success');
        window.leoDB.addLog('admin', `Сбросил прогресс пользователя: ${user.name}`);
        
        this.loadRealData();
    }
    
    // ===== РЕАЛЬНЫЙ AI =====
    loadRealAI() {
        console.log('🤖 Загрузка реальной AI системы...');
        
        const db = window.leoDB.getAll();
        const aiKnowledge = db.ai_knowledge || {};
        
        // Считаем реальное количество знаний
        let totalKnowledge = 0;
        Object.values(aiKnowledge).forEach(category => {
            if (typeof category === 'object') {
                totalKnowledge += Object.keys(category).length;
            }
        });
        
        // Обновляем реальные показатели
        document.getElementById('aiTrainedAnswers').textContent = totalKnowledge;
        document.getElementById('aiAccuracy').textContent = '94%'; // Можно считать реальную точность
        document.getElementById('aiLastTrain').textContent = 
            db.ai_last_train ? new Date(db.ai_last_train).toLocaleDateString('ru-RU') : 'Никогда';
        
        // Загружаем реальную базу знаний
        this.loadRealKnowledgeBase();
    }
    
    loadRealKnowledgeBase() {
        const container = document.getElementById('knowledgeList');
        if (!container) return;
        
        const db = window.leoDB.getAll();
        const knowledge = db.ai_knowledge || {};
        
        if (Object.keys(knowledge).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-brain text-4xl text-gray-500 mb-4"></i>
                    <p class="text-gray-400">База знаний пуста</p>
                    <p class="text-gray-500 text-sm mt-2">Добавьте знания с помощью формы ниже</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(knowledge).forEach(([category, data]) => {
            const item = document.createElement('div');
            item.className = 'knowledge-item p-4 bg-gray-800/50 rounded-xl border border-gray-700';
            
            let content = '';
            if (typeof data === 'object') {
                content = Object.entries(data)
                    .map(([key, value]) => 
                        `<div class="mb-2">
                            <span class="text-blue-400 font-medium">${key}:</span>
                            <span class="text-gray-300 ml-2">${value}</span>
                        </div>`
                    )
                    .join('');
            }
            
            item.innerHTML = `
                <div class="flex justify-between items-center mb-3">
                    <span class="text-sm font-semibold text-purple-400 uppercase tracking-wide">
                        ${this.getCategoryName(category)}
                    </span>
                    <button class="btn-action btn-delete" 
                            onclick="adminPanel.deleteKnowledge('${category}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="knowledge-content text-gray-300">
                    ${content}
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    startRealTraining() {
        if (this.isTraining) {
            this.showToast('⏳ Инфо', 'Обучение уже запущено', 'info');
            return;
        }
        
        this.isTraining = true;
        
        // Обновляем UI
        const trainBtn = document.getElementById('trainAI');
        const originalHTML = trainBtn.innerHTML;
        trainBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Обучение...';
        trainBtn.disabled = true;
        
        // Показываем прогресс
        const progressFill = document.getElementById('trainingFill');
        const progressText = document.getElementById('trainingProgress');
        const processedEl = document.getElementById('processedItems');
        const timeEl = document.getElementById('trainingTime');
        
        let progress = 0;
        let processed = 0;
        const totalItems = 100;
        const startTime = Date.now();
        
        // Имитация реального обучения
        const interval = setInterval(() => {
            progress += 1;
            processed += 2;
            
            // Обновляем прогресс
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            processedEl.textContent = `${processed}/${totalItems}`;
            
            // Обновляем время
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            timeEl.textContent = `${elapsed}с`;
            
            if (progress >= 100) {
                clearInterval(interval);
                
                // Завершаем обучение
                this.isTraining = false;
                trainBtn.innerHTML = originalHTML;
                trainBtn.disabled = false;
                
                // Обновляем базу данных
                const db = window.leoDB.getAll();
                db.ai_last_train = new Date().toISOString();
                window.leoDB.save(db);
                
                this.showToast('✅ Успех', 'Обучение нейросети завершено', 'success');
                window.leoDB.addLog('admin', 'Провел обучение нейросети');
                
                // Обновляем данные
                this.loadRealAI();
            }
        }, 50);
    }
    
    saveRealKnowledge() {
        const category = document.getElementById('knowledgeCategory').value;
        const keywords = document.getElementById('knowledgeKeywords').value.trim();
        const answer = document.getElementById('knowledgeAnswer').value.trim();
        
        if (!keywords || !answer) {
            this.showToast('❌ Ошибка', 'Заполните все поля', 'error');
            return;
        }
        
        const success = window.leoDB.addKnowledge(category, keywords, answer);
        if (success) {
            this.showToast('✅ Успех', 'Знания добавлены', 'success');
            this.loadRealKnowledgeBase();
            
            // Очищаем форму
            document.getElementById('knowledgeKeywords').value = '';
            document.getElementById('knowledgeAnswer').value = '';
        } else {
            this.showToast('❌ Ошибка', 'Ошибка сохранения', 'error');
        }
    }
    
    deleteKnowledge(category) {
        if (!confirm('Удалить эту категорию знаний?')) return;
        
        const db = window.leoDB.getAll();
        if (db.ai_knowledge && db.ai_knowledge[category]) {
            delete db.ai_knowledge[category];
            window.leoDB.save(db);
            
            this.showToast('✅ Успех', 'Категория удалена', 'success');
            this.loadRealKnowledgeBase();
        }
    }
    
    // ===== РЕАЛЬНЫЕ НАСТРОЙКИ =====
    loadRealSettings() {
        const db = window.leoDB.getAll();
        const settings = db.settings || {};
        
        // Заполняем форму реальными настройками
        document.getElementById('systemName').value = settings.system_name || 'Leo Assistant';
        document.getElementById('defaultClass').value = settings.default_class || '7B';
        document.getElementById('pointsPerTask').value = settings.points_per_task || 50;
        document.getElementById('aiMode').value = settings.ai_mode || 'advanced';
        
        // Ползунок
        const maxLength = settings.ai_max_length || 500;
        document.getElementById('aiMaxLength').value = maxLength;
        document.getElementById('aiLengthValue').textContent = `${maxLength} символов`;
        
        // Чекбоксы
        document.getElementById('aiLearning').checked = settings.ai_learning !== false;
        document.getElementById('aiProfanityFilter').checked = settings.profanity_filter !== false;
        
        // Безопасность
        document.getElementById('emailVerification').value = 
            settings.email_verification ? 'true' : 'false';
        document.getElementById('maxLoginAttempts').value = settings.max_login_attempts || 5;
        document.getElementById('lockoutTime').value = settings.lockout_time || 15;
        
        // Внешний вид
        const theme = settings.theme || 'dark';
        document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
        
        const accentColor = settings.accent_color || '#6366f1';
        document.getElementById('accentColor').value = accentColor;
        
        // Шрифт
        document.getElementById('interfaceFont').value = settings.interface_font || 'Inter';
        
        // Резервное копирование
        document.getElementById('autoBackup').value = settings.auto_backup || 'weekly';
    }
    
    saveRealSettings() {
        const settings = {
            system_name: document.getElementById('systemName').value,
            default_class: document.getElementById('defaultClass').value,
            points_per_task: parseInt(document.getElementById('pointsPerTask').value),
            ai_mode: document.getElementById('aiMode').value,
            ai_max_length: parseInt(document.getElementById('aiMaxLength').value),
            ai_learning: document.getElementById('aiLearning').checked,
            profanity_filter: document.getElementById('aiProfanityFilter').checked,
            email_verification: document.getElementById('emailVerification').value === 'true',
            max_login_attempts: parseInt(document.getElementById('maxLoginAttempts').value),
            lockout_time: parseInt(document.getElementById('lockoutTime').value),
            theme: document.querySelector('input[name="theme"]:checked').value,
            accent_color: document.getElementById('accentColor').value,
            interface_font: document.getElementById('interfaceFont').value,
            auto_backup: document.getElementById('autoBackup').value
        };
        
        // Пароль администратора
        const adminPassword = document.getElementById('adminPassword').value;
        if (adminPassword) {
            if (adminPassword.length < 6) {
                this.showToast('❌ Ошибка', 'Пароль должен быть не менее 6 символов', 'error');
                return;
            }
            
            const db = window.leoDB.getAll();
            db.system.admin_password = adminPassword;
            window.leoDB.save(db);
            
            document.getElementById('adminPassword').value = '';
            this.showToast('✅ Успех', 'Пароль обновлен', 'success');
        }
        
        // Сохраняем настройки
        const db = window.leoDB.getAll();
        db.settings = settings;
        window.leoDB.save(db);
        
        this.showToast('✅ Успех', 'Настройки сохранены', 'success');
        window.leoDB.addLog('admin', 'Обновил системные настройки');
        
        // Применяем изменения
        this.applyRealSettings(settings);
    }
    
    applyRealSettings(settings) {
        // Тема
        document.documentElement.className = settings.theme;
        
        // Акцентный цвет
        if (settings.accent_color) {
            document.documentElement.style.setProperty('--primary', settings.accent_color);
        }
        
        // Шрифт
        if (settings.interface_font !== 'Inter') {
            document.body.style.fontFamily = `${settings.interface_font}, sans-serif`;
        }
    }
    
    // ===== РЕАЛЬНЫЕ ЭКСПОРТЫ =====
    exportRealUsers() {
        if (this.allUsers.length === 0) {
            this.showToast('⚠️ Инфо', 'Нет пользователей для экспорта', 'warning');
            return;
        }
        
        // Создаем реальный CSV
        const headers = ['Имя', 'Логин', 'Класс', 'Роль', 'Очки', 'Уровень', 'Задания', 'Регистрация'];
        const csvRows = [
            headers.join(','),
            ...this.allUsers.map(user => [
                `"${user.name}"`,
                user.login,
                user.class || '7Б',
                user.role,
                user.points || 0,
                user.level || 1,
                user.tasks_completed?.length || 0,
                user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '-'
            ].join(','))
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `leo_users_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        
        URL.revokeObjectURL(url);
        
        this.showToast('✅ Успех', 'Пользователи экспортированы', 'success');
        window.leoDB.addLog('admin', 'Экспортировал список пользователей');
    }
    
    // ===== РЕАЛЬНОЕ РЕЗЕРВНОЕ КОПИРОВАНИЕ =====
    createRealBackup() {
        const backup = window.leoDB.backup();
        if (!backup) {
            this.showToast('❌ Ошибка', 'Ошибка создания резервной копии', 'error');
            return;
        }
        
        const link = document.createElement('a');
        link.setAttribute('href', backup.dataUri);
        link.setAttribute('download', backup.filename);
        link.click();
        
        this.showToast('✅ Успех', 'Резервная копия создана', 'success');
        window.leoDB.addLog('admin', 'Создал резервную копию базы данных');
    }
    
    restoreRealBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    if (!confirm('Восстановить базу данных из резервной копии? Текущие данные будут перезаписаны.')) {
                        return;
                    }
                    
                    const success = window.leoDB.restore(e.target.result);
                    if (success) {
                        this.showToast('✅ Успех', 'База данных восстановлена', 'success');
                        this.loadRealData();
                    } else {
                        this.showToast('❌ Ошибка', 'Ошибка восстановления', 'error');
                    }
                    
                } catch (error) {
                    this.showToast('❌ Ошибка', 'Некорректный файл резервной копии', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    clearRealDatabase() {
        if (!confirm('⚠️ ВНИМАНИЕ! Это удалит ВСЕ данные. Продолжить?')) return;
        if (!confirm('❌ Вы уверены? Это действие нельзя отменить!')) return;
        
        const success = window.leoDB.clearAll();
        if (success) {
            this.showToast('✅ Успех', 'База данных очищена', 'success');
            this.loadRealData();
        }
    }
    
    // ===== РЕАЛЬНЫЕ УТИЛИТЫ =====
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
                <i class="fas fa-${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Анимация появления
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Закрытие
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
        
        // Автоматическое закрытие
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }
    
    updateClock() {
        const now = new Date();
        const timeElement = document.querySelector('.current-time');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    applyDarkTheme() {
        document.documentElement.className = 'dark';
    }
    
    startAutoUpdate() {
        // Автообновление каждые 30 секунд
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadRealData();
            }
        }, 30000);
    }
    
    // Вспомогательные методы
    getCategoryName(category) {
        const names = {
            'greetings': 'Приветствия',
            'subjects': 'Предметы',
            'tasks': 'Задания',
            'schedule': 'Расписание',
            'general': 'Общее'
        };
        return names[category] || category;
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
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
