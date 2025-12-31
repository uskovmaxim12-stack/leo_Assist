// РЕАЛЬНЫЙ ДАШБОРД ПОЛЬЗОВАТЕЛЯ - ВСЕ КНОПКИ РАБОТАЮТ
class UserDashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    
    init() {
        // Проверяем авторизацию
        if (!this.checkAuth()) return;
        
        // Загружаем данные
        this.loadData();
        
        // Настраиваем интерфейс
        this.setupUI();
        
        console.log('✅ Дашборд готов');
    }
    
    checkAuth() {
        this.currentUser = window.leoDB.getCurrentUser();
        
        if (!this.currentUser) {
            localStorage.removeItem('leo_current_user');
            window.location.href = 'index.html';
            return false;
        }
        
        return true;
    }
    
    loadData() {
        // Загружаем реальные данные пользователя
        this.updateUserInfo();
        this.loadTasks();
        this.loadStats();
        this.loadAIHistory();
    }
    
    updateUserInfo() {
        if (!this.currentUser) return;
        
        // Обновляем информацию в интерфейсе
        const elements = {
            'userName': this.currentUser.name,
            'userRole': this.currentUser.role === 'admin' ? 'Администратор' : 'Ученик',
            'userClass': this.currentUser.class || '7Б класс',
            'userPoints': this.currentUser.points || 0,
            'userLevel': this.currentUser.level || 1,
            'userTasks': this.currentUser.tasks_completed?.length || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Аватар
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            avatar.textContent = this.currentUser.name.charAt(0);
        }
    }
    
    loadTasks() {
        const tasks = window.leoDB.getAllTasks();
        const currentUser = this.currentUser;
        
        // Фильтруем задания: активные (не выполненные пользователем)
        const activeTasks = tasks.filter(task => {
            return !currentUser.tasks_completed?.includes(task.id);
        });
        
        const container = document.getElementById('tasksList');
        if (!container) return;
        
        if (activeTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-tasks">
                    <i class="fas fa-check-circle"></i>
                    <p>Все задания выполнены!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        activeTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }
    
    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item task-${task.priority || 'medium'}`;
        div.dataset.taskId = task.id;
        
        const dueDate = task.due_date ? 
            new Date(task.due_date).toLocaleDateString('ru-RU') : 'Без срока';
        
        div.innerHTML = `
            <div class="task-icon">
                <i class="fas fa-${this.getTaskIcon(task.subject)}"></i>
            </div>
            <div class="task-content">
                <h4>${task.title}</h4>
                <div class="task-meta">
                    <span class="task-subject">${task.subject || 'Общее'}</span>
                    <span class="task-due">до ${dueDate}</span>
                </div>
                ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn-complete" onclick="userDashboard.completeTask(${task.id})">
                    <i class="fas fa-check"></i>
                    Выполнить
                </button>
            </div>
        `;
        
        return div;
    }
    
    getTaskIcon(subject) {
        const icons = {
            'Математика': 'calculator',
            'Физика': 'atom',
            'История': 'landmark',
            'Английский': 'language',
            'Русский': 'book',
            'Информатика': 'laptop-code',
            'default': 'book'
        };
        
        if (!subject) return icons.default;
        
        for (const [key, icon] of Object.entries(icons)) {
            if (subject.includes(key)) return icon;
        }
        
        return icons.default;
    }
    
    completeTask(taskId) {
        if (!this.currentUser) return;
        
        const result = window.leoDB.completeTask(this.currentUser.id, taskId);
        
        if (result.success) {
            this.showToast(`Задание выполнено! +50 очков`, 'success');
            
            // Обновляем данные
            this.currentUser = window.leoDB.getCurrentUser();
            this.loadData();
        } else {
            this.showToast(result.error || 'Ошибка', 'error');
        }
    }
    
    loadStats() {
        const users = window.leoDB.getAllUsers()
            .filter(u => u.role !== 'admin')
            .sort((a, b) => (b.points || 0) - (a.points || 0));
        
        const container = document.getElementById('ratingList');
        if (!container) return;
        
        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-rating">
                    <i class="fas fa-users"></i>
                    <p>Пока нет пользователей</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        users.forEach((user, index) => {
            const isCurrent = user.id === this.currentUser.id;
            const row = this.createRatingRow(user, index + 1, isCurrent);
            container.appendChild(row);
        });
    }
    
    createRatingRow(user, position, isCurrent = false) {
        const div = document.createElement('div');
        div.className = `rating-row ${isCurrent ? 'current-user' : ''} ${position <= 3 ? 'top-' + position : ''}`;
        
        div.innerHTML = `
            <div class="rating-position">${position}</div>
            <div class="rating-user">
                <div class="user-avatar">${user.name.charAt(0)}</div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-class">${user.class || '—'}</div>
                </div>
            </div>
            <div class="rating-points">
                <i class="fas fa-star"></i>
                <span>${user.points || 0}</span>
            </div>
        `;
        
        return div;
    }
    
    loadAIHistory() {
        // Можно добавить историю чата с AI
        const container = document.getElementById('aiChat');
        if (container) {
            container.innerHTML = `
                <div class="ai-welcome">
                    <div class="ai-avatar">Л</div>
                    <div class="ai-message">
                        <p>Привет! Я Лео, твой помощник в учебе.</p>
                        <p>Спроси меня о чем угодно!</p>
                    </div>
                </div>
            `;
        }
    }
    
    askAI() {
        const input = document.getElementById('aiInput');
        const container = document.getElementById('aiChat');
        
        if (!input || !container) return;
        
        const question = input.value.trim();
        if (!question) {
            this.showToast('Введите вопрос', 'warning');
            return;
        }
        
        // Добавляем вопрос пользователя
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.innerHTML = `
            <div class="message-avatar">${this.currentUser.name.charAt(0)}</div>
            <div class="message-content">${question}</div>
        `;
        container.appendChild(userMessage);
        
        // Очищаем поле ввода
        input.value = '';
        
        // Показываем индикатор загрузки
        const loading = document.createElement('div');
        loading.className = 'message ai-message loading';
        loading.innerHTML = `
            <div class="message-avatar">Л</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        container.appendChild(loading);
        
        // Прокручиваем вниз
        container.scrollTop = container.scrollHeight;
        
        // Имитация задержки и получение ответа
        setTimeout(() => {
            loading.remove();
            
            // Получаем ответ от AI
            const answer = window.leoDB.askAI(question);
            
            // Добавляем ответ AI
            const aiMessage = document.createElement('div');
            aiMessage.className = 'message ai-message';
            aiMessage.innerHTML = `
                <div class="message-avatar">Л</div>
                <div class="message-content">${answer}</div>
            `;
            container.appendChild(aiMessage);
            
            // Прокручиваем вниз
            container.scrollTop = container.scrollHeight;
            
            // Логируем запрос
            window.leoDB.addLog(this.currentUser.id, `Спросил AI: "${question}"`, 'ai');
            
        }, 1000 + Math.random() * 1000);
    }
    
    setupUI() {
        // Кнопка AI
        const askBtn = document.getElementById('askAI');
        if (askBtn) {
            askBtn.addEventListener('click', () => this.askAI());
        }
        
        // Поле ввода AI (нажатие Enter)
        const aiInput = document.getElementById('aiInput');
        if (aiInput) {
            aiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.askAI();
                }
            });
        }
        
        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Выйти из системы?')) {
                    window.leoDB.logout();
                    localStorage.removeItem('leo_current_user');
                    window.location.href = 'index.html';
                }
            });
        }
        
        // Кнопка обновления
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadData();
                this.showToast('Данные обновлены', 'success');
            });
        }
        
        // Навигация
        this.setupNavigation();
    }
    
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Убираем активность у всех
                navItems.forEach(i => i.classList.remove('active'));
                
                // Добавляем активность текущему
                item.classList.add('active');
                
                // Показываем нужный раздел
                const section = item.dataset.section;
                this.showSection(section);
            });
        });
    }
    
    showSection(sectionId) {
        // Скрываем все секции
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Показываем нужную секцию
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer') || 
                         (() => {
                             const div = document.createElement('div');
                             div.id = 'toastContainer';
                             div.className = 'toast-container';
                             document.body.appendChild(div);
                             return div;
                         })();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }
    
    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.userDashboard = new UserDashboard();
});

// Экспортируем функции для HTML
window.completeTask = function(taskId) {
    if (window.userDashboard) {
        window.userDashboard.completeTask(taskId);
    }
};

window.askAI = function() {
    if (window.userDashboard) {
        window.userDashboard.askAI();
    }
};
