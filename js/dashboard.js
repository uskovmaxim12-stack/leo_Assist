// js/dashboard.js - ПАНЕЛЬ УЧЕНИКА С РЕАЛЬНЫМИ ДАННЫМИ
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 Дашборд ученика загружен');
    
    // ========== ПРОВЕРКА АВТОРИЗАЦИИ ==========
    const userData = localStorage.getItem('current_user');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    const currentUser = JSON.parse(userData);
    console.log('👤 Текущий пользователь:', currentUser.name);
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    function initDashboard() {
        // Обновляем интерфейс пользователя
        updateUserUI();
        
        // Загружаем данные
        loadDashboardData();
        
        // Инициализируем события
        initEventListeners();
        
        // Обновляем время
        updateDateTime();
        setInterval(updateDateTime, 60000);
    }
    
    // ========== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ==========
    function updateUserUI() {
        // Аватар и имя
        document.getElementById('userAvatar').textContent = currentUser.avatar || '??';
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Администратор' : 'Ученик 7Б';
        
        // Статистика
        document.getElementById('statPoints').textContent = currentUser.points || 0;
        document.getElementById('statLevel').textContent = currentUser.level || 1;
        
        // Приветствие
        const hour = new Date().getHours();
        let greeting = 'Доброй ночи';
        if (hour >= 5 && hour < 12) greeting = 'Доброе утро';
        else if (hour >= 12 && hour < 18) greeting = 'Добрый день';
        else if (hour >= 18 && hour < 23) greeting = 'Добрый вечер';
        
        document.getElementById('greetingText').textContent = `${greeting}, ${currentUser.name.split(' ')[0]}!`;
    }
    
    function updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = 
            now.toLocaleDateString('ru-RU', options);
    }
    
    // ========== ЗАГРУЗКА ДАННЫХ ==========
    function loadDashboardData() {
        const db = leoDB.getAll();
        if (!db) {
            console.error('База данных не найдена');
            return;
        }
        
        // 1. РЕЙТИНГ КЛАССА (реальные данные)
        loadClassRating();
        
        // 2. ЗАДАНИЯ (реальные данные)
        loadTasks();
        
        // 3. РАСПИСАНИЕ
        loadSchedule();
        
        // 4. СТАТИСТИКА
        updateStats();
    }
    
    function loadClassRating() {
        const rating = leoDB.getClassRating();
        
        if (rating.length === 0) {
            // Рейтинг пуст
            document.getElementById('userRankPosition').textContent = '-';
            document.getElementById('statRank').textContent = '-';
            
            // Очищаем топ-3
            document.getElementById('top1Name').textContent = 'Нет данных';
            document.getElementById('top1Points').textContent = '0 очков';
            document.getElementById('top2Name').textContent = 'Нет данных';
            document.getElementById('top2Points').textContent = '0 очков';
            document.getElementById('top3Name').textContent = 'Нет данных';
            document.getElementById('top3Points').textContent = '0 очков';
            
            // Очищаем список
            const listContainer = document.getElementById('fullRatingList');
            if (listContainer) {
                listContainer.innerHTML = `
                    <div class="empty-rating">
                        <i class="fas fa-users-slash"></i>
                        <p>Рейтинг класса пуст</p>
                        <small>Здесь появятся ученики после регистрации</small>
                    </div>
                `;
            }
        } else {
            // Есть рейтинг - обновляем
            updateRatingUI(rating);
        }
    }
    
    function updateRatingUI(rating) {
        // Находим позицию текущего пользователя
        const userPosition = rating.findIndex(s => s.id === currentUser.id) + 1;
        document.getElementById('userRankPosition').textContent = userPosition || '-';
        document.getElementById('statRank').textContent = userPosition || '-';
        
        // Топ-3
        if (rating.length > 0) {
            document.getElementById('top1Name').textContent = rating[0]?.name || '-';
            document.getElementById('top1Avatar').textContent = rating[0]?.avatar || '??';
            document.getElementById('top1Points').textContent = `${rating[0]?.points || 0} очков`;
        }
        if (rating.length > 1) {
            document.getElementById('top2Name').textContent = rating[1]?.name || '-';
            document.getElementById('top2Avatar').textContent = rating[1]?.avatar || '??';
            document.getElementById('top2Points').textContent = `${rating[1]?.points || 0} очков`;
        }
        if (rating.length > 2) {
            document.getElementById('top3Name').textContent = rating[2]?.name || '-';
            document.getElementById('top3Avatar').textContent = rating[2]?.avatar || '??';
            document.getElementById('top3Points').textContent = `${rating[2]?.points || 0} очков`;
        }
        
        // Полный список
        const listContainer = document.getElementById('fullRatingList');
        if (listContainer) {
            listContainer.innerHTML = '';
            rating.forEach((student, index) => {
                const item = document.createElement('div');
                item.className = `rating-item ${student.id === currentUser.id ? 'current-user' : ''}`;
                item.innerHTML = `
                    <div class="item-rank">${index + 1}</div>
                    <div class="item-avatar">${student.avatar || '??'}</div>
                    <div class="item-name">${student.name}</div>
                    <div class="item-points">${student.points || 0}</div>
                    <div class="item-tasks">${Math.floor((student.points || 0) / 50)}</div>
                `;
                listContainer.appendChild(item);
            });
        }
    }
    
    function loadTasks() {
        const db = leoDB.getAll();
        if (!db || !db.classes || !db.classes['7B']) {
            showNoTasks();
            return;
        }
        
        const tasks = db.classes['7B'].tasks || [];
        
        if (tasks.length === 0) {
            showNoTasks();
        } else {
            updateTasksUI(tasks);
        }
    }
    
    function showNoTasks() {
        // Ближайшие задания
        const upcomingContainer = document.getElementById('upcomingTasks');
        if (upcomingContainer) {
            upcomingContainer.innerHTML = `
                <div class="empty-tasks">
                    <i class="fas fa-clipboard-check"></i>
                    <p>Заданий пока нет</p>
                    <small>Задания появятся из админ-панели</small>
                </div>
            `;
        }
        
        // Счетчик заданий
        document.getElementById('tasksCount').textContent = '0';
    }
    
    function updateTasksUI(tasks) {
        // Счетчик заданий
        const pendingTasks = tasks.filter(t => !currentUser.tasks_completed?.includes(t.id));
        document.getElementById('tasksCount').textContent = pendingTasks.length;
        
        // Ближайшие задания
        const upcomingContainer = document.getElementById('upcomingTasks');
        if (upcomingContainer) {
            upcomingContainer.innerHTML = '';
            
            if (pendingTasks.length === 0) {
                upcomingContainer.innerHTML = `
                    <div class="empty-tasks">
                        <i class="fas fa-check-circle"></i>
                        <p>Все задания выполнены!</p>
                    </div>
                `;
            } else {
                pendingTasks.slice(0, 3).forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'task-item';
                    taskItem.innerHTML = `
                        <div class="task-info">
                            <div class="task-subject">${task.subject}</div>
                            <div class="task-title">${task.title}</div>
                            <div class="task-due ${task.priority}">
                                До ${new Date(task.dueDate).toLocaleDateString('ru-RU')}
                            </div>
                        </div>
                        <button class="btn-small btn-complete" data-task-id="${task.id}">
                            <i class="fas fa-check"></i>
                        </button>
                    `;
                    upcomingContainer.appendChild(taskItem);
                });
            }
        }
    }
    
    function loadSchedule() {
        const db = leoDB.getAll();
        if (!db || !db.classes || !db.classes['7B'] || !db.classes['7B'].schedule) {
            showNoSchedule();
            return;
        }
        
        const schedule = db.classes['7B'].schedule;
        const todayIndex = new Date().getDay() - 1;
        const todaySchedule = schedule[todayIndex >= 0 ? todayIndex : 0];
        
        updateScheduleUI(todaySchedule);
    }
    
    function showNoSchedule() {
        const container = document.getElementById('todaySchedule');
        if (container) {
            container.innerHTML = `
                <div class="empty-schedule">
                    <i class="fas fa-calendar-times"></i>
                    <p>Расписание не загружено</p>
                    <small>Расписание появится из админ-панели</small>
                </div>
            `;
        }
    }
    
    function updateScheduleUI(todaySchedule) {
        const container = document.getElementById('todaySchedule');
        if (!container) return;
        
        if (!todaySchedule) {
            showNoSchedule();
            return;
        }
        
        container.innerHTML = '';
        todaySchedule.lessons.forEach((lesson, index) => {
            const lessonItem = document.createElement('div');
            lessonItem.className = 'schedule-item';
            
            const time = lesson.split(' ')[0] || `${9 + index}:00`;
            const name = lesson.includes('(') 
                ? lesson.substring(0, lesson.indexOf('(')).trim()
                : lesson;
            const room = lesson.match(/\((\d+)\)/)?.[1] || '???';
            
            lessonItem.innerHTML = `
                <div class="lesson-time">${time}</div>
                <div class="lesson-info">
                    <div class="lesson-name">${name}</div>
                    <div class="lesson-room">Каб. ${room}</div>
                </div>
            `;
            container.appendChild(lessonItem);
        });
    }
    
    function updateStats() {
        // Считаем выполненные задания
        const completedCount = currentUser.tasks_completed?.length || 0;
        document.getElementById('completedTasks').textContent = completedCount;
        document.getElementById('pointsEarned').textContent = currentUser.points || 0;
    }
    
    // ========== AI ЧАТ ==========
    function initAIChat() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendMessage');
        
        if (chatInput && sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }
        
        // Быстрый чат
        const quickQuestion = document.getElementById('quickQuestion');
        const quickBtn = document.getElementById('askQuickBtn');
        
        if (quickQuestion && quickBtn) {
            quickBtn.addEventListener('click', sendQuickMessage);
            quickQuestion.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendQuickMessage();
            });
        }
    }
    
    function sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        addMessageToChat(message, 'user');
        input.value = '';
        
        // Ответ AI
        setTimeout(() => {
            const response = getAIResponse(message);
            addMessageToChat(response, 'ai');
        }, 800);
    }
    
    function sendQuickMessage() {
        const input = document.getElementById('quickQuestion');
        const message = input.value.trim();
        if (!message) return;
        
        const response = getAIResponse(message);
        document.getElementById('quickAnswer').innerHTML = `
            <div class="ai-response">
                <strong>Лео:</strong> ${response}
            </div>
        `;
        
        input.value = '';
        
        setTimeout(() => {
            document.getElementById('quickAnswer').innerHTML = '';
        }, 10000);
    }
    
    function getAIResponse(message) {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('привет') || lowerMsg.includes('здравств')) {
            return `Привет, ${currentUser.name.split(' ')[0]}! Как дела?`;
        }
        if (lowerMsg.includes('задан')) {
            return 'Задания появятся в системе позже. Следи за обновлениями!';
        }
        if (lowerMsg.includes('рейтинг')) {
            return 'Рейтинг класса обновится, когда появятся другие ученики. Ты пока первый!';
        }
        if (lowerMsg.includes('расписан')) {
            return 'Расписание будет загружено администратором в ближайшее время.';
        }
        if (lowerMsg.includes('очк') || lowerMsg.includes('балл')) {
            return `У тебя ${currentUser.points || 0} очков. Выполняй задания, чтобы получить больше!`;
        }
        
        return 'Я пока только учусь. Задай более конкретный вопрос!';
    }
    
    function addMessageToChat(text, sender) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        const time = new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="chat-avatar">${sender === 'ai' ? '🤖' : '👤'}</div>
            <div class="chat-content">
                <div class="chat-text">${text}</div>
                <div class="chat-time">${time}</div>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
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
                
                const section = this.getAttribute('data-section');
                showSection(section);
            });
        });
        
        // Выход из системы
        document.querySelector('.logout-btn')?.addEventListener('click', function() {
            localStorage.removeItem('current_user');
            localStorage.removeItem('is_admin');
            window.location.href = 'index.html';
        });
        
        // AI чат
        initAIChat();
        
        // Обновление данных
        document.getElementById('refreshData')?.addEventListener('click', function() {
            loadDashboardData();
            showNotification('Данные обновлены', 'success');
        });
    }
    
    function showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Загружаем данные для секции
            if (sectionId === 'rating') {
                loadClassRating();
            }
        }
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
    
    // ========== ЗАПУСК ==========
    initDashboard();
});
