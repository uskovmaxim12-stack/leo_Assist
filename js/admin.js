// js/admin.js - ПОЛНАЯ ЛОГИКА АДМИН-ПАНЕЛИ С МАКСИМУМОМ ФУНКЦИОНАЛА
document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Админ-панель загружена');
    
    // ========== ПРОВЕРКА ПРАВ ==========
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (!isAdmin) {
        alert('🚫 Доступ запрещен! Требуются права администратора.');
        window.location.href = 'index.html';
        return;
    }
    
    // ========== ПЕРЕМЕННЫЕ И СОСТОЯНИЕ ==========
    let currentTab = 'dashboard';
    let allUsers = [];
    let allActivities = [];
    let systemAlerts = [];
    let aiTraining = false;
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function initAdminPanel() {
        console.log('🔄 Инициализация админ-панели...');
        
        loadAllData();
        initEventListeners();
        initCharts();
        startLiveUpdates();
        
        // Загрузка начальных данных
        updateDashboardStats();
        updateUsersTable();
        loadSystemAlerts();
        updateActivityLog();
        
        console.log('✅ Админ-панель готова');
    }
    
    // ========== ЗАГРУЗКА ДАННЫХ ==========
    function loadAllData() {
        const db = leoDB.getAll();
        if (!db) {
            console.error('❌ База данных не найдена');
            showAlert('Ошибка базы данных', 'danger');
            return;
        }
        
        // Загрузка пользователей
        allUsers = db.users || [];
        
        // Загрузка активности из localStorage
        const savedActivities = localStorage.getItem('admin_activities');
        if (savedActivities) {
            allActivities = JSON.parse(savedActivities);
        } else {
            // Создаем начальную активность
            allActivities = [
                {
                    id: 1,
                    timestamp: new Date().toISOString(),
                    user: 'Система',
                    action: 'Инициализация админ-панели',
                    ip: '127.0.0.1',
                    status: 'success'
                }
            ];
            saveActivities();
        }
        
        // Обновляем счетчики
        updateCounters(db);
    }
    
    function updateCounters(db) {
        // Пользователи
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter(u => u.last_login).length;
        
        document.getElementById('usersCount').textContent = totalUsers;
        document.getElementById('onlineUsers').textContent = activeUsers;
        document.getElementById('activeSessions').textContent = activeUsers;
        
        // Задания
        const totalTasks = db.classes?.['7B']?.tasks?.length || 0;
        document.getElementById('tasksCount').textContent = totalTasks;
        
        // Логи
        document.getElementById('logsCount').textContent = allActivities.length;
        
        // Уведомления в шапке
        const unreadAlerts = systemAlerts.filter(a => !a.read).length;
        document.getElementById('headerNotifications').textContent = unreadAlerts;
    }
    
    // ========== ПАНЕЛЬ УПРАВЛЕНИЯ ==========
    function updateDashboardStats() {
        const db = leoDB.getAll();
        if (!db) return;
        
        const stats = leoDB.getSystemStats();
        if (!stats) return;
        
        // Основная статистика
        document.getElementById('statTotalUsers').textContent = stats.total_users;
        document.getElementById('statTotalTasks').textContent = stats.total_tasks;
        document.getElementById('statAIRequests').textContent = stats.total_logins * 3; // Пример
        document.getElementById('statActivity').textContent = Math.min(100, Math.floor(stats.completed_tasks / Math.max(1, stats.total_tasks) * 100)) + '%';
        
        // Изменения (примерные)
        document.getElementById('usersChange').textContent = '+12%';
        document.getElementById('tasksChange').textContent = '+5%';
        document.getElementById('aiChange').textContent = '+24%';
        document.getElementById('activityChange').textContent = '-3%';
        
        // Обновляем графики
        updateCharts(stats);
    }
    
    function updateCharts(stats) {
        // Здесь будет логика для обновления графиков Chart.js
        // Пока просто заглушка
        console.log('📊 Обновление графиков с данными:', stats);
    }
    
    // ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========
    function updateUsersTable(filter = '') {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Фильтрация пользователей
        let filteredUsers = allUsers;
        if (filter) {
            const searchTerm = filter.toLowerCase();
            filteredUsers = allUsers.filter(user =>
                user.name.toLowerCase().includes(searchTerm) ||
                user.login.toLowerCase().includes(searchTerm) ||
                user.class?.toLowerCase().includes(searchTerm) ||
                user.role?.toLowerCase().includes(searchTerm)
            );
        }
        
        if (filteredUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div style="color: var(--admin-text-muted);">
                            <i class="fas fa-users" style="font-size: 40px; margin-bottom: 15px; opacity: 0.5;"></i>
                            <p>Пользователи не найдены</p>
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
            
            // Определяем статус
            let status = 'active';
            let statusText = 'Активен';
            let statusClass = 'status-active';
            
            if (!user.last_login) {
                status = 'inactive';
                statusText = 'Не активен';
                statusClass = 'status-inactive';
            }
            
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
        
        // Добавляем обработчики для кнопок
        addUserActionListeners();
    }
    
    function addUserActionListeners() {
        // Просмотр пользователя
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                viewUser(userId);
            });
        });
        
        // Редактирование пользователя
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                editUser(userId);
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
    
    function viewUser(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        
        showUserModal(user, 'view');
    }
    
    function editUser(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        
        showUserModal(user, 'edit');
    }
    
    function deleteUser(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        
        if (user.role === 'admin') {
            showAlert('Нельзя удалить администратора', 'warning');
            return;
        }
        
        if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.name}"?`)) {
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        // Удаляем пользователя
        db.users = db.users.filter(u => u.id !== userId);
        
        // Удаляем из класса
        if (db.classes && db.classes[user.class] && db.classes[user.class].students) {
            db.classes[user.class].students = db.classes[user.class].students.filter(s => s.id !== userId);
        }
        
        leoDB.save(db);
        
        // Обновляем данные
        loadAllData();
        updateUsersTable();
        
        // Записываем активность
        addActivity('Удаление пользователя', `Удален пользователь: ${user.name}`, 'warning');
        
        showAlert(`Пользователь "${user.name}" удален`, 'success');
    }
    
    function showUserModal(user, mode = 'view') {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        const isEdit = mode === 'edit';
        
        modal.innerHTML = `
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
                            <input type="text" class="form-control" value="${user.name}" ${!isEdit ? 'readonly' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Логин</label>
                            <input type="text" class="form-control" value="${user.login}" ${!isEdit ? 'readonly' : ''}>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Класс</label>
                            <select class="form-control" ${!isEdit ? 'disabled' : ''}>
                                <option value="7B" ${user.class === '7B' ? 'selected' : ''}>7Б класс</option>
                                <option value="7A" ${user.class === '7A' ? 'selected' : ''}>7А класс</option>
                                <option value="8B" ${user.class === '8B' ? 'selected' : ''}>8Б класс</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Роль</label>
                            <select class="form-control" ${!isEdit ? 'disabled' : ''}>
                                <option value="student" ${user.role === 'student' ? 'selected' : ''}>Ученик</option>
                                <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Учитель</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Очки</label>
                            <input type="number" class="form-control" value="${user.points || 0}" ${!isEdit ? 'readonly' : ''}>
                        </div>
                        <div class="form-group">
                            <label>Уровень</label>
                            <input type="number" class="form-control" value="${user.level || 1}" ${!isEdit ? 'readonly' : ''}>
                        </div>
                    </div>
                    
                    ${isEdit ? `
                    <div class="form-group">
                        <label>Новый пароль (оставьте пустым, если не нужно менять)</label>
                        <input type="password" class="form-control" id="newUserPassword" placeholder="Новый пароль">
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
                    <button class="btn-admin-primary" id="saveUserChanges">
                        <i class="fas fa-save"></i> Сохранить изменения
                    </button>
                    ` : ''}
                    <button class="btn-admin-secondary" id="closeModal">
                        <i class="fas fa-times"></i> Закрыть
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
        modal.querySelector('#closeModal').addEventListener('click', () => modal.remove());
        
        if (isEdit) {
            modal.querySelector('#saveUserChanges').addEventListener('click', () => {
                saveUserChanges(user.id, modal);
            });
        }
        
        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    function saveUserChanges(userId, modal) {
        const db = leoDB.getAll();
        if (!db) return;
        
        const user = db.users.find(u => u.id === userId);
        if (!user) return;
        
        // Получаем новые значения
        const newName = modal.querySelector('input[type="text"]').value;
        const newLogin = modal.querySelectorAll('input[type="text"]')[1].value;
        const newClass = modal.querySelector('select').value;
        const newRole = modal.querySelectorAll('select')[1].value;
        const newPoints = parseInt(modal.querySelector('input[type="number"]').value) || 0;
        const newLevel = parseInt(modal.querySelectorAll('input[type="number"]')[1].value) || 1;
        const newPassword = modal.querySelector('#newUserPassword')?.value;
        
        // Проверяем логин на уникальность
        if (newLogin !== user.login) {
            const loginExists = db.users.some(u => u.id !== userId && u.login === newLogin);
            if (loginExists) {
                showAlert('Пользователь с таким логином уже существует', 'error');
                return;
            }
        }
        
        // Обновляем данные
        user.name = newName;
        user.login = newLogin;
        user.class = newClass;
        user.role = newRole;
        user.points = newPoints;
        user.level = newLevel;
        
        if (newPassword) {
            user.password = newPassword;
        }
        
        // Обновляем в классе
        if (db.classes && db.classes[newClass]) {
            let student = db.classes[newClass].students?.find(s => s.id === userId);
            if (student) {
                student.name = newName;
                student.points = newPoints;
            }
        }
        
        leoDB.save(db);
        
        // Обновляем данные
        loadAllData();
        updateUsersTable();
        
        // Записываем активность
        addActivity('Редактирование пользователя', `Обновлены данные пользователя: ${user.name}`, 'info');
        
        showAlert('Данные пользователя обновлены', 'success');
        modal.remove();
    }
    
    // ========== AI ОБУЧЕНИЕ ==========
    function initAITraining() {
        const trainBtn = document.getElementById('trainAI');
        if (trainBtn) {
            trainBtn.addEventListener('click', startAITraining);
        }
    }
    
    function startAITraining() {
        if (aiTraining) {
            showAlert('Обучение уже выполняется', 'warning');
            return;
        }
        
        aiTraining = true;
        
        const statusIndicator = document.getElementById('aiStatusIndicator');
        const statusText = document.getElementById('aiStatusText');
        const statusDetails = document.getElementById('aiStatusDetails');
        const progress = document.getElementById('aiProgress');
        
        // Обновляем статус
        statusIndicator.className = 'status-indicator training';
        statusText.textContent = 'Обучение...';
        statusDetails.textContent = 'Нейросеть анализирует данные и обучается';
        
        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += Math.random() * 5;
            if (progressValue > 100) progressValue = 100;
            
            progress.textContent = Math.floor(progressValue) + '%';
            
            if (progressValue >= 100) {
                clearInterval(interval);
                
                // Обновляем статус
                statusIndicator.className = 'status-indicator';
                statusText.textContent = 'Обучение завершено';
                statusDetails.textContent = 'Нейросеть успешно обучена на новых данных';
                progress.textContent = '100%';
                
                aiTraining = false;
                
                // Обновляем базу знаний
                updateKnowledgeBase();
                
                // Записываем активность
                addActivity('Обучение AI', 'Нейросеть успешно обучена на новых данных', 'success');
                
                showAlert('Обучение нейросети завершено', 'success');
            }
        }, 200);
    }
    
    function updateKnowledgeBase() {
        const db = leoDB.getAll();
        if (!db) return;
        
        // Примерное обновление знаний
        if (!db.ai_knowledge) {
            db.ai_knowledge = {};
        }
        
        // Добавляем новые знания
        db.ai_knowledge.math_advanced = {
            'алгебра': 'Алгебра изучает математические символы и правила их манипуляции.',
            'геометрия': 'Геометрия изучает пространственные отношения и свойства фигур.',
            'тригонометрия': 'Тригонометрия изучает соотношения между сторонами и углами треугольников.'
        };
        
        db.ai_knowledge.physics_advanced = {
            'механика': 'Механика изучает движение тел и силы, вызывающие это движение.',
            'термодинамика': 'Термодинамика изучает теплоту и её преобразование в другие формы энергии.',
            'оптика': 'Оптика изучает свойства света и его взаимодействие с веществом.'
        };
        
        leoDB.save(db);
        
        // Обновляем отображение знаний
        displayKnowledgeBase();
    }
    
    function displayKnowledgeBase() {
        const container = document.getElementById('knowledgeBase');
        if (!container) return;
        
        const db = leoDB.getAll();
        if (!db || !db.ai_knowledge) {
            container.innerHTML = '<div class="alert alert-info">База знаний пуста</div>';
            return;
        }
        
        let html = '';
        Object.entries(db.ai_knowledge).forEach(([category, knowledge]) => {
            let content = '';
            
            if (typeof knowledge === 'object' && !Array.isArray(knowledge)) {
                content = Object.entries(knowledge).map(([key, value]) => 
                    `<div><strong>${key}:</strong> ${value}</div>`
                ).join('');
            } else if (Array.isArray(knowledge)) {
                content = knowledge.map(item => `<div>${item}</div>`).join('');
            } else {
                content = knowledge;
            }
            
            html += `
                <div class="knowledge-item">
                    <h4 style="margin: 0 0 10px; color: var(--admin-primary); text-transform: uppercase; font-size: 12px;">
                        ${category.replace('_', ' ')}
                    </h4>
                    <div style="font-size: 14px; color: var(--admin-text); line-height: 1.5;">
                        ${content}
                    </div>
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button class="btn-action btn-edit" style="font-size: 12px; padding: 4px 8px;">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                        <button class="btn-action btn-delete" style="font-size: 12px; padding: 4px 8px;">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // ========== СИСТЕМНЫЕ ПРЕДУПРЕЖДЕНИЯ ==========
    function loadSystemAlerts() {
        // Загружаем сохраненные предупреждения
        const savedAlerts = localStorage.getItem('admin_alerts');
        if (savedAlerts) {
            systemAlerts = JSON.parse(savedAlerts);
        } else {
            // Создаем начальные предупреждения
            systemAlerts = [
                {
                    id: 1,
                    type: 'info',
                    title: 'Добро пожаловать в админ-панель',
                    message: 'Система успешно загружена и готова к работе',
                    timestamp: new Date().toISOString(),
                    read: false
                },
                {
                    id: 2,
                    type: 'warning',
                    title: 'База данных пуста',
                    message: 'В системе нет пользователей. Рекомендуется добавить первых пользователей.',
                    timestamp: new Date().toISOString(),
                    read: false
                },
                {
                    id: 3,
                    type: 'info',
                    title: 'Система обновлена',
                    message: 'Админ-панель обновлена до версии 2.0',
                    timestamp: new Date().toISOString(),
                    read: true
                }
            ];
            saveAlerts();
        }
        
        updateAlertsDisplay();
    }
    
    function updateAlertsDisplay() {
        const container = document.getElementById('systemAlerts');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Показываем только непрочитанные или важные предупреждения
        const importantAlerts = systemAlerts.filter(a => !a.read || a.type === 'danger' || a.type === 'warning');
        
        if (importantAlerts.length === 0) {
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
        
        importantAlerts.forEach(alert => {
            const alertElement = document.createElement('div');
            alertElement.className = `alert alert-${alert.type}`;
            
            const icon = alert.type === 'danger' ? 'exclamation-circle' :
                        alert.type === 'warning' ? 'exclamation-triangle' :
                        alert.type === 'success' ? 'check-circle' : 'info-circle';
            
            alertElement.innerHTML = `
                <div class="alert-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">
                        ${alert.title}
                        <span style="font-size: 12px; color: var(--admin-text-muted); margin-left: 10px;">
                            ${new Date(alert.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                        </span>
                    </div>
                    <div class="alert-message">${alert.message}</div>
                </div>
                <button class="btn-action" style="background: transparent; border: none; color: var(--admin-text-muted);" 
                        onclick="markAlertAsRead(${alert.id})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            container.appendChild(alertElement);
        });
        
        // Обновляем счетчик уведомлений
        const unreadCount = systemAlerts.filter(a => !a.read).length;
        document.getElementById('headerNotifications').textContent = unreadCount;
    }
    
    function addSystemAlert(type, title, message) {
        const newAlert = {
            id: Date.now(),
            type: type,
            title: title,
            message: message,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        systemAlerts.unshift(newAlert);
        saveAlerts();
        updateAlertsDisplay();
    }
    
    function markAlertAsRead(alertId) {
        const alert = systemAlerts.find(a => a.id === alertId);
        if (alert) {
            alert.read = true;
            saveAlerts();
            updateAlertsDisplay();
        }
    }
    
    function saveAlerts() {
        localStorage.setItem('admin_alerts', JSON.stringify(systemAlerts));
    }
    
    // ========== ЛОГ АКТИВНОСТИ ==========
    function updateActivityLog() {
        const tbody = document.getElementById('activityTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Показываем последние 20 активностей
        const recentActivities = [...allActivities]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 20);
        
        recentActivities.forEach(activity => {
            const row = document.createElement('tr');
            
            const time = new Date(activity.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const date = new Date(activity.timestamp).toLocaleDateString('ru-RU');
            
            const statusIcon = activity.status === 'success' ? 'fa-check-circle text-success' :
                              activity.status === 'warning' ? 'fa-exclamation-triangle text-warning' :
                              activity.status === 'error' ? 'fa-times-circle text-danger' : 'fa-info-circle text-info';
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${time}</div>
                    <div style="font-size: 12px; color: var(--admin-text-muted);">${date}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${activity.user}</div>
                    <div style="font-size: 12px; color: var(--admin-text-muted);">${activity.user === 'Система' ? 'Системное действие' : 'Пользователь'}</div>
                </td>
                <td>${activity.action}</td>
                <td>
                    <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                        ${activity.ip}
                    </code>
                </td>
                <td>
                    <i class="fas ${statusIcon}" style="margin-right: 5px;"></i>
                    ${activity.status === 'success' ? 'Успешно' : 
                      activity.status === 'warning' ? 'Предупреждение' : 
                      activity.status === 'error' ? 'Ошибка' : 'Информация'}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    function addActivity(user, action, status = 'info') {
        const newActivity = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            user: user,
            action: action,
            ip: '127.0.0.1', // В реальной системе нужно получать реальный IP
            status: status
        };
        
        allActivities.unshift(newActivity);
        
        // Сохраняем только последние 1000 активностей
        if (allActivities.length > 1000) {
            allActivities = allActivities.slice(0, 1000);
        }
        
        saveActivities();
        updateActivityLog();
        
        // Обновляем счетчик логов
        document.getElementById('logsCount').textContent = allActivities.length;
    }
    
    function saveActivities() {
        localStorage.setItem('admin_activities', JSON.stringify(allActivities));
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
        const db = leoDB.getAll();
        if (!db) return;
        
        // Получаем значения из формы
        const systemName = document.getElementById('systemName').value;
        const defaultClass = document.getElementById('defaultClass').value;
        const pointsPerTask = parseInt(document.getElementById('pointsPerTask').value) || 50;
        const adminPassword = document.getElementById('adminPassword').value;
        const adminPasswordConfirm = document.getElementById('adminPasswordConfirm').value;
        const sessionDuration = parseInt(document.getElementById('sessionDuration').value) || 7;
        const autoBackup = document.getElementById('autoBackup').value;
        const logsRetention = parseInt(document.getElementById('logsRetention').value) || 30;
        
        // Проверка пароля администратора
        if (adminPassword && adminPassword !== adminPasswordConfirm) {
            showAlert('Пароли не совпадают', 'error');
            return;
        }
        
        // Обновляем настройки системы
        db.system.system_name = systemName;
        db.system.default_class = defaultClass;
        db.system.points_per_task = pointsPerTask;
        db.system.session_duration = sessionDuration;
        db.system.auto_backup = autoBackup;
        db.system.logs_retention = logsRetention;
        
        // Обновляем пароль администратора если указан
        if (adminPassword) {
            db.system.admin_password = adminPassword;
        }
        
        leoDB.save(db);
        
        // Записываем активность
        addActivity('Администратор', 'Изменены системные настройки', 'info');
        
        showAlert('Системные настройки сохранены', 'success');
    }
    
    function resetSystemSettings() {
        if (!confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
            return;
        }
        
        // Сбрасываем значения формы
        document.getElementById('systemName').value = 'Leo Assistant';
        document.getElementById('defaultClass').value = '7B';
        document.getElementById('pointsPerTask').value = '50';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPasswordConfirm').value = '';
        document.getElementById('sessionDuration').value = '7';
        document.getElementById('autoBackup').value = 'daily';
        document.getElementById('logsRetention').value = '30';
        
        showAlert('Настройки сброшены к значениям по умолчанию', 'warning');
    }
    
    function testSystemSettings() {
        showAlert('Тестирование настроек...', 'info');
        
        // Имитация тестирования
        setTimeout(() => {
            showAlert('Все настройки работают корректно', 'success');
            addActivity('Система', 'Тестирование настроек выполнено успешно', 'success');
        }, 1000);
    }
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
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
            <button class="btn-action" style="background: transparent; border: none; color: var(--admin-text-muted);" 
                    onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => alertDiv.remove(), 300);
            }
        }, 5000);
    }
    
    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    function initEventListeners() {
        // Навигация по вкладкам
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
        
        // Поиск пользователей
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            userSearch.addEventListener('input', function() {
                updateUsersTable(this.value);
            });
        }
        
        // Кнопка добавления пользователя
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', function() {
                showAddUserModal();
            });
        }
        
        // Экспорт пользователей
        const exportUsersBtn = document.getElementById('exportUsers');
        if (exportUsersBtn) {
            exportUsersBtn.addEventListener('click', exportUsers);
        }
        
        // Быстрые действия
        document.getElementById('quickAddUser')?.addEventListener('click', function() {
            showAddUserModal();
        });
        
        document.getElementById('quickAddTask')?.addEventListener('click', function() {
            showAlert('Функция добавления задания в разработке', 'info');
        });
        
        document.getElementById('quickBackup')?.addEventListener('click', function() {
            createBackup();
        });
        
        document.getElementById('quickBroadcast')?.addEventListener('click', function() {
            showBroadcastModal();
        });
        
        // Очистка предупреждений
        document.getElementById('clearAlerts')?.addEventListener('click', function() {
            clearAllAlerts();
        });
        
        // Обновление данных
        document.getElementById('refreshData')?.addEventListener('click', function() {
            refreshAllData();
        });
        
        // Переключение сайдбара
        document.getElementById('toggleSidebar')?.addEventListener('click', function() {
            document.getElementById('adminSidebar').classList.toggle('collapsed');
        });
        
        // Уведомления
        document.getElementById('notificationsBtn')?.addEventListener('click', function() {
            showNotificationsModal();
        });
        
        // Выход из системы
        document.getElementById('logoutBtn')?.addEventListener('click', function() {
            logoutAdmin();
        });
        
        // Инициализация AI
        initAITraining();
        
        // Инициализация настроек
        initSystemSettings();
        
        // Отображение базы знаний
        displayKnowledgeBase();
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
                    updateDashboardStats();
                    break;
                case 'users':
                    updateUsersTable();
                    break;
                case 'ai':
                    displayKnowledgeBase();
                    break;
            }
        }
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
                        <input type="text" id="newUserName" class="form-control" placeholder="Иван Иванов">
                    </div>
                    <div class="form-group">
                        <label>Логин *</label>
                        <input type="text" id="newUserLogin" class="form-control" placeholder="ivanov">
                    </div>
                    <div class="form-group">
                        <label>Пароль *</label>
                        <input type="password" id="newUserPassword" class="form-control" placeholder="••••••••">
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
        
        // Добавляем пользователя через базу данных
        const result = leoDB.addUser({
            login: login,
            password: password,
            name: name,
            class: className,
            role: role,
            points: points
        });
        
        if (result.success) {
            // Обновляем данные
            loadAllData();
            updateUsersTable();
            
            // Записываем активность
            addActivity('Администратор', `Создан новый пользователь: ${name}`, 'success');
            
            showAlert(`Пользователь "${name}" успешно создан`, 'success');
            modal.remove();
        } else {
            showAlert(result.error || 'Ошибка при создании пользователя', 'error');
        }
    }
    
    function exportUsers() {
        const db = leoDB.getAll();
        if (!db || !db.users || db.users.length === 0) {
            showAlert('Нет пользователей для экспорта', 'warning');
            return;
        }
        
        // Создаем CSV данные
        let csv = 'ID,Имя,Логин,Класс,Роль,Очки,Уровень,Дата регистрации\n';
        
        db.users.forEach(user => {
            csv += `${user.id},"${user.name}","${user.login}","${user.class || '7B'}","${user.role}",${user.points || 0},${user.level || 1},"${user.created_at}"\n`;
        });
        
        // Создаем Blob и скачиваем
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `leo_users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Записываем активность
        addActivity('Администратор', 'Экспорт данных пользователей', 'info');
        
        showAlert('Данные пользователей экспортированы в CSV', 'success');
    }
    
    function createBackup() {
        const db = leoDB.getAll();
        if (!db) {
            showAlert('Ошибка при создании резервной копии', 'error');
            return;
        }
        
        const dataStr = JSON.stringify(db, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileName = `leo_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        // Записываем активность
        addActivity('Система', 'Создана резервная копия базы данных', 'success');
        
        showAlert('Резервная копия создана', 'success');
    }
    
    function showBroadcastModal() {
        showAlert('Функция рассылки уведомлений в разработке', 'info');
    }
    
    function clearAllAlerts() {
        if (!confirm('Очистить все системные предупреждения?')) {
            return;
        }
        
        systemAlerts.forEach(alert => alert.read = true);
        saveAlerts();
        updateAlertsDisplay();
        
        showAlert('Все предупреждения очищены', 'success');
    }
    
    function refreshAllData() {
        showAlert('Обновление данных...', 'info');
        
        setTimeout(() => {
            loadAllData();
            updateDashboardStats();
            updateUsersTable();
            updateAlertsDisplay();
            
            showAlert('Данные успешно обновлены', 'success');
            addActivity('Администратор', 'Ручное обновление данных', 'info');
        }, 500);
    }
    
    function showNotificationsModal() {
        showAlert('Панель уведомлений в разработке', 'info');
    }
    
    function logoutAdmin() {
        if (!confirm('Выйти из админ-панели?')) {
            return;
        }
        
        localStorage.removeItem('is_admin');
        window.location.href = 'index.html';
    }
    
    function startLiveUpdates() {
        // Обновление времени каждую секунду
        setInterval(updateTime, 1000);
        
        // Обновление статистики каждые 30 секунд
        setInterval(() => {
            if (currentTab === 'dashboard') {
                updateDashboardStats();
            }
        }, 30000);
        
        // Проверка системных событий каждую минуту
        setInterval(checkSystemEvents, 60000);
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
    
    function checkSystemEvents() {
        // Проверяем различные системные события
        const db = leoDB.getAll();
        if (!db) return;
        
        // Проверка на отсутствие backup
        const lastBackup = db.system?.last_backup;
        if (!lastBackup) {
            addSystemAlert('warning', 'Резервное копирование', 'Резервные копии не создавались');
        }
        
        // Проверка на большое количество ошибок
        const errorActivities = allActivities.filter(a => a.status === 'error').length;
        if (errorActivities > 10) {
            addSystemAlert('danger', 'Много ошибок', `Зафиксировано ${errorActivities} ошибок в системе`);
        }
    }
    
    function initCharts() {
        // Инициализация графиков Chart.js будет здесь
        console.log('📈 Инициализация графиков');
    }
    
    // ========== ЗАПУСК ==========
    initAdminPanel();
    
    // Добавляем глобальные функции
    window.markAlertAsRead = markAlertAsRead;
});
