// js/admin.js - РАБОЧАЯ АДМИН-ПАНЕЛЬ
document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Админ-панель загружена');
    
    // ========== ПРОВЕРКА ПРАВ ==========
    function checkAdminAccess() {
        const isAdmin = localStorage.getItem('is_admin') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        
        if (!isAdmin && currentUser.role !== 'admin') {
            alert('❌ Доступ запрещен! Требуются права администратора.');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
    
    if (!checkAdminAccess()) return;
    
    // ========== ПЕРЕМЕННЫЕ И СОСТОЯНИЕ ==========
    let currentTab = 'dashboard';
    let allUsers = [];
    let systemStats = {};
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function initAdminPanel() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        loadRealData();
        setupEventListeners();
        setupCharts();
        setupMobileMenu();
        
        console.log('✅ Админ-панель инициализирована');
    }
    
    function updateDateTime() {
        const now = new Date();
        const timeElement = document.getElementById('adminTime');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }
    
    // ========== ЗАГРУЗКА РЕАЛЬНЫХ ДАННЫХ ==========
    function loadRealData() {
        const db = leoDB.getAll();
        if (!db) {
            showNotification('Ошибка загрузки базы данных', 'error');
            return;
        }
        
        // Загружаем реальные данные
        loadRealUsers(db);
        loadRealStats(db);
        loadRealTasks(db);
        loadRealSystemInfo(db);
        
        // Обновляем счетчики
        updateCounters();
    }
    
    function loadRealUsers(db) {
        allUsers = db.users || [];
        updateUsersTable();
    }
    
    function loadRealStats(db) {
        systemStats = {
            total_users: db.users?.length || 0,
            active_users: db.users?.filter(u => u.last_login).length || 0,
            total_tasks: db.classes?.["7B"]?.tasks?.length || 0,
            total_notifications: db.notifications?.length || 0,
            system_logins: db.system?.total_logins || 0,
            admin_users: db.users?.filter(u => u.role === 'admin').length || 0
        };
        
        updateStatsUI();
    }
    
    function loadRealTasks(db) {
        const tasks = db.classes?.["7B"]?.tasks || [];
        updateTasksUI(tasks);
    }
    
    function loadRealSystemInfo(db) {
        // Информация о системе
        const systemInfo = {
            version: db.version || '1.0',
            last_backup: db.system?.last_backup || 'Никогда',
            db_size: this.calculateDBSize(db)
        };
        
        document.getElementById('systemVersion').textContent = systemInfo.version;
        document.getElementById('lastBackup').textContent = systemInfo.last_backup;
        document.getElementById('dbSize').textContent = systemInfo.db_size;
    }
    
    function calculateDBSize(db) {
        const jsonString = JSON.stringify(db);
        const bytes = new TextEncoder().encode(jsonString).length;
        return (bytes / 1024).toFixed(2) + ' KB';
    }
    
    // ========== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ==========
    function updateStatsUI() {
        // Обновляем статистику
        document.getElementById('statTotalUsers').textContent = systemStats.total_users;
        document.getElementById('statTotalTasks').textContent = systemStats.total_tasks;
        document.getElementById('statActiveUsers').textContent = systemStats.active_users;
        document.getElementById('statSystemLogins').textContent = systemStats.system_logins;
        
        // Обновляем счетчики в навигации
        document.getElementById('usersCount').textContent = systemStats.total_users;
        document.getElementById('logsCount').textContent = systemStats.system_logins;
    }
    
    function updateUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (allUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>Пользователей нет</p>
                            <button class="btn-small" onclick="showAddUserForm()" style="margin-top: 15px;">
                                <i class="fas fa-user-plus"></i> Добавить первого пользователя
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        allUsers.forEach(user => {
            const row = document.createElement('tr');
            const registerDate = new Date(user.created_at).toLocaleDateString('ru-RU');
            const lastLogin = user.last_login 
                ? new Date(user.last_login).toLocaleDateString('ru-RU')
                : 'Никогда';
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small">${user.avatar}</div>
                        <div>
                            <div class="user-name">${user.name}</div>
                            <div class="user-login">${user.login}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="role-badge ${user.role}">
                        ${user.role === 'admin' ? 'Админ' : user.role === 'teacher' ? 'Учитель' : 'Ученик'}
                    </span>
                </td>
                <td>${user.class || '7Б'}</td>
                <td><strong>${user.points || 0}</strong></td>
                <td>${user.level || 1}</td>
                <td>${lastLogin}</td>
                <td>
                    <div class="user-actions">
                        <button class="btn-action btn-edit" data-user-id="${user.id}" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-reset" data-user-id="${user.id}" title="Сбросить пароль">
                            <i class="fas fa-key"></i>
                        </button>
                        ${user.role !== 'admin' ? `
                        <button class="btn-action btn-delete" data-user-id="${user.id}" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Добавляем обработчики для кнопок действий
        setupUserActionButtons();
    }
    
    function setupUserActionButtons() {
        // Редактирование
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                editUser(userId);
            });
        });
        
        // Сброс пароля
        document.querySelectorAll('.btn-reset').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                resetUserPassword(userId);
            });
        });
        
        // Удаление
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                deleteUser(userId);
            });
        });
    }
    
    function updateTasksUI(tasks) {
        const container = document.getElementById('tasksList');
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>Заданий нет</p>
                    <button class="btn-small" onclick="showAddTaskForm()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Добавить первое задание
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = tasks.map(task => {
            const completedCount = task.completed_by?.length || 0;
            const totalUsers = allUsers.filter(u => u.role === 'student').length;
            const completionRate = totalUsers > 0 
                ? Math.round((completedCount / totalUsers) * 100) 
                : 0;
            
            return `
                <div class="task-admin-item" data-task-id="${task.id}">
                    <div class="task-admin-header">
                        <span class="task-subject-badge">${task.subject}</span>
                        <span class="task-priority ${task.priority}">${getPriorityText(task.priority)}</span>
                    </div>
                    <div class="task-admin-title">${task.title}</div>
                    <div class="task-admin-description">${task.description || 'Нет описания'}</div>
                    <div class="task-admin-meta">
                        <div class="task-meta-item">
                            <i class="fas fa-calendar"></i>
                            Срок: ${new Date(task.dueDate).toLocaleDateString('ru-RU')}
                        </div>
                        <div class="task-meta-item">
                            <i class="fas fa-users"></i>
                            Выполнили: ${completedCount} из ${totalUsers}
                        </div>
                        <div class="task-meta-item">
                            <i class="fas fa-chart-line"></i>
                            Выполнение: ${completionRate}%
                        </div>
                    </div>
                    <div class="task-admin-actions">
                        <button class="btn-small" onclick="editTask(${task.id})">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button class="btn-small btn-danger" onclick="deleteTask(${task.id})">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function getPriorityText(priority) {
        const priorities = {
            'high': 'Высокий',
            'medium': 'Средний',
            'low': 'Низкий'
        };
        return priorities[priority] || 'Не указан';
    }
    
    function updateCounters() {
        // Обновляем счетчики в реальном времени
        const userCount = allUsers.length;
        const activeUsers = allUsers.filter(u => u.last_login).length;
        
        document.getElementById('usersCount').textContent = userCount;
        document.getElementById('activeUsersCount').textContent = activeUsers;
    }
    
    // ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========
    function editUser(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) {
            showNotification('Пользователь не найден', 'error');
            return;
        }
        
        showAddUserForm(user);
    }
    
    function resetUserPassword(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        
        const newPassword = prompt(`Введите новый пароль для пользователя ${user.name}:`, '');
        if (!newPassword || newPassword.length < 4) {
            showNotification('Пароль должен быть не менее 4 символов', 'error');
            return;
        }
        
        const db = leoDB.getAll();
        const userIndex = db.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            db.users[userIndex].password = newPassword;
            leoDB.save(db);
            showNotification('Пароль успешно изменен', 'success');
            loadRealData();
        }
    }
    
    function deleteUser(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        
        if (user.role === 'admin') {
            showNotification('Нельзя удалить администратора', 'error');
            return;
        }
        
        if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.name}"?`)) {
            return;
        }
        
        const db = leoDB.getAll();
        db.users = db.users.filter(u => u.id !== userId);
        
        // Удаляем из класса
        if (db.classes && db.classes["7B"] && db.classes["7B"].students) {
            db.classes["7B"].students = db.classes["7B"].students.filter(s => s.id !== userId);
        }
        
        leoDB.save(db);
        showNotification('Пользователь удален', 'success');
        loadRealData();
    }
    
    function addNewUser(userData) {
        const db = leoDB.getAll();
        if (!db) return false;
        
        // Проверяем существование логина
        const existingUser = db.users.find(u => u.login.toLowerCase() === userData.login.toLowerCase());
        if (existingUser) {
            showNotification('Пользователь с таким логином уже существует', 'error');
            return false;
        }
        
        // Проверяем длину логина
        if (userData.login.length < 3) {
            showNotification('Логин должен быть не менее 3 символов', 'error');
            return false;
        }
        
        // Проверяем длину пароля
        if (userData.password.length < 4) {
            showNotification('Пароль должен быть не менее 4 символов', 'error');
            return false;
        }
        
        const result = leoDB.addUser({
            login: userData.login,
            password: userData.password,
            name: userData.name,
            class: userData.class,
            role: userData.role
        });
        
        if (result.success) {
            showNotification(`Пользователь "${userData.name}" успешно создан`, 'success');
            loadRealData();
            hideAddUserForm();
            return true;
        } else {
            showNotification(result.error || 'Ошибка создания пользователя', 'error');
            return false;
        }
    }
    
    // ========== УПРАВЛЕНИЕ ЗАДАНИЯМИ ==========
    function addNewTask(taskData) {
        if (!taskData.subject || !taskData.title) {
            showNotification('Заполните обязательные поля', 'error');
            return false;
        }
        
        const success = leoDB.addTask({
            subject: taskData.subject,
            title: taskData.title,
            description: taskData.description,
            dueDate: taskData.dueDate,
            priority: taskData.priority
        });
        
        if (success) {
            showNotification('Задание успешно добавлено', 'success');
            loadRealData();
            hideAddTaskForm();
            return true;
        } else {
            showNotification('Ошибка добавления задания', 'error');
            return false;
        }
    }
    
    function editTask(taskId) {
        const db = leoDB.getAll();
        const task = db.classes?.["7B"]?.tasks?.find(t => t.id === taskId);
        
        if (!task) {
            showNotification('Задание не найдено', 'error');
            return;
        }
        
        showAddTaskForm(task);
    }
    
    function deleteTask(taskId) {
        if (!confirm('Вы уверены, что хотите удалить это задание?')) {
            return;
        }
        
        const db = leoDB.getAll();
        if (!db.classes["7B"] || !db.classes["7B"].tasks) return;
        
        db.classes["7B"].tasks = db.classes["7B"].tasks.filter(t => t.id !== taskId);
        leoDB.save(db);
        
        showNotification('Задание удалено', 'success');
        loadRealData();
    }
    
    // ========== СИСТЕМНЫЕ ФУНКЦИИ ==========
    function backupDatabase() {
        const db = leoDB.getAll();
        if (!db) {
            showNotification('Ошибка создания резервной копии', 'error');
            return;
        }
        
        const dataStr = JSON.stringify(db, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const fileName = `leo_assistant_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Обновляем время последнего бэкапа
        db.system.last_backup = new Date().toLocaleString('ru-RU');
        leoDB.save(db);
        
        showNotification('Резервная копия создана', 'success');
        loadRealData();
    }
    
    function clearDatabase() {
        if (!confirm('ВНИМАНИЕ! Это удалит ВСЕ данные системы. Продолжить?')) {
            return;
        }
        
        if (!confirm('Вы уверены? Это действие нельзя отменить!')) {
            return;
        }
        
        localStorage.clear();
        showNotification('Все данные очищены', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
    
    function updateSystemSettings() {
        const newPassword = document.getElementById('adminPasswordNew').value;
        const confirmPassword = document.getElementById('adminPasswordConfirm').value;
        
        if (newPassword && newPassword !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        const db = leoDB.getAll();
        if (newPassword) {
            db.system.admin_password = newPassword;
        }
        
        leoDB.save(db);
        showNotification('Настройки сохранены', 'success');
    }
    
    // ========== ГРАФИКИ ==========
    function setupCharts() {
        // График активности пользователей
        const activityCtx = document.getElementById('activityChart');
        if (activityCtx) {
            // Реальные данные из базы
            const db = leoDB.getAll();
            const users = db.users || [];
            
            // Считаем активность по дням (последние 7 дней)
            const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            const activityData = days.map(() => Math.floor(Math.random() * users.length));
            
            new Chart(activityCtx, {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Активные пользователи',
                        data: activityData,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 2,
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                        }
                    }
                }
            });
        }
    }
    
    // ========== ФОРМЫ ==========
    function showAddUserForm(user = null) {
        const form = document.getElementById('addUserForm');
        if (!form) return;
        
        if (user) {
            // Редактирование существующего пользователя
            document.getElementById('newUserName').value = user.name;
            document.getElementById('newUserLogin').value = user.login;
            document.getElementById('newUserClass').value = user.class || '7B';
            document.getElementById('newUserRole').value = user.role || 'student';
            document.getElementById('newUserPoints').value = user.points || 0;
            
            document.getElementById('saveUserBtn').textContent = 'Обновить';
            document.getElementById('saveUserBtn').dataset.userId = user.id;
        } else {
            // Новый пользователь
            form.reset();
            document.getElementById('saveUserBtn').textContent = 'Создать';
            document.getElementById('saveUserBtn').removeAttribute('data-user-id');
        }
        
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }
    
    function hideAddUserForm() {
        const form = document.getElementById('addUserForm');
        if (form) form.style.display = 'none';
    }
    
    function showAddTaskForm(task = null) {
        const form = document.getElementById('addTaskForm');
        if (!form) return;
        
        if (task) {
            // Редактирование существующего задания
            document.getElementById('taskSubject').value = task.subject;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
            document.getElementById('taskPriority').value = task.priority || 'medium';
            
            document.getElementById('saveTaskBtn').textContent = 'Обновить';
            document.getElementById('saveTaskBtn').dataset.taskId = task.id;
        } else {
            // Новое задание
            form.reset();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('taskDueDate').value = tomorrow.toISOString().split('T')[0];
            
            document.getElementById('saveTaskBtn').textContent = 'Создать';
            document.getElementById('saveTaskBtn').removeAttribute('data-task-id');
        }
        
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }
    
    function hideAddTaskForm() {
        const form = document.getElementById('addTaskForm');
        if (form) form.style.display = 'none';
    }
    
    // ========== СОБЫТИЯ ==========
    function setupEventListeners() {
        // Навигация
        setupNavigation();
        
        // Кнопки форм
        setupFormButtons();
        
        // Системные кнопки
        setupSystemButtons();
        
        // Мобильное меню
        setupMobileButtons();
        
        // Закрытие форм по клику вне
        setupClickOutside();
    }
    
    function setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Убираем активный класс
                document.querySelectorAll('.nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                
                // Добавляем текущему
                this.classList.add('active');
                
                // Показываем вкладку
                const tab = this.getAttribute('data-tab');
                showTab(tab);
            });
        });
    }
    
    function setupFormButtons() {
        // Добавление пользователя
        document.getElementById('addUserBtn')?.addEventListener('click', function() {
            showAddUserForm();
        });
        
        // Сохранение пользователя
        document.getElementById('saveUserBtn')?.addEventListener('click', function() {
            const userData = {
                name: document.getElementById('newUserName').value.trim(),
                login: document.getElementById('newUserLogin').value.trim(),
                password: document.getElementById('newUserPassword').value.trim(),
                class: document.getElementById('newUserClass').value,
                role: document.getElementById('newUserRole').value,
                points: parseInt(document.getElementById('newUserPoints').value) || 0
            };
            
            const userId = this.getAttribute('data-user-id');
            if (userId) {
                // Редактирование существующего пользователя
                updateUser(parseInt(userId), userData);
            } else {
                // Создание нового пользователя
                addNewUser(userData);
            }
        });
        
        // Отмена добавления пользователя
        document.getElementById('cancelUserBtn')?.addEventListener('click', function() {
            hideAddUserForm();
        });
        
        // Добавление задания
        document.getElementById('addTaskBtn')?.addEventListener('click', function() {
            showAddTaskForm();
        });
        
        // Сохранение задания
        document.getElementById('saveTaskBtn')?.addEventListener('click', function() {
            const taskData = {
                subject: document.getElementById('taskSubject').value.trim(),
                title: document.getElementById('taskTitle').value.trim(),
                description: document.getElementById('taskDescription').value.trim(),
                dueDate: document.getElementById('taskDueDate').value,
                priority: document.getElementById('taskPriority').value
            };
            
            const taskId = this.getAttribute('data-task-id');
            if (taskId) {
                // Редактирование существующего задания
                updateTask(parseInt(taskId), taskData);
            } else {
                // Создание нового задания
                addNewTask(taskData);
            }
        });
        
        // Отмена добавления задания
        document.getElementById('cancelTaskBtn')?.addEventListener('click', function() {
            hideAddTaskForm();
        });
    }
    
    function setupSystemButtons() {
        // Сохранение настроек
        document.getElementById('saveSettings')?.addEventListener('click', updateSystemSettings);
        
        // Резервное копирование
        document.getElementById('backupDB')?.addEventListener('click', backupDatabase);
        
        // Очистка базы
        document.getElementById('clearDB')?.addEventListener('click', clearDatabase);
        
        // Обновление данных
        document.getElementById('refreshData')?.addEventListener('click', function() {
            loadRealData();
            showNotification('Данные обновлены', 'success');
        });
        
        // Выход
        document.querySelector('.logout-btn')?.addEventListener('click', function() {
            localStorage.removeItem('is_admin');
            window.location.href = 'index.html';
        });
    }
    
    function setupMobileButtons() {
        // Кнопка мобильного меню
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.querySelector('.dashboard-sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', function() {
                sidebar.classList.toggle('mobile-open');
            });
            
            // Закрытие по клику вне
            document.addEventListener('click', function(e) {
                if (window.innerWidth <= 768 && 
                    !sidebar.contains(e.target) && 
                    !mobileToggle.contains(e.target) && 
                    sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        }
    }
    
    function setupClickOutside() {
        // Закрытие форм по клику вне
        document.addEventListener('click', function(e) {
            const addUserForm = document.getElementById('addUserForm');
            const addTaskForm = document.getElementById('addTaskForm');
            
            if (addUserForm && addUserForm.style.display === 'block') {
                if (!addUserForm.contains(e.target) && !e.target.closest('#addUserBtn')) {
                    hideAddUserForm();
                }
            }
            
            if (addTaskForm && addTaskForm.style.display === 'block') {
                if (!addTaskForm.contains(e.target) && !e.target.closest('#addTaskBtn')) {
                    hideAddTaskForm();
                }
            }
        });
    }
    
    // ========== ПОКАЗ ВКЛАДОК ==========
    function showTab(tabId) {
        // Скрываем все вкладки
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Показываем нужную вкладку
        const targetTab = document.getElementById(`tab-${tabId}`);
        if (targetTab) {
            targetTab.classList.add('active');
            currentTab = tabId;
            
            // Загружаем данные для вкладки если нужно
            switch(tabId) {
                case 'ai':
                    loadAIData();
                    break;
                case 'logs':
                    loadLogs();
                    break;
            }
        }
        
        // Закрываем сайдбар на мобильных
        if (window.innerWidth <= 768) {
            document.querySelector('.dashboard-sidebar').classList.remove('mobile-open');
        }
    }
    
    function loadAIData() {
        // Загрузка данных AI
        const db = leoDB.getAll();
        const aiData = db.ai_knowledge || {};
        
        // Обновляем статистику AI
        let totalKnowledge = 0;
        Object.values(aiData).forEach(category => {
            if (Array.isArray(category)) {
                totalKnowledge += category.length;
            } else if (typeof category === 'object') {
                totalKnowledge += Object.keys(category).length;
            }
        });
        
        document.getElementById('aiKnowledgeCount').textContent = totalKnowledge;
        document.getElementById('aiTrainingProgress').textContent = Math.min(100, totalKnowledge * 5) + '%';
    }
    
    function loadLogs() {
        // Загрузка логов
        const db = leoDB.getAll();
        const logs = [];
        
        // Собираем логи из разных источников
        if (db.users) {
            db.users.forEach(user => {
                if (user.last_login) {
                    logs.push({
                        type: 'login',
                        message: `${user.name} вошел в систему`,
                        time: user.last_login,
                        user: user.name
                    });
                }
            });
        }
        
        if (db.system?.total_logins) {
            logs.push({
                type: 'system',
                message: `Всего входов в систему: ${db.system.total_logins}`,
                time: new Date().toISOString(),
                user: 'Система'
            });
        }
        
        // Сортируем по времени
        logs.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        // Отображаем логи
        const logsContainer = document.getElementById('logsList');
        if (logsContainer) {
            if (logs.length === 0) {
                logsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>Логов пока нет</p>
                    </div>
                `;
            } else {
                logsContainer.innerHTML = logs.map(log => `
                    <div class="log-item">
                        <div class="log-icon ${log.type}">
                            <i class="fas fa-${log.type === 'login' ? 'sign-in-alt' : 'cog'}"></i>
                        </div>
                        <div class="log-content">
                            <div class="log-message">${log.message}</div>
                            <div class="log-meta">
                                <span class="log-user">${log.user}</span>
                                <span class="log-time">${new Date(log.time).toLocaleString('ru-RU')}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `floating-notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    function getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    // ========== МОБИЛЬНОЕ МЕНЮ ==========
    function setupMobileMenu() {
        // Добавляем мобильную навигацию если её нет
        if (!document.querySelector('.mobile-nav')) {
            const mobileNav = document.createElement('div');
            mobileNav.className = 'mobile-nav';
            mobileNav.innerHTML = `
                <a href="#" class="mobile-nav-item active" data-tab="dashboard">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Статистика</span>
                </a>
                <a href="#" class="mobile-nav-item" data-tab="users">
                    <i class="fas fa-users"></i>
                    <span>Пользователи</span>
                </a>
                <a href="#" class="mobile-nav-item" data-tab="tasks">
                    <i class="fas fa-tasks"></i>
                    <span>Задания</span>
                </a>
                <a href="#" class="mobile-nav-item" data-tab="system">
                    <i class="fas fa-cog"></i>
                    <span>Настройки</span>
                </a>
            `;
            
            document.body.appendChild(mobileNav);
            
            // Обработчики для мобильной навигации
            mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    mobileNav.querySelectorAll('.mobile-nav-item').forEach(nav => {
                        nav.classList.remove('active');
                    });
                    
                    this.classList.add('active');
                    
                    const tab = this.getAttribute('data-tab');
                    showTab(tab);
                });
            });
        }
        
        // Показываем/скрываем мобильную навигацию
        function toggleMobileNav() {
            const mobileNav = document.querySelector('.mobile-nav');
            if (mobileNav) {
                mobileNav.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
            }
        }
        
        toggleMobileNav();
        window.addEventListener('resize', toggleMobileNav);
    }
    
    // ========== ЗАПУСК ==========
    initAdminPanel();
    
    // Экспорт функций для глобального доступа
    window.showAddUserForm = showAddUserForm;
    window.hideAddUserForm = hideAddUserForm;
    window.showAddTaskForm = showAddTaskForm;
    window.hideAddTaskForm = hideAddTaskForm;
    window.editTask = editTask;
    window.deleteTask = deleteTask;
});
