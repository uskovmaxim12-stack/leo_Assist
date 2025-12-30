// js/admin.js - АДМИН-ПАНЕЛЬ С РЕАЛЬНЫМИ ДАННЫМИ
document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Админ-панель загружена');
    
    // ========== ПРОВЕРКА ПРАВ ==========
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (!isAdmin) {
        alert('Доступ запрещен! Требуются права администратора.');
        window.location.href = 'index.html';
        return;
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function initAdminPanel() {
        updateTime();
        setInterval(updateTime, 1000);
        
        loadAdminData();
        initEventListeners();
    }
    
    function updateTime() {
        const now = new Date();
        document.getElementById('adminTime').textContent = 
            now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    
    // ========== ЗАГРУЗКА ДАННЫХ ==========
    function loadAdminData() {
        const db = leoDB.getAll();
        if (!db) {
            console.error('База данных не найдена');
            return;
        }
        
        // Статистика
        updateStats(db);
        
        // Пользователи
        updateUsersTable(db);
        
        // Задания
        updateTasksList(db);
    }
    
    function updateStats(db) {
        const totalUsers = (db.users || []).length;
        const totalTasks = (db.classes?.['7B']?.tasks || []).length;
        const activeUsers = (db.users || []).filter(u => u.last_login).length;
        
        document.getElementById('statTotalUsers').textContent = totalUsers;
        document.getElementById('statTotalTasks').textContent = totalTasks;
        document.getElementById('statActiveUsers').textContent = activeUsers;
        
        document.getElementById('usersCount').textContent = totalUsers;
    }
    
    function updateUsersTable(db) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const users = db.users || [];
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <div class="empty-state">
                            <i class="fas fa-users-slash"></i>
                            <p>Пользователей нет</p>
                            <small>Пользователи появятся после регистрации</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            const registerDate = new Date(user.created_at).toLocaleDateString('ru-RU');
            const lastLogin = user.last_login 
                ? new Date(user.last_login).toLocaleDateString('ru-RU')
                : 'Никогда';
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="item-avatar">${user.avatar}</div>
                        ${user.name}
                    </div>
                </td>
                <td>${user.login}</td>
                <td>${user.class || '7B'}</td>
                <td><strong>${user.points || 0}</strong></td>
                <td>${user.level || 1}</td>
                <td>${registerDate}</td>
                <td>${lastLogin}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    function updateTasksList(db) {
        const tasksContainer = document.getElementById('adminTasksList');
        if (!tasksContainer) return;
        
        const tasks = db.classes?.['7B']?.tasks || [];
        
        if (tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-tasks">
                    <i class="fas fa-tasks"></i>
                    <p>Заданий пока нет</p>
                    <small>Добавьте первое задание через форму ниже</small>
                </div>
            `;
        } else {
            tasksContainer.innerHTML = '';
            tasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'admin-task-item';
                taskElement.innerHTML = `
                    <div class="task-header">
                        <span class="task-subject">${task.subject}</span>
                        <span class="task-due">До: ${new Date(task.dueDate).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${getPriorityName(task.priority)}</span>
                        <span class="task-completed">Выполнили: ${task.completed_by?.length || 0} учеников</span>
                    </div>
                `;
                tasksContainer.appendChild(taskElement);
            });
        }
    }
    
    function getPriorityName(priority) {
        const names = {
            'high': 'Высокий',
            'medium': 'Средний',
            'low': 'Низкий'
        };
        return names[priority] || priority;
    }
    
    // ========== ДОБАВЛЕНИЕ ЗАДАНИЯ ==========
    function initEventListeners() {
        // Кнопка добавления задания
        document.getElementById('addTaskBtn')?.addEventListener('click', function() {
            showAddTaskForm();
        });
        
        // Сохранение задания
        document.getElementById('saveTaskBtn')?.addEventListener('click', handleAddTask);
        
        // Отмена добавления задания
        document.getElementById('cancelTaskBtn')?.addEventListener('click', function() {
            document.getElementById('addTaskForm').style.display = 'none';
        });
        
        // Обновление данных
        document.getElementById('refreshData')?.addEventListener('click', function() {
            loadAdminData();
            showNotification('Данные обновлены', 'success');
        });
        
        // Выход
        document.querySelector('.logout-btn')?.addEventListener('click', function() {
            localStorage.removeItem('is_admin');
            window.location.href = 'index.html';
        });
        
        // Переход в панель ученика
        document.getElementById('goToDashboard')?.addEventListener('click', function() {
            const user = JSON.parse(localStorage.getItem('current_user') || '{}');
            if (user.id) {
                window.location.href = 'dashboard.html';
            } else {
                showNotification('Сначала войдите как ученик', 'error');
            }
        });
    }
    
    function showAddTaskForm() {
        const form = document.getElementById('addTaskForm');
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }
    
    function handleAddTask() {
        const subject = document.getElementById('taskSubject').value.trim();
        const title = document.getElementById('taskTitle').value.trim();
        const dueDate = document.getElementById('taskDueDate').value;
        const priority = document.getElementById('taskPriority').value;
        
        if (!subject || !title || !dueDate) {
            showNotification('Заполните все обязательные поля', 'error');
            return;
        }
        
        const taskData = {
            subject: subject,
            title: title,
            dueDate: dueDate,
            priority: priority
        };
        
        const success = leoDB.addTask(taskData);
        
        if (success) {
            showNotification('Задание успешно добавлено', 'success');
            document.getElementById('addTaskForm').style.display = 'none';
            document.getElementById('taskSubject').value = '';
            document.getElementById('taskTitle').value = '';
            
            // Обновляем данные
            loadAdminData();
        } else {
            showNotification('Ошибка при добавлении задания', 'error');
        }
    }
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }
    
    // ========== ЗАПУСК ==========
    initAdminPanel();
});
