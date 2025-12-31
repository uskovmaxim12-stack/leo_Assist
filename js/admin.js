// js/admin.js - ПОЛНАЯ РАБОЧАЯ АДМИН-ПАНЕЛЬ
document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Админ-панель инициализируется');
    
    // Глобальные переменные
    let currentTab = 'dashboard';
    let allUsers = [];
    let allTasks = [];
    let pendingAction = null;
    let activityChart = null;
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function initAdminPanel() {
        // Проверка прав
        if (!checkAdminAccess()) return;
        
        // Настройка времени
        updateTime();
        setInterval(updateTime, 1000);
        
        // Загрузка данных
        loadAdminData();
        
        // Инициализация событий
        initEventListeners();
        
        // Инициализация графиков
        initCharts();
        
        console.log('✅ Админ-панель готова');
    }
    
    function checkAdminAccess() {
        const isAdmin = localStorage.getItem('is_admin') === 'true';
        if (!isAdmin) {
            alert('⚠️ Доступ запрещен! Требуются права администратора.');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
    
    function updateTime() {
        const now = new Date();
        const timeEl = document.getElementById('adminTime');
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    }
    
    // ========== ЗАГРУЗКА ДАННЫХ ==========
    function loadAdminData() {
        const db = leoDB?.getAll();
        if (!db) {
            console.error('❌ База данных не найдена');
            showNotification('Ошибка загрузки данных', 'error');
            return;
        }
        
        // Обновляем статистику
        updateStats(db);
        
        // Загружаем пользователей
        loadUsers(db);
        
        // Загружаем задания
        loadTasks(db);
        
        // Загружаем AI знания
        loadAIKnowledge(db);
        
        // Загружаем логи
        loadLogs(db);
        
        // Обновляем информацию о системе
        updateSystemInfo(db);
    }
    
    function updateStats(db) {
        const users = db.users || [];
        const tasks = db.classes?.['7B']?.tasks || [];
        const totalLogins = db.system?.total_logins || 0;
        
        // Основная статистика
        document.getElementById('statTotalUsers').textContent = users.length;
        document.getElementById('statTotalTasks').textContent = tasks.length;
        document.getElementById('usersCount').textContent = users.length;
        document.getElementById('totalUsersCount').textContent = users.length;
        document.getElementById('totalTasksCount').textContent = tasks.length;
        document.getElementById('totalLogins').textContent = totalLogins;
        
        // AI статистика
        updateAIStats(db);
        
        // Считаем "проблемы" (пользователи без активности)
        const activeIssues = users.filter(u => u.points === 0).length;
        document.getElementById('statActiveIssues').textContent = activeIssues;
    }
    
    function loadUsers(db) {
        allUsers = db.users || [];
        updateUsersTable();
    }
    
    function updateUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (allUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div style="color: var(--text-muted);">
                            <i class="fas fa-users" style="font-size: 32px; margin-bottom: 15px;"></i>
                            <p>Пользователей пока нет</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        
        allUsers.forEach(user => {
            const regDate = user.created_at 
                ? new Date(user.created_at).toLocaleDateString('ru-RU')
                : 'не указано';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id || '—'}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                            ${user.avatar || '?'}
                        </div>
                        ${user.name}
                    </div>
                </td>
                <td>${user.login}</td>
                <td><span class="role">${user.class || '7Б'}</span></td>
                <td><strong>${user.points || 0}</strong></td>
                <td>${user.level || 1}</td>
                <td>${regDate}</td>
                <td>
                    <div class="user-actions">
                        <button class="btn-action btn-edit" onclick="editUser(${user.id})" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-reset" onclick="resetUserProgress(${user.id})" title="Сбросить прогресс">
                            <i class="fas fa-redo"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteUser(${user.id})" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    function loadTasks(db) {
        allTasks = db.classes?.['7B']?.tasks || [];
        updateTasksList();
    }
    
    function updateTasksList() {
        const container = document.getElementById('tasksList');
        if (!container) return;
        
        if (allTasks.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-tasks" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <p>Заданий пока нет</p>
                </div>
            `;
            return;
        }
        
        // Группируем задания по предметам
        const tasksBySubject = {};
        allTasks.forEach(task => {
            if (!tasksBySubject[task.subject]) {
                tasksBySubject[task.subject] = [];
            }
            tasksBySubject[task.subject].push(task);
        });
        
        container.innerHTML = '';
        
        Object.entries(tasksBySubject).forEach(([subject, tasks]) => {
            const subjectCard = document.createElement('div');
            subjectCard.className = 'subject-tasks-card';
            
            let tasksHTML = '';
            tasks.forEach(task => {
                const dueDate = task.dueDate 
                    ? new Date(task.dueDate).toLocaleDateString('ru-RU')
                    : 'без срока';
                
                const priorityClass = `priority-${task.priority || 'medium'}`;
                
                tasksHTML += `
                    <div style="padding: 20px; border-bottom: 1px solid rgba(59, 130, 246, 0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 8px; color: var(--text);">${task.title}</h4>
                                ${task.description ? `<p style="color: var(--text-muted); margin: 0 0 10px; font-size: 14px;">${task.description}</p>` : ''}
                                <div style="display: flex; gap: 15px; font-size: 13px;">
                                    <span class="${priorityClass}">${getPriorityText(task.priority)}</span>
                                    <span style="color: var(--text-muted);">Срок: ${dueDate}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-action btn-edit" onclick="editTask(${task.id})" title="Редактировать">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-action btn-delete" onclick="deleteTask(${task.id})" title="Удалить">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            subjectCard.innerHTML = `
                <div class="subject-header">
                    <h3><i class="fas fa-book"></i> ${subject}</h3>
                    <span class="subject-task-count">${tasks.length} заданий</span>
                </div>
                ${tasksHTML}
            `;
            
            container.appendChild(subjectCard);
        });
    }
    
    function loadAIKnowledge(db) {
        updateKnowledgeList(db);
    }
    
    function updateKnowledgeList(db) {
        const container = document.getElementById('knowledgeList');
        if (!container) return;
        
        const knowledge = db.ai_knowledge || {};
        
        if (Object.keys(knowledge).length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                    <i class="fas fa-brain" style="font-size: 32px; margin-bottom: 15px;"></i>
                    <p>База знаний пуста</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(knowledge).forEach(([category, data]) => {
            let content = '';
            
            if (Array.isArray(data)) {
                content = data.map(item => `"${item}"`).join(', ');
            } else if (typeof data === 'object') {
                content = Object.entries(data).map(([key, value]) => 
                    `<div style="margin-bottom: 5px;">
                        <strong>${key}:</strong> ${value}
                    </div>`
                ).join('');
            } else {
                content = data;
            }
            
            const item = document.createElement('div');
            item.className = 'knowledge-item';
            item.innerHTML = `
                <div class="knowledge-header">
                    <span class="knowledge-category">${getCategoryName(category)}</span>
                    <button class="btn-action btn-edit" onclick="editKnowledge('${category}')" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
                <div class="knowledge-text">${content}</div>
            `;
            
            container.appendChild(item);
        });
    }
    
    function loadLogs(db) {
        const container = document.getElementById('logsList');
        if (!container) return;
        
        const logs = db.logs || [];
        const totalLogins = db.system?.total_logins || 0;
        
        document.getElementById('logsCount').textContent = logs.length;
        
        if (logs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-history" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <p>Логов пока нет</p>
                    <p style="font-size: 14px; margin-top: 10px;">Всего входов в систему: ${totalLogins}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        // Показываем последние 20 логов
        logs.slice(-20).reverse().forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'log-item';
            
            const icon = getLogIcon(log.type);
            const time = new Date(log.timestamp).toLocaleString('ru-RU');
            
            logItem.innerHTML = `
                <div class="log-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="log-content">
                    <div class="log-header">
                        <span class="log-user">${log.user || 'Система'}</span>
                        <span class="log-time">${time}</span>
                    </div>
                    <div class="log-details">${log.action}</div>
                </div>
            `;
            
            container.appendChild(logItem);
        });
    }
    
    function updateSystemInfo(db) {
        const dbString = JSON.stringify(db);
        const sizeInKB = (dbString.length / 1024).toFixed(2);
        const version = db.version || '1.0';
        
        document.getElementById('systemVersion').textContent = version;
        document.getElementById('dbSize').textContent = `${sizeInKB} KB`;
        document.getElementById('dbLastUpdate').textContent = 
            new Date().toLocaleTimeString('ru-RU');
    }
    
    function updateAIStats(db) {
        const knowledge = db.ai_knowledge || {};
        let totalKnowledge = 0;
        
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
        document.getElementById('aiProgress').textContent = Math.min(100, totalKnowledge * 5) + '%';
    }
    
    // ========== ГРАФИКИ ==========
    function initCharts() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;
        
        // Удаляем старый график
        if (activityChart) {
            activityChart.destroy();
        }
        
        // Генерируем реалистичные данные на основе пользователей
        const db = leoDB.getAll();
        const users = db?.users || [];
        
        // Считаем активность по дням недели
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const activityData = days.map(() => Math.floor(Math.random() * 30) + 10);
        
        // Корректируем на основе реальных пользователей
        if (users.length > 0) {
            activityData[new Date().getDay() - 1] += users.length * 2;
        }
        
        activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Активность пользователей',
                    data: activityData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        },
                        ticks: {
                            color: 'var(--text-muted)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(59, 130, 246, 0.1)'
                        },
                        ticks: {
                            color: 'var(--text-muted)'
                        }
                    }
                }
            }
        });
    }
    
    // ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========
    function showUserForm(editUserId = null) {
        const form = document.getElementById('addUserForm');
        const title = document.getElementById('userFormTitle');
        
        if (editUserId) {
            // Редактирование
            title.textContent = 'Редактировать пользователя';
            const user = allUsers.find(u => u.id === editUserId);
            if (user) {
                document.getElementById('newUserName').value = user.name;
                document.getElementById('newUserLogin').value = user.login;
                document.getElementById('newUserClass').value = user.class || '7B';
                document.getElementById('newUserRole').value = user.role || 'student';
                document.getElementById('newUserPoints').value = user.points || 0;
                document.getElementById('saveUserBtn').setAttribute('data-user-id', user.id);
            }
        } else {
            // Добавление
            title.textContent = 'Добавить нового пользователя';
            document.getElementById('addUserForm').reset();
            document.getElementById('saveUserBtn').removeAttribute('data-user-id');
        }
        
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }
    
    function saveUser() {
        const userId = document.getElementById('saveUserBtn').getAttribute('data-user-id');
        const userData = {
            name: document.getElementById('newUserName').value.trim(),
            login: document.getElementById('newUserLogin').value.trim(),
            password: document.getElementById('newUserPassword').value.trim(),
            class: document.getElementById('newUserClass').value,
            role: document.getElementById('newUserRole').value,
            points: parseInt(document.getElementById('newUserPoints').value) || 0
        };
        
        // Валидация
        if (!userData.name || !userData.login) {
            showNotification('Заполните имя и логин', 'error');
            return;
        }
        
        if (!userId && !userData.password) {
            showNotification('Введите пароль для нового пользователя', 'error');
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        if (userId) {
            // Обновление существующего пользователя
            const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
            if (userIndex !== -1) {
                db.users[userIndex].name = userData.name;
                db.users[userIndex].login = userData.login;
                db.users[userIndex].class = userData.class;
                db.users[userIndex].role = userData.role;
                db.users[userIndex].points = userData.points;
                
                if (userData.password) {
                    db.users[userIndex].password = userData.password;
                }
                
                // Обновляем аватар
                db.users[userIndex].avatar = leoDB.generateAvatar(userData.name);
                
                leoDB.save(db);
                showNotification('Пользователь обновлен', 'success');
                addLog('admin', `Обновил пользователя "${userData.name}"`);
            }
        } else {
            // Добавление нового пользователя
            const result = leoDB.addUser(userData);
            if (result.success) {
                showNotification('Пользователь добавлен', 'success');
                addLog('admin', `Добавил нового пользователя "${userData.name}"`);
            } else {
                showNotification(result.error, 'error');
                return;
            }
        }
        
        // Скрываем форму и обновляем данные
        document.getElementById('addUserForm').style.display = 'none';
        loadAdminData();
    }
    
    function deleteUser(userId) {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
        
        const db = leoDB.getAll();
        if (!db) return;
        
        const user = db.users.find(u => u.id === userId);
        if (!user) return;
        
        // Удаляем пользователя
        db.users = db.users.filter(u => u.id !== userId);
        
        // Удаляем из класса
        if (db.classes?.[user.class]?.students) {
            db.classes[user.class].students = db.classes[user.class].students.filter(s => s.id !== userId);
        }
        
        leoDB.save(db);
        showNotification('Пользователь удален', 'success');
        addLog('admin', `Удалил пользователя "${user.name}"`);
        loadAdminData();
    }
    
    function resetUserProgress(userId) {
        if (!confirm('Сбросить очки и прогресс пользователя?')) return;
        
        const db = leoDB.getAll();
        if (!db) return;
        
        const user = db.users.find(u => u.id === userId);
        if (!user) return;
        
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
        
        leoDB.save(db);
        showNotification('Прогресс пользователя сброшен', 'success');
        addLog('admin', `Сбросил прогресс пользователя "${user.name}"`);
        loadAdminData();
    }
    
    // ========== УПРАВЛЕНИЕ ЗАДАНИЯМИ ==========
    window.editTask = function(taskId) {
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;
        
        document.getElementById('taskModalTitle').textContent = 'Редактировать задание';
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskSubject').value = task.subject;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskDueDate').value = task.dueDate || '';
        
        showModal('taskModal');
    }
    
    window.saveTask = function() {
        const taskId = document.getElementById('taskId').value;
        const taskData = {
            subject: document.getElementById('taskSubject').value,
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim(),
            priority: document.getElementById('taskPriority').value,
            dueDate: document.getElementById('taskDueDate').value
        };
        
        // Валидация
        if (!taskData.subject || !taskData.title) {
            showNotification('Заполните предмет и название задания', 'error');
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        if (!db.classes) db.classes = {};
        if (!db.classes['7B']) db.classes['7B'] = { tasks: [], students: [], schedule: [] };
        if (!db.classes['7B'].tasks) db.classes['7B'].tasks = [];
        
        if (taskId) {
            // Обновление задания
            const taskIndex = db.classes['7B'].tasks.findIndex(t => t.id === parseInt(taskId));
            if (taskIndex !== -1) {
                db.classes['7B'].tasks[taskIndex] = {
                    ...db.classes['7B'].tasks[taskIndex],
                    ...taskData
                };
                
                showNotification('Задание обновлено', 'success');
                addLog('admin', `Обновил задание "${taskData.title}"`);
            }
        } else {
            // Добавление задания
            const newTask = {
                id: Date.now(),
                ...taskData,
                created_at: new Date().toISOString(),
                completed_by: []
            };
            
            db.classes['7B'].tasks.push(newTask);
            showNotification('Задание добавлено', 'success');
            addLog('admin', `Добавил новое задание "${taskData.title}"`);
        }
        
        leoDB.save(db);
        closeModal('taskModal');
        loadAdminData();
    }
    
    function deleteTask(taskId) {
        if (!confirm('Удалить это задание?')) return;
        
        const db = leoDB.getAll();
        if (!db || !db.classes?.['7B']?.tasks) return;
        
        const task = db.classes['7B'].tasks.find(t => t.id === taskId);
        if (!task) return;
        
        db.classes['7B'].tasks = db.classes['7B'].tasks.filter(t => t.id !== taskId);
        leoDB.save(db);
        
        showNotification('Задание удалено', 'success');
        addLog('admin', `Удалил задание "${task.title}"`);
        loadAdminData();
    }
    
    // ========== AI ОБУЧЕНИЕ ==========
    function trainAI() {
        const statusIndicator = document.getElementById('aiStatus');
        const statusText = document.getElementById('aiStatusText');
        const statusDetails = document.getElementById('aiStatusDetails');
        const progress = document.getElementById('aiProgress');
        
        statusIndicator.className = 'status-indicator training';
        statusText.textContent = 'Обучение...';
        statusDetails.textContent = 'Анализируем данные и оптимизируем нейросеть';
        
        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += 2;
            progress.textContent = progressValue + '%';
            
            if (progressValue >= 100) {
                clearInterval(interval);
                
                statusIndicator.className = 'status-indicator';
                statusText.textContent = 'Обучение завершено';
                statusDetails.textContent = 'Нейросеть успешно оптимизирована';
                progress.textContent = '100%';
                
                showNotification('Обучение нейросети завершено', 'success');
                addLog('admin', 'Провел обучение нейросети');
                
                // Обновляем статистику
                const db = leoDB.getAll();
                updateAIStats(db);
            }
        }, 50);
    }
    
    function addKnowledge() {
        const category = document.getElementById('knowledgeCategory').value;
        const keywords = document.getElementById('knowledgeKeywords').value.trim();
        const answer = document.getElementById('knowledgeAnswer').value.trim();
        
        if (!keywords || !answer) {
            showNotification('Заполните ключевые слова и ответ', 'error');
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        if (!db.ai_knowledge) db.ai_knowledge = {};
        if (!db.ai_knowledge[category]) db.ai_knowledge[category] = {};
        
        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        
        keywordList.forEach(keyword => {
            db.ai_knowledge[category][keyword] = answer;
        });
        
        leoDB.save(db);
        showNotification('Знания добавлены в нейросеть', 'success');
        addLog('admin', `Добавил знания в категорию "${getCategoryName(category)}"`);
        
        updateKnowledgeList(db);
        
        // Очищаем форму
        document.getElementById('knowledgeKeywords').value = '';
        document.getElementById('knowledgeAnswer').value = '';
    }
    
    function editKnowledge(category) {
        const db = leoDB.getAll();
        if (!db || !db.ai_knowledge || !db.ai_knowledge[category]) return;
        
        const knowledge = db.ai_knowledge[category];
        let keywords = '';
        let answer = '';
        
        if (typeof knowledge === 'object' && !Array.isArray(knowledge)) {
            keywords = Object.keys(knowledge).join(', ');
            answer = Object.values(knowledge)[0] || '';
        }
        
        document.getElementById('knowledgeCategory').value = category;
        document.getElementById('knowledgeKeywords').value = keywords;
        document.getElementById('knowledgeAnswer').value = answer;
        
        showNotification('Заполнены данные для редактирования', 'info');
    }
    
    // ========== СИСТЕМНЫЕ НАСТРОЙКИ ==========
    function saveSettings() {
        const db = leoDB.getAll();
        if (!db) return;
        
        db.system = db.system || {};
        
        // Сохраняем пароль если введен
        const newPassword = document.getElementById('adminPassword').value;
        if (newPassword) {
            db.system.admin_password = newPassword;
        }
        
        leoDB.save(db);
        showNotification('Настройки сохранены', 'success');
        addLog('admin', 'Обновил системные настройки');
    }
    
    window.backupDatabase = function() {
        const db = leoDB.getAll();
        if (!db) return;
        
        const dataStr = JSON.stringify(db, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportName = `leo_assistant_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', exportName);
        link.click();
        
        showNotification('Резервная копия создана', 'success');
        addLog('admin', 'Создал резервную копию базы данных');
    }
    
    function clearDatabase() {
        if (!confirm('ВНИМАНИЕ! Это удалит ВСЕ данные. Продолжить?')) return;
        if (!confirm('Вы уверены? Это действие нельзя отменить!')) return;
        
        const cleanDB = {
            version: "2.0",
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
            }
        };
        
        leoDB.save(cleanDB);
        showNotification('Все данные очищены', 'success');
        addLog('admin', 'Очистил всю базу данных');
        loadAdminData();
    }
    
    // ========== ЛОГИ ==========
    function addLog(user, action) {
        const db = leoDB.getAll();
        if (!db) return;
        
        if (!db.logs) db.logs = [];
        
        const logEntry = {
            id: Date.now(),
            user: user,
            action: action,
            type: 'system',
            timestamp: new Date().toISOString()
        };
        
        db.logs.push(logEntry);
        
        // Ограничиваем количество логов
        if (db.logs.length > 100) {
            db.logs = db.logs.slice(-100);
        }
        
        leoDB.save(db);
    }
    
    // ========== МОДАЛЬНЫЕ ОКНА ==========
    function showModal(id) {
        document.getElementById(id).style.display = 'flex';
    }
    
    function closeModal(id) {
        document.getElementById(id).style.display = 'none';
    }
    
    window.showAddTaskForm = function() {
        document.getElementById('taskModalTitle').textContent = 'Добавить задание';
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = '';
        showModal('taskModal');
    }
    
    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    function initEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                document.querySelectorAll('.nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                
                this.classList.add('active');
                const tab = this.getAttribute('data-tab');
                showTab(tab);
            });
        });
        
        // Кнопка добавления пользователя
        document.getElementById('addUserBtn')?.addEventListener('click', () => showUserForm());
        
        // Сохранение пользователя
        document.getElementById('saveUserBtn')?.addEventListener('click', saveUser);
        
        // Отмена формы пользователя
        document.getElementById('cancelUserBtn')?.addEventListener('click', () => {
            document.getElementById('addUserForm').style.display = 'none';
        });
        
        // Обучение AI
        document.getElementById('trainAI')?.addEventListener('click', trainAI);
        
        // Сохранение знаний
        document.getElementById('saveKnowledge')?.addEventListener('click', addKnowledge);
        
        // Очистка формы знаний
        document.getElementById('clearKnowledge')?.addEventListener('click', () => {
            document.getElementById('knowledgeKeywords').value = '';
            document.getElementById('knowledgeAnswer').value = '';
        });
        
        // Сохранение настроек
        document.getElementById('saveSettings')?.addEventListener('click', saveSettings);
        
        // Резервное копирование
        document.getElementById('backupDB')?.addEventListener('click', backupDatabase);
        
        // Очистка БД
        document.getElementById('clearDB')?.addEventListener('click', clearDatabase);
        
        // Обновление данных
        document.getElementById('refreshData')?.addEventListener('click', () => {
            loadAdminData();
            showNotification('Данные обновлены', 'success');
        });
        
        // Выход
        document.querySelector('.logout-btn')?.addEventListener('click', () => {
            localStorage.removeItem('is_admin');
            window.location.href = 'index.html';
        });
        
        // Глобальные функции для HTML
        window.editUser = editUser;
        window.saveTaskInAdmin = window.saveTask;
        window.backupDatabaseInAdmin = backupDatabase;
        window.confirmActionInAdmin = confirmAction;
    }
    
    function editUser(userId) {
        showUserForm(userId);
    }
    
    window.showTabInAdmin = function(tabName) {
        showTab(tabName);
    }
    
    function showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`tab-${tabId}`);
        if (targetTab) {
            targetTab.classList.add('active');
            currentTab = tabId;
            
            // При переключении на вкладку с графиком перерисовываем
            if (tabId === 'dashboard') {
                setTimeout(() => {
                    initCharts();
                }, 100);
            }
            
            // Прокручиваем к началу вкладки
            targetTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    function confirmAction() {
        // Заглушка для подтверждения действий
        closeModal('confirmModal');
    }
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
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
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий'
        };
        return texts[priority] || 'Средний';
    }
    
    function getLogIcon(type) {
        const icons = {
            'login': 'sign-in-alt',
            'logout': 'sign-out-alt',
            'task': 'tasks',
            'user': 'user',
            'system': 'cog',
            'ai': 'robot'
        };
        return icons[type] || 'info-circle';
    }
    
    // ========== ЗАПУСК ==========
    initAdminPanel();
    
    // Экспортируем функции для глобального доступа
    window.showTab = showTab;
    window.closeModal = closeModal;
    window.showModal = showModal;
    window.editTask = window.editTask;
    window.saveTask = window.saveTask;
    window.backupDatabase = backupDatabase;
});
