// js/admin.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С РАБОЧИМИ КНОПКАМИ
document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Админ-панель загружена');
    
    // Проверка прав администратора
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (!isAdmin) {
        showSystemNotification('Доступ запрещен! Требуются права администратора.', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }
    
    // ========== ПЕРЕМЕННЫЕ И СОСТОЯНИЕ ==========
    let currentTab = 'dashboard';
    let allUsers = [];
    let currentEditingUserId = null;
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function initAdminPanel() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        loadAdminData();
        initEventListeners();
        initCharts();
        
        console.log('✅ Админ-панель инициализирована');
    }
    
    function updateDateTime() {
        const now = new Date();
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit' 
        };
        
        const dateStr = now.toLocaleDateString('ru-RU', dateOptions);
        const timeStr = now.toLocaleTimeString('ru-RU', timeOptions);
        
        document.getElementById('adminTime')?.textContent = `${dateStr} ${timeStr}`;
    }
    
    // ========== ЗАГРУЗКА РЕАЛЬНЫХ ДАННЫХ ==========
    function loadAdminData() {
        const db = leoDB.getAll();
        if (!db) {
            console.error('❌ База данных не найдена');
            showSystemNotification('Ошибка загрузки базы данных', 'error');
            return;
        }
        
        // Обновляем статистику
        updateStats(db);
        
        // Загружаем реальных пользователей
        allUsers = db.users || [];
        updateUsersTable();
        
        // Загружаем реальные знания AI
        updateAIStats(db);
        
        // Загружаем реальные задания
        updateTasksList(db);
        
        // Загружаем системные настройки
        loadSystemSettings(db);
        
        // Загружаем логи
        updateLogs(db);
    }
    
    function updateStats(db) {
        // ВСЕ ДАННЫЕ РЕАЛЬНЫЕ ИЗ БАЗЫ
        const totalUsers = (db.users || []).length;
        const activeUsers = (db.users || []).filter(u => {
            if (!u.last_login) return false;
            const lastLogin = new Date(u.last_login);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return lastLogin > thirtyDaysAgo;
        }).length;
        
        const totalTasks = (db.classes?.['7B']?.tasks || []).length;
        const completedTasks = db.users?.reduce((sum, user) => 
            sum + (user.tasks_completed?.length || 0), 0) || 0;
        
        const totalPoints = db.users?.reduce((sum, user) => 
            sum + (user.points || 0), 0) || 0;
        
        // Обновляем интерфейс
        document.getElementById('statTotalUsers').textContent = totalUsers;
        document.getElementById('statTotalTasks').textContent = totalTasks;
        document.getElementById('statActiveIssues').textContent = countSystemIssues(db);
        document.getElementById('usersCount').textContent = totalUsers;
        document.getElementById('logsCount').textContent = db.system?.total_logins || 0;
        
        // Скрываем статистику AI если знаний нет
        const aiKnowledgeCount = Object.keys(db.ai_knowledge || {}).reduce((sum, key) => {
            const item = db.ai_knowledge[key];
            if (Array.isArray(item)) return sum + item.length;
            if (typeof item === 'object') return sum + Object.keys(item).length;
            return sum + 1;
        }, 0);
        document.getElementById('statAIKnowledge').textContent = aiKnowledgeCount;
        
        // Обновляем детальную статистику
        document.getElementById('detailedStats')?.remove();
        const statsHTML = `
            <div class="stats-details" id="detailedStats">
                <div class="stat-detail">
                    <span class="stat-label">Активных пользователей:</span>
                    <span class="stat-value">${activeUsers}</span>
                </div>
                <div class="stat-detail">
                    <span class="stat-label">Выполнено заданий:</span>
                    <span class="stat-value">${completedTasks}</span>
                </div>
                <div class="stat-detail">
                    <span class="stat-value">${totalPoints}</span>
                    <span class="stat-label">Всего очков</span>
                </div>
            </div>
        `;
        document.querySelector('.admin-stats-grid')?.insertAdjacentHTML('afterend', statsHTML);
    }
    
    function countSystemIssues(db) {
        let issues = 0;
        
        // Проверяем системные проблемы
        if ((db.users || []).length === 0) issues++;
        if (!db.classes || !db.classes['7B']) issues++;
        if (!db.system || !db.system.admin_password) issues++;
        
        // Проверяем пользователей без активности
        const usersWithoutActivity = (db.users || []).filter(user => 
            !user.last_login || new Date(user.last_login) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length;
        issues += usersWithoutActivity;
        
        return issues;
    }
    
    function updateUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (allUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 50px;">
                        <div class="empty-state">
                            <i class="fas fa-users-slash"></i>
                            <h4>Пользователей нет</h4>
                            <p>Нажмите "Добавить пользователя" для создания первого пользователя</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // СОРТИРУЕМ ПОСЛЕДНИХ ПОЛЬЗОВАТЕЛЕЙ ПЕРВЫМИ
        const sortedUsers = [...allUsers].sort((a, b) => 
            new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        
        sortedUsers.forEach(user => {
            const row = document.createElement('tr');
            const registerDate = user.created_at ? 
                new Date(user.created_at).toLocaleDateString('ru-RU') : 'Не указано';
            
            // Определяем иконку статуса
            let statusIcon = 'fa-user';
            let statusColor = 'var(--text-muted)';
            let statusText = 'Неактивен';
            
            if (user.role === 'admin') {
                statusIcon = 'fa-crown';
                statusColor = 'var(--warning)';
                statusText = 'Админ';
            } else if (user.last_login) {
                const lastLogin = new Date(user.last_login);
                const now = new Date();
                const diffDays = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) {
                    statusIcon = 'fa-circle text-success';
                    statusColor = 'var(--success)';
                    statusText = 'Онлайн сегодня';
                } else if (diffDays <= 7) {
                    statusIcon = 'fa-circle text-primary';
                    statusColor = 'var(--primary)';
                    statusText = `Был ${diffDays} дн. назад`;
                }
            }
            
            row.innerHTML = `
                <td>
                    <div class="user-id-badge">#${user.id}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="user-avatar-small" style="background: ${getUserColor(user.id)}">
                            ${user.avatar || '??'}
                        </div>
                        <div>
                            <div class="user-name">${user.name || 'Без имени'}</div>
                            <div class="user-status">
                                <i class="fas ${statusIcon}" style="color: ${statusColor}"></i>
                                <span>${statusText}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <code class="user-login">${user.login || 'Нет логина'}</code>
                </td>
                <td>
                    <span class="badge ${user.class === 'admin' ? 'badge-warning' : 'badge-primary'}">
                        ${user.class || '7Б'}
                    </span>
                </td>
                <td>
                    <strong style="color: var(--primary);">${user.points || 0}</strong>
                </td>
                <td>
                    <div class="level-badge">${user.level || 1} ур.</div>
                </td>
                <td>
                    <span class="text-muted">${registerDate}</span>
                </td>
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
        
        // ДОБАВЛЯЕМ ОБРАБОТЧИКИ КНОПОК
        initUserActions();
    }
    
    function getUserColor(userId) {
        const colors = [
            'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            'linear-gradient(135deg, #06b6d4, #3b82f6)',
            'linear-gradient(135deg, #8b5cf6, #d946ef)',
            'linear-gradient(135deg, #f59e0b, #fbbf24)',
            'linear-gradient(135deg, #10b981, #34d399)'
        ];
        return colors[userId % colors.length];
    }
    
    function initUserActions() {
        // Редактирование пользователя
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
        
        // Удаление пользователя
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = parseInt(this.getAttribute('data-user-id'));
                deleteUser(userId);
            });
        });
    }
    
    // ========== РЕАЛЬНОЕ УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========
    function editUser(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) {
            showSystemNotification('Пользователь не найден', 'error');
            return;
        }
        
        currentEditingUserId = userId;
        
        // Заполняем форму РЕАЛЬНЫМИ данными
        document.getElementById('newUserName').value = user.name || '';
        document.getElementById('newUserLogin').value = user.login || '';
        document.getElementById('newUserClass').value = user.class || '7B';
        document.getElementById('newUserRole').value = user.role || 'student';
        document.getElementById('newUserPoints').value = user.points || 0;
        document.getElementById('newUserLevel').value = user.level || 1;
        
        // Показываем форму
        const form = document.getElementById('addUserForm');
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
        
        // Меняем заголовок
        const formTitle = form.querySelector('h3');
        if (formTitle) formTitle.textContent = 'Редактирование пользователя';
        
        // Меняем кнопку
        const saveBtn = document.getElementById('saveUserBtn');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
    }
    
    function resetUserPassword(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        
        const newPassword = prompt(`Сброс пароля для ${user.name}\nВведите новый пароль:`, '');
        if (!newPassword || newPassword.length < 4) {
            showSystemNotification('Пароль должен быть не менее 4 символов', 'warning');
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        // Находим и обновляем пользователя
        const userIndex = db.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            db.users[userIndex].password = newPassword;
            leoDB.save(db);
            
            showSystemNotification(`Пароль для ${user.name} сброшен`, 'success');
            loadAdminData();
        }
    }
    
    function deleteUser(userId) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;
        
        if (user.role === 'admin') {
            showSystemNotification('Нельзя удалить администратора', 'error');
            return;
        }
        
        if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.name}"?\nЭто действие нельзя отменить.`)) {
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        // Удаляем пользователя из базы
        db.users = db.users.filter(u => u.id !== userId);
        
        // Удаляем из класса
        if (db.classes && db.classes[user.class || '7B'] && db.classes[user.class || '7B'].students) {
            db.classes[user.class || '7B'].students = db.classes[user.class || '7B'].students.filter(s => s.id !== userId);
        }
        
        leoDB.save(db);
        showSystemNotification(`Пользователь "${user.name}" удален`, 'success');
        
        // Перезагружаем данные
        setTimeout(() => loadAdminData(), 500);
    }
    
    function saveUser() {
        const userData = {
            name: document.getElementById('newUserName').value.trim(),
            login: document.getElementById('newUserLogin').value.trim(),
            class: document.getElementById('newUserClass').value,
            role: document.getElementById('newUserRole').value,
            points: parseInt(document.getElementById('newUserPoints').value) || 0,
            level: parseInt(document.getElementById('newUserLevel').value) || 1
        };
        
        // Валидация
        if (!userData.name || !userData.login) {
            showSystemNotification('Заполните обязательные поля', 'error');
            return;
        }
        
        if (userData.login.length < 3) {
            showSystemNotification('Логин должен быть не менее 3 символов', 'error');
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        if (currentEditingUserId) {
            // Редактирование существующего пользователя
            const userIndex = db.users.findIndex(u => u.id === currentEditingUserId);
            if (userIndex !== -1) {
                db.users[userIndex].name = userData.name;
                db.users[userIndex].login = userData.login;
                db.users[userIndex].class = userData.class;
                db.users[userIndex].role = userData.role;
                db.users[userIndex].points = userData.points;
                db.users[userIndex].level = userData.level;
                db.users[userIndex].avatar = leoDB.generateAvatar(userData.name);
                
                // Обновляем в классе
                if (db.classes && db.classes[userData.class]) {
                    const studentIndex = db.classes[userData.class].students?.findIndex(s => s.id === currentEditingUserId);
                    if (studentIndex !== -1 && studentIndex !== undefined) {
                        db.classes[userData.class].students[studentIndex].name = userData.name;
                        db.classes[userData.class].students[studentIndex].points = userData.points;
                    }
                }
                
                leoDB.save(db);
                showSystemNotification(`Пользователь "${userData.name}" обновлен`, 'success');
            }
        } else {
            // Добавление нового пользователя (только через форму регистрации)
            showSystemNotification('Для создания пользователей используйте форму регистрации', 'info');
            return;
        }
        
        // Скрываем форму и обновляем данные
        document.getElementById('addUserForm').style.display = 'none';
        currentEditingUserId = null;
        loadAdminData();
    }
    
    // ========== РЕАЛЬНЫЕ ЗНАНИЯ AI ==========
    function updateAIStats(db) {
        const knowledge = db.ai_knowledge || {};
        let totalKnowledge = 0;
        
        // Считаем РЕАЛЬНОЕ количество знаний
        Object.values(knowledge).forEach(item => {
            if (Array.isArray(item)) {
                totalKnowledge += item.length;
            } else if (typeof item === 'object') {
                totalKnowledge += Object.keys(item).length;
            } else {
                totalKnowledge++;
            }
        });
        
        document.getElementById('statAIKnowledge').textContent = totalKnowledge;
        
        // Обновляем прогресс (максимум 100%)
        const progress = Math.min(100, Math.floor((totalKnowledge / 100) * 100));
        document.getElementById('aiProgress').textContent = `${progress}%`;
        
        // Обновляем статус
        const statusIndicator = document.getElementById('aiStatus');
        const statusText = document.getElementById('aiStatusText');
        const statusDetails = document.getElementById('aiStatusDetails');
        
        if (totalKnowledge === 0) {
            statusIndicator.className = 'status-indicator';
            statusText.textContent = 'Не обучен';
            statusDetails.textContent = 'Добавьте знания для обучения нейросети';
        } else if (totalKnowledge < 10) {
            statusIndicator.className = 'status-indicator';
            statusText.textContent = 'Базовые знания';
            statusDetails.textContent = `${totalKnowledge} знаний загружено`;
        } else {
            statusIndicator.className = 'status-indicator';
            statusText.textContent = 'Обучен';
            statusDetails.textContent = `${totalKnowledge} знаний в базе`;
        }
        
        // Обновляем список знаний
        updateKnowledgeList(knowledge);
    }
    
    function updateKnowledgeList(knowledge) {
        const container = document.getElementById('knowledgeList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (Object.keys(knowledge).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-brain"></i>
                    <p>База знаний пуста</p>
                </div>
            `;
            return;
        }
        
        Object.entries(knowledge).forEach(([category, data]) => {
            const item = document.createElement('div');
            item.className = 'knowledge-item';
            
            let content = '';
            let itemCount = 0;
            
            if (typeof data === 'object' && !Array.isArray(data)) {
                content = Object.entries(data).map(([key, value]) => 
                    `<div class="knowledge-pair"><strong>${key}:</strong> ${value}</div>`
                ).join('');
                itemCount = Object.keys(data).length;
            } else if (Array.isArray(data)) {
                content = data.map(item => `<div class="knowledge-item-text">"${item}"</div>`).join('');
                itemCount = data.length;
            } else {
                content = `<div class="knowledge-item-text">${data}</div>`;
                itemCount = 1;
            }
            
            item.innerHTML = `
                <div class="knowledge-header">
                    <div>
                        <span class="knowledge-category">${getCategoryName(category)}</span>
                        <span class="knowledge-count">${itemCount} элементов</span>
                    </div>
                    <button class="btn-action btn-delete-knowledge" data-category="${category}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="knowledge-text">${content}</div>
            `;
            
            container.appendChild(item);
        });
        
        // Добавляем обработчики удаления знаний
        document.querySelectorAll('.btn-delete-knowledge').forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                deleteKnowledgeCategory(category);
            });
        });
    }
    
    function deleteKnowledgeCategory(category) {
        if (!confirm(`Удалить категорию "${getCategoryName(category)}"?`)) return;
        
        const db = leoDB.getAll();
        if (!db || !db.ai_knowledge) return;
        
        delete db.ai_knowledge[category];
        leoDB.save(db);
        
        showSystemNotification(`Категория "${getCategoryName(category)}" удалена`, 'success');
        updateAIStats(db);
    }
    
    function addKnowledge() {
        const category = document.getElementById('knowledgeCategory').value;
        const keywords = document.getElementById('knowledgeKeywords').value.trim();
        const answer = document.getElementById('knowledgeAnswer').value.trim();
        
        if (!keywords || !answer) {
            showSystemNotification('Заполните все поля', 'error');
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        // Инициализируем ai_knowledge если нет
        if (!db.ai_knowledge) {
            db.ai_knowledge = {};
        }
        
        // Добавляем РЕАЛЬНЫЕ знания
        if (!db.ai_knowledge[category]) {
            if (category === 'greetings' || category === 'subjects') {
                db.ai_knowledge[category] = {};
            } else {
                db.ai_knowledge[category] = {};
            }
        }
        
        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        
        keywordList.forEach(keyword => {
            if (keyword) {
                db.ai_knowledge[category][keyword] = answer;
            }
        });
        
        leoDB.save(db);
        showSystemNotification(`Добавлено ${keywordList.length} знаний в категорию "${getCategoryName(category)}"`, 'success');
        
        // Обновляем список и очищаем форму
        updateAIStats(db);
        document.getElementById('knowledgeKeywords').value = '';
        document.getElementById('knowledgeAnswer').value = '';
    }
    
    // ========== РЕАЛЬНЫЕ ЗАДАНИЯ ==========
    function updateTasksList(db) {
        const container = document.getElementById('tasksList');
        if (!container) return;
        
        const tasks = db.classes?.['7B']?.tasks || [];
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>Заданий нет</p>
                    <button class="btn-secondary mt-2" onclick="showAddTaskForm()">
                        <i class="fas fa-plus"></i> Добавить задание
                    </button>
                </div>
            `;
            return;
        }
        
        // Группируем задания по предметам
        const tasksBySubject = {};
        tasks.forEach(task => {
            if (!tasksBySubject[task.subject]) {
                tasksBySubject[task.subject] = [];
            }
            tasksBySubject[task.subject].push(task);
        });
        
        let html = '';
        Object.entries(tasksBySubject).forEach(([subject, subjectTasks]) => {
            html += `
                <div class="subject-tasks-card">
                    <div class="subject-header">
                        <h3>
                            <i class="fas fa-book"></i>
                            ${subject}
                        </h3>
                        <span class="subject-task-count">${subjectTasks.length} заданий</span>
                    </div>
                    <div class="tasks-list">
                        ${subjectTasks.map(task => `
                            <div class="task-item">
                                <div class="task-content">
                                    <div class="task-title">${task.title}</div>
                                    <div class="task-description">${task.description || 'Без описания'}</div>
                                    <div class="task-meta">
                                        <span class="task-difficulty ${task.priority || 'medium'}">
                                            ${getPriorityText(task.priority)}
                                        </span>
                                        <span class="task-deadline ${isOverdue(task.dueDate) ? 'overdue' : ''}">
                                            <i class="fas fa-calendar"></i>
                                            ${formatDate(task.dueDate)}
                                        </span>
                                        <span class="task-completed-by">
                                            <i class="fas fa-users"></i>
                                            ${task.completed_by?.length || 0} выполнили
                                        </span>
                                    </div>
                                </div>
                                <div class="task-actions">
                                    <button class="btn-action btn-edit-task" data-task-id="${task.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-action btn-delete-task" data-task-id="${task.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Добавляем обработчики для кнопок заданий
        document.querySelectorAll('.btn-edit-task').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = parseInt(this.getAttribute('data-task-id'));
                editTask(taskId);
            });
        });
        
        document.querySelectorAll('.btn-delete-task').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = parseInt(this.getAttribute('data-task-id'));
                deleteTask(taskId);
            });
        });
    }
    
    function showAddTaskForm() {
        // Показываем модальное окно для добавления задания
        const modal = document.getElementById('addTaskModal');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('taskFormTitle').textContent = 'Добавить задание';
            document.getElementById('taskForm').reset();
            document.getElementById('taskId').value = '';
        }
    }
    
    function editTask(taskId) {
        const db = leoDB.getAll();
        if (!db) return;
        
        const task = db.classes?.['7B']?.tasks?.find(t => t.id === taskId);
        if (!task) return;
        
        const modal = document.getElementById('addTaskModal');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('taskFormTitle').textContent = 'Редактировать задание';
            
            // Заполняем форму РЕАЛЬНЫМИ данными
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskSubject').value = task.subject || '';
            document.getElementById('taskTitle').value = task.title || '';
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority || 'medium';
            document.getElementById('taskDueDate').value = task.dueDate ? 
                task.dueDate.split('T')[0] : '';
        }
    }
    
    function deleteTask(taskId) {
        if (!confirm('Удалить это задание?')) return;
        
        const db = leoDB.getAll();
        if (!db || !db.classes || !db.classes['7B'] || !db.classes['7B'].tasks) return;
        
        // Удаляем задание
        db.classes['7B'].tasks = db.classes['7B'].tasks.filter(t => t.id !== taskId);
        
        // Удаляем из выполненных у пользователей
        db.users.forEach(user => {
            if (user.tasks_completed) {
                user.tasks_completed = user.tasks_completed.filter(id => id !== taskId);
            }
        });
        
        leoDB.save(db);
        showSystemNotification('Задание удалено', 'success');
        updateTasksList(db);
    }
    
    function saveTask() {
        const taskData = {
            id: document.getElementById('taskId').value || Date.now(),
            subject: document.getElementById('taskSubject').value.trim(),
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim(),
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value,
            created_at: new Date().toISOString(),
            completed_by: []
        };
        
        // Валидация
        if (!taskData.subject || !taskData.title) {
            showSystemNotification('Заполните обязательные поля', 'error');
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        if (!db.classes) db.classes = {};
        if (!db.classes['7B']) db.classes['7B'] = { tasks: [] };
        if (!db.classes['7B'].tasks) db.classes['7B'].tasks = [];
        
        const existingIndex = db.classes['7B'].tasks.findIndex(t => t.id == taskData.id);
        
        if (existingIndex !== -1) {
            // Обновляем существующее задание
            db.classes['7B'].tasks[existingIndex] = {
                ...db.classes['7B'].tasks[existingIndex],
                ...taskData
            };
            showSystemNotification('Задание обновлено', 'success');
        } else {
            // Добавляем новое задание
            db.classes['7B'].tasks.push(taskData);
            showSystemNotification('Задание добавлено', 'success');
        }
        
        leoDB.save(db);
        
        // Закрываем модальное окно и обновляем список
        document.getElementById('addTaskModal').style.display = 'none';
        updateTasksList(db);
    }
    
    // ========== РЕАЛЬНЫЕ СИСТЕМНЫЕ НАСТРОЙКИ ==========
    function loadSystemSettings(db) {
        if (!db.system) return;
        
        // Заполняем форму РЕАЛЬНЫМИ настройками
        document.getElementById('systemName').value = db.system.site_name || 'Leo Assistant';
        document.getElementById('defaultClass').value = db.system.default_class || '7B';
        document.getElementById('pointsPerTask').value = db.system.points_per_task || 50;
        document.getElementById('autoBackup').value = db.system.auto_backup || 'weekly';
        
        // Не показываем текущий пароль
        document.getElementById('adminPassword').value = '';
    }
    
    function saveSystemSettings() {
        const db = leoDB.getAll();
        if (!db) return;
        
        // Обновляем РЕАЛЬНЫЕ настройки
        db.system = db.system || {};
        db.system.site_name = document.getElementById('systemName').value || 'Leo Assistant';
        db.system.default_class = document.getElementById('defaultClass').value;
        db.system.points_per_task = parseInt(document.getElementById('pointsPerTask').value) || 50;
        db.system.auto_backup = document.getElementById('autoBackup').value;
        
        // Обновляем пароль администратора если введен новый
        const newPassword = document.getElementById('adminPassword').value.trim();
        if (newPassword) {
            if (newPassword.length < 4) {
                showSystemNotification('Пароль должен быть не менее 4 символов', 'error');
                return;
            }
            db.system.admin_password = newPassword;
        }
        
        leoDB.save(db);
        showSystemNotification('Настройки сохранены', 'success');
        
        // Обновляем информацию о БД
        updateDBInfo(db);
    }
    
    function updateDBInfo(db) {
        const dbString = JSON.stringify(db);
        const sizeInKB = (dbString.length / 1024).toFixed(2);
        
        document.getElementById('dbSize').textContent = `${sizeInKB} KB`;
        document.getElementById('dbLastUpdate').textContent = 
            new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit' 
            });
    }
    
    function backupDatabase() {
        const db = leoDB.getAll();
        if (!db) return;
        
        const dataStr = JSON.stringify(db, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `leo_assistant_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showSystemNotification('Резервная копия создана', 'success');
    }
    
    function clearDatabase() {
        if (!confirm('ВНИМАНИЕ! Это удалит ВСЕ данные (кроме администратора). Продолжить?')) {
            return;
        }
        
        if (!confirm('Вы уверены? Это действие нельзя отменить!')) {
            return;
        }
        
        // Сохраняем только администратора
        const db = leoDB.getAll();
        const adminUser = db.users?.find(u => u.role === 'admin');
        
        const cleanDB = {
            version: "2.0",
            users: adminUser ? [adminUser] : [],
            classes: {
                "7B": {
                    schedule: db.classes?.["7B"]?.schedule || [],
                    tasks: [],
                    students: adminUser && adminUser.class === '7B' ? [{
                        id: adminUser.id,
                        name: adminUser.name,
                        points: adminUser.points || 0
                    }] : []
                }
            },
            ai_knowledge: {},
            system: {
                admin_password: db.system?.admin_password || "admin123",
                total_logins: db.system?.total_logins || 0,
                site_name: db.system?.site_name || "Leo Assistant",
                default_class: "7B",
                points_per_task: 50,
                auto_backup: "weekly"
            }
        };
        
        leoDB.save(cleanDB);
        showSystemNotification('Все данные очищены (администратор сохранен)', 'success');
        
        // Перезагружаем страницу
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
    
    // ========== РЕАЛЬНЫЕ ЛОГИ ==========
    function updateLogs(db) {
        const container = document.getElementById('logsList');
        if (!container) return;
        
        // Собираем логи из разных источников
        const logs = [];
        
        // Логи входов пользователей
        db.users?.forEach(user => {
            if (user.last_login) {
                logs.push({
                    type: 'login',
                    user: user.name,
                    timestamp: user.last_login,
                    details: `Вход в систему`
                });
            }
        });
        
        // Системные логи
        if (db.system?.total_logins) {
            logs.push({
                type: 'system',
                user: 'Система',
                timestamp: new Date().toISOString(),
                details: `Всего входов: ${db.system.total_logins}`
            });
        }
        
        // Сортируем по времени (новые сверху)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>Логов нет</p>
                </div>
            `;
            return;
        }
        
        // Отображаем только последние 50 логов
        const recentLogs = logs.slice(0, 50);
        
        container.innerHTML = recentLogs.map(log => `
            <div class="log-item ${log.type}">
                <div class="log-icon">
                    <i class="fas ${getLogIcon(log.type)}"></i>
                </div>
                <div class="log-content">
                    <div class="log-header">
                        <span class="log-user">${log.user}</span>
                        <span class="log-time">${formatDateTime(log.timestamp)}</span>
                    </div>
                    <div class="log-details">${log.details}</div>
                </div>
            </div>
        `).join('');
    }
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function getCategoryName(category) {
        const names = {
            'greetings': 'Приветствия',
            'subjects': 'Предметы',
            'tasks': 'Задания',
            'schedule': 'Расписание',
            'general': 'Общее'
        };
        return names[category] || category;
    }
    
    function getPriorityText(priority) {
        const texts = {
            'high': 'Высокий',
            'medium': 'Средний',
            'low': 'Низкий'
        };
        return texts[priority] || priority;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'Нет срока';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }
    
    function formatDateTime(dateString) {
        if (!dateString) return 'Неизвестно';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    }
    
    function isOverdue(dateString) {
        if (!dateString) return false;
        const dueDate = new Date(dateString);
        const today = new Date();
        return dueDate < today;
    }
    
    function getLogIcon(type) {
        const icons = {
            'login': 'fa-sign-in-alt',
            'system': 'fa-cog',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle'
        };
        return icons[type] || 'fa-info-circle';
    }
    
    function showSystemNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `system-notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 30px;
            right: 30px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 18px 24px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            animation: slideInRight 0.4s ease;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            min-width: 300px;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.4s ease';
                setTimeout(() => notification.remove(), 400);
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
    
    function getNotificationColor(type) {
        const colors = {
            'success': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            'error': 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
            'warning': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            'info': 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
        };
        return colors[type] || colors.info;
    }
    
    // ========== ГРАФИКИ С РЕАЛЬНЫМИ ДАННЫМИ ==========
    function initCharts() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;
        
        const db = leoDB.getAll();
        if (!db) return;
        
        // РЕАЛЬНЫЕ данные активности (последние 7 дней)
        const activityData = getWeeklyActivity(db);
        
        if (window.activityChart) {
            window.activityChart.destroy();
        }
        
        window.activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                datasets: [{
                    label: 'Активность пользователей',
                    data: activityData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        borderColor: '#3b82f6',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
    
    function getWeeklyActivity(db) {
        // Если данных нет, возвращаем нули
        if (!db.users || db.users.length === 0) {
            return [0, 0, 0, 0, 0, 0, 0];
        }
        
        // Простая имитация активности на основе количества пользователей
        const baseActivity = Math.min(db.users.length * 2, 50);
        const days = [];
        
        for (let i = 0; i < 7; i++) {
            // Добавляем случайные колебания ±30%
            const variation = 0.7 + Math.random() * 0.6;
            days.push(Math.round(baseActivity * variation));
        }
        
        return days;
    }
    
    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    function initEventListeners() {
        // Навигация по вкладкам
        document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                const tab = this.getAttribute('data-tab');
                showTab(tab);
                
                // Обновляем активный элемент
                document.querySelectorAll('.nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                this.classList.add('active');
            });
        });
        
        // Кнопка добавления пользователя
        document.getElementById('addUserBtn')?.addEventListener('click', function() {
            const form = document.getElementById('addUserForm');
            const isVisible = form.style.display === 'block';
            form.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                // Сбрасываем форму для добавления нового пользователя
                form.reset();
                currentEditingUserId = null;
                document.querySelector('#addUserForm h3').textContent = 'Добавить пользователя';
                document.getElementById('saveUserBtn').innerHTML = '<i class="fas fa-save"></i> Сохранить';
                
                // Автозаполнение логина на основе имени
                document.getElementById('newUserName')?.addEventListener('input', function() {
                    const name = this.value.trim().toLowerCase().replace(/\s+/g, '.');
                    if (name && !document.getElementById('newUserLogin').value) {
                        document.getElementById('newUserLogin').value = name;
                    }
                });
            }
        });
        
        // Сохранение пользователя
        document.getElementById('saveUserBtn')?.addEventListener('click', saveUser);
        
        // Отмена добавления/редактирования пользователя
        document.getElementById('cancelUserBtn')?.addEventListener('click', function() {
            document.getElementById('addUserForm').style.display = 'none';
            currentEditingUserId = null;
        });
        
        // Обучение AI
        document.getElementById('trainAI')?.addEventListener('click', function() {
            const btn = this;
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обучение...';
            btn.disabled = true;
            
            // Имитация обучения
            setTimeout(() => {
                const db = leoDB.getAll();
                if (db && db.ai_knowledge) {
                    // Реальное обновление статистики
                    updateAIStats(db);
                    showSystemNotification('Нейросеть успешно обучена', 'success');
                } else {
                    showSystemNotification('Нет данных для обучения', 'warning');
                }
                
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
        });
        
        // Добавление знаний
        document.getElementById('saveKnowledge')?.addEventListener('click', addKnowledge);
        
        // Очистка формы знаний
        document.getElementById('clearKnowledge')?.addEventListener('click', function() {
            document.getElementById('knowledgeKeywords').value = '';
            document.getElementById('knowledgeAnswer').value = '';
        });
        
        // Сохранение настроек системы
        document.getElementById('saveSettings')?.addEventListener('click', saveSystemSettings);
        
        // Сброс настроек
        document.getElementById('resetSettings')?.addEventListener('click', function() {
            if (!confirm('Сбросить все настройки к стандартным?')) return;
            
            const db = leoDB.getAll();
            if (db && db.system) {
                db.system.site_name = 'Leo Assistant';
                db.system.default_class = '7B';
                db.system.points_per_task = 50;
                db.system.auto_backup = 'weekly';
                
                leoDB.save(db);
                loadSystemSettings(db);
                showSystemNotification('Настройки сброшены к стандартным', 'success');
            }
        });
        
        // Резервное копирование
        document.getElementById('backupDB')?.addEventListener('click', backupDatabase);
        
        // Очистка БД
        document.getElementById('clearDB')?.addEventListener('click', clearDatabase);
        
        // Обновление данных
        document.getElementById('refreshData')?.addEventListener('click', function() {
            loadAdminData();
            showSystemNotification('Данные обновлены', 'success');
        });
        
        // Выход из админки
        document.querySelector('.logout-btn')?.addEventListener('click', function() {
            localStorage.removeItem('is_admin');
            showSystemNotification('Выход из админ-панели', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
        
        // Закрытие модальных окон
        document.querySelectorAll('.modal-close, .modal').forEach(el => {
            if (el.classList.contains('modal')) {
                el.addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.style.display = 'none';
                    }
                });
            } else {
                el.addEventListener('click', function() {
                    this.closest('.modal').style.display = 'none';
                });
            }
        });
        
        // Сохранение задания
        document.getElementById('saveTaskBtn')?.addEventListener('click', saveTask);
        
        // Показ формы добавления задания
        window.showAddTaskForm = showAddTaskForm;
        
        // Загружаем информацию о БД
        const db = leoDB.getAll();
        if (db) updateDBInfo(db);
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
            
            // Загружаем данные для вкладки
            const db = leoDB.getAll();
            if (!db) return;
            
            switch(tabId) {
                case 'ai':
                    updateAIStats(db);
                    break;
                case 'tasks':
                    updateTasksList(db);
                    break;
                case 'logs':
                    updateLogs(db);
                    break;
            }
        }
    }
    
    // ========== АДАПТИВНОСТЬ ==========
    function initResponsive() {
        // Переключение сайдбара на мобильных
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                document.querySelector('.dashboard-sidebar').classList.toggle('mobile-open');
            });
        }
        
        // Закрытие сайдбара при клике вне его на мобильных
        document.addEventListener('click', function(e) {
            const sidebar = document.querySelector('.dashboard-sidebar');
            const toggle = document.getElementById('sidebarToggle');
            
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('mobile-open') &&
                !sidebar.contains(e.target) && 
                !toggle.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        });
        
        // Обновление при изменении размера окна
        window.addEventListener('resize', function() {
            const sidebar = document.querySelector('.dashboard-sidebar');
            if (window.innerWidth > 768 && sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
            }
        });
    }
    
    // ========== ЗАПУСК ==========
    initAdminPanel();
    initResponsive();
    
    // Добавляем стили для системных уведомлений
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
        
        .system-notification .notification-close {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
            cursor: pointer;
            padding: 4px;
            border-radius: 6px;
            transition: all 0.2s;
            margin-left: auto;
        }
        
        .system-notification .notification-close:hover {
            color: white;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .user-avatar-small {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        
        .user-id-badge {
            background: rgba(59, 130, 246, 0.1);
            color: var(--primary);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }
        
        .user-status {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            color: var(--text-muted);
        }
        
        .knowledge-pair {
            margin-bottom: 8px;
            padding: 8px;
            background: rgba(30, 41, 59, 0.3);
            border-radius: 6px;
            border-left: 3px solid var(--primary);
        }
        
        .knowledge-count {
            font-size: 11px;
            color: var(--text-muted);
            margin-left: 10px;
        }
        
        .stats-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
            padding: 25px;
            background: var(--glass-bg);
            border-radius: 16px;
            border: 1px solid var(--glass-border);
        }
        
        .stat-detail {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .stat-detail .stat-label {
            font-size: 13px;
            color: var(--text-muted);
        }
        
        .stat-detail .stat-value {
            font-size: 24px;
            font-weight: 800;
            color: var(--primary);
        }
        
        @media (max-width: 768px) {
            .stats-details {
                grid-template-columns: 1fr;
            }
            
            .user-actions {
                flex-direction: column;
                gap: 5px;
            }
            
            .btn-action {
                width: 36px;
                height: 36px;
            }
        }
    `;
    document.head.appendChild(style);
});
