// js/dashboard.js - ЛОГИКА БЕЗ ДЕМО
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Дашборд загружен');
    
    // Проверяем авторизацию
    const currentUser = JSON.parse(localStorage.getItem('current_user'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Обновляем информацию о пользователе
    updateUserInfo(currentUser);
    
    // Инициализация
    initNavigation();
    initAIChat();
    loadSchedule();
    loadClassRating();
    loadTasks();
    initGameZone();
    
    // ========== ФУНКЦИИ ==========
    
    function updateUserInfo(user) {
        const userName = document.querySelector('.user-name');
        const userAvatar = document.querySelector('.user-avatar');
        const userPoints = document.querySelector('.user-points');
        const userLevel = document.querySelector('.user-level');
        
        if (userName) userName.textContent = user.name;
        if (userAvatar) userAvatar.textContent = user.avatar;
        if (userPoints) userPoints.textContent = user.points || 0;
        if (userLevel) userLevel.textContent = `Уровень ${user.level || 1}`;
    }
    
    function initNavigation() {
        // Навигация
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Выход
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Выйти из системы?')) {
                    localStorage.removeItem('current_user');
                    window.location.href = 'index.html';
                }
            });
        }
    }
    
    function loadSchedule() {
        const scheduleContainer = document.querySelector('.schedule-list');
        if (!scheduleContainer) return;
        
        // Реальное расписание 7Б
        const schedule = [
            {
                day: 'Понедельник',
                lessons: [
                    '13:10-13:50 История (16 каб)',
                    '14:00-14:40 Разговоры о важном (21 каб)',
                    '14:50-15:30 Биология (21 каб)',
                    '15:40-16:20 Русский язык (32 каб)',
                    '16:30-17:10 Труд (6 каб)',
                    '17:15-17:55 Труд (6 каб)',
                    '18:00-18:40 Литература (32 каб)'
                ]
            },
            {
                day: 'Вторник',
                lessons: [
                    '13:10-13:50 Информатика (42 каб)',
                    '14:00-14:40 История (16 каб)',
                    '14:50-15:30 ИЗО (6 каб)',
                    '15:40-16:20 Алгебра (34 каб)',
                    '16:30-17:10 Русский язык (32 каб)',
                    '17:15-17:55 Физ-ра (СЗ)',
                    '18:00-18:40 Геометрия (34 каб)'
                ]
            }
        ];
        
        scheduleContainer.innerHTML = '';
        
        schedule.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'schedule-day';
            dayElement.innerHTML = `
                <div class="schedule-day-header">${day.day}</div>
                ${day.lessons.map(lesson => 
                    `<div class="schedule-lesson">${lesson}</div>`
                ).join('')}
            `;
            scheduleContainer.appendChild(dayElement);
        });
    }
    
    function loadClassRating() {
        const ratingList = document.querySelector('.rating-list');
        if (!ratingList) return;
        
        // Получаем реальных пользователей
        const users = leoDB.getClassRating();
        
        if (users.length === 0) {
            ratingList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>Пока нет других пользователей</p>
                </div>
            `;
            return;
        }
        
        ratingList.innerHTML = '';
        
        users.forEach((user, index) => {
            const isCurrentUser = user.id === currentUser.id;
            const item = document.createElement('div');
            item.className = `rating-item ${isCurrentUser ? 'current-user' : ''}`;
            item.innerHTML = `
                <div class="rating-rank">${index + 1}</div>
                <div class="rating-avatar">${user.avatar}</div>
                <div class="rating-info">
                    <div class="rating-name">${user.name}</div>
                    <div class="rating-details">${user.points || 0} очков</div>
                </div>
            `;
            ratingList.appendChild(item);
        });
    }
    
    function initAIChat() {
        const chatInput = document.querySelector('.chat-input input');
        const chatSendBtn = document.querySelector('.chat-send-btn');
        const chatMessages = document.querySelector('.chat-messages');
        
        if (!chatInput || !chatSendBtn || !chatMessages) return;
        
        // Приветствие
        addMessage('ai', 'Привет! Я Лео, твой учебный помощник. Чем могу помочь?');
        
        function sendMessage() {
            const text = chatInput.value.trim();
            if (!text) return;
            
            addMessage('user', text);
            chatInput.value = '';
            
            setTimeout(() => {
                const response = getAIResponse(text);
                addMessage('ai', response);
            }, 800);
        }
        
        function getAIResponse(question) {
            const lowerQ = question.toLowerCase();
            
            if (lowerQ.includes('привет')) return 'Привет! Чем могу помочь?';
            if (lowerQ.includes('расписан')) return 'Расписание на неделю показано слева';
            if (lowerQ.includes('математ')) return 'Математика изучает числа и их свойства';
            if (lowerQ.includes('физик')) return 'Физика - наука о природе';
            if (lowerQ.includes('истори')) return 'История изучает прошлое человечества';
            
            return 'Спроси меня о расписании или уроках';
        }
        
        function addMessage(type, text) {
            const message = document.createElement('div');
            message.className = `chat-message ${type}-message`;
            
            if (type === 'user') {
                message.innerHTML = `<div class="message-content">${text}</div>`;
            } else {
                message.innerHTML = `
                    <div class="chat-avatar">Л</div>
                    <div class="chat-text">${text}</div>
                `;
            }
            
            chatMessages.appendChild(message);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        chatSendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    function loadTasks() {
        const tasksList = document.querySelector('.tasks-list');
        if (!tasksList) return;
        
        // Пустой список заданий
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <p>Нет активных заданий</p>
            </div>
        `;
    }
    
    function initGameZone() {
        const completeBtn = document.querySelector('.complete-task-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', function() {
                // Добавляем очки
                leoDB.updateUserPoints(currentUser.id, 50);
                
                // Обновляем текущего пользователя
                currentUser.points = (currentUser.points || 0) + 50;
                currentUser.level = Math.floor(currentUser.points / 250) + 1;
                localStorage.setItem('current_user', JSON.stringify(currentUser));
                
                // Обновляем интерфейс
                updateUserInfo(currentUser);
                loadClassRating();
                
                showNotification('+50 очков!');
            });
        }
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #8b5cf6;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
});
