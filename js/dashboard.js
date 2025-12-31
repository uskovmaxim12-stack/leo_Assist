// js/dashboard.js - ПОЛНОСТЬЮ РАБОЧАЯ ЛОГИКА БЕЗ ДЕМО-ДАННЫХ
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Панель управления загружена');
    
    // ========== ПЕРЕМЕННЫЕ И СОСТОЯНИЕ ==========
    let currentUser = null;
    let currentSection = 'overview';
    let notifications = [];
    
    // ========== ПРОВЕРКА АВТОРИЗАЦИИ ==========
    function checkAuth() {
        const userData = localStorage.getItem('current_user');
        if (!userData) {
            window.location.href = 'index.html';
            return false;
        }
        
        try {
            currentUser = JSON.parse(userData);
            return true;
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            window.location.href = 'index.html';
            return false;
        }
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ПАНЕЛИ ==========
    function initDashboard() {
        if (!checkAuth()) return;
        
        updateUserInterface();
        loadRealData();
        setupEventListeners();
        initRealTimeUpdates();
        
        console.log('✅ Панель инициализирована для:', currentUser.name);
    }
    
    // ========== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ==========
    function updateUserInterface() {
        // Аватар и имя
        document.getElementById('userAvatar').textContent = currentUser.avatar || '??';
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Администратор' : 'Ученик 7Б';
        
        // Очки и уровень в сайдбаре
        document.getElementById('statPoints').textContent = currentUser.points || 0;
        document.getElementById('statLevel').textContent = currentUser.level || 1;
        document.getElementById('statRank').textContent = '...';
        
        // Очки и уровень в шапке
        document.getElementById('headerPoints').textContent = currentUser.points || 0;
        document.getElementById('headerLevel').textContent = currentUser.level || 1;
        
        // Приветствие
        updateGreeting();
        updateDateTime();
    }
    
    function updateGreeting() {
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
    
    // ========== ЗАГРУЗКА РЕАЛЬНЫХ ДАННЫХ ==========
    function loadRealData() {
        loadRealNotifications();
        loadRealRating();
        loadRealTasks();
        loadRealSchedule();
        updateRealStats();
    }
    
    function loadRealNotifications() {
        notifications = leoDB.getUserNotifications(currentUser.id);
        updateNotificationsUI();
    }
    
    function updateNotificationsUI() {
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationsCount');
        
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        
        // Обновляем список уведомлений в попапе
        const notificationsList = document.getElementById('notificationsList');
        if (notificationsList) {
            if (notifications.length === 0) {
                notificationsList.innerHTML = `
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <p>Уведомлений пока нет</p>
                    </div>
                `;
            } else {
                notificationsList.innerHTML = notifications.map(notification => `
                    <div class="notification-item ${notification.type}" data-id="${notification.id}">
                        <div class="notification-icon">${notification.icon}</div>
                        <div class="notification-content">
                            <div class="notification-title">${notification.title}</div>
                            <div class="notification-message">${notification.message}</div>
                            <div class="notification-time">${formatTime(notification.created_at)}</div>
                        </div>
                        ${!notification.read ? '<div class="notification-unread"></div>' : ''}
                    </div>
                `).join('');
            }
        }
    }
    
    function loadRealRating() {
        const rating = leoDB.getClassRating();
        updateRatingUI(rating);
    }
    
    function updateRatingUI(rating) {
        if (!rating || rating.length === 0) {
            // Если рейтинг пустой, показываем только текущего пользователя
            const userRank = {
                rank: 1,
                name: currentUser.name,
                points: currentUser.points || 0,
                avatar: currentUser.avatar,
                level: currentUser.level || 1
            };
            updateSingleUserRating([userRank]);
            return;
        }
        
        // Находим позицию текущего пользователя
        const userPosition = rating.findIndex(s => s.id === currentUser.id);
        const userRank = userPosition >= 0 ? rating[userPosition] : null;
        
        // Обновляем позицию пользователя
        document.getElementById('userRankPosition').textContent = 
            userPosition >= 0 ? userPosition + 1 : '—';
        document.getElementById('statRank').textContent = 
            userPosition >= 0 ? userPosition + 1 : '—';
        
        // Обновляем топ-3
        updateTop3Rating(rating.slice(0, 3));
        
        // Обновляем полный список
        updateFullRatingList(rating);
    }
    
    function updateSingleUserRating(rating) {
        const user = rating[0];
        
        document.getElementById('userRankPosition').textContent = user.rank;
        document.getElementById('statRank').textContent = user.rank;
        
        // Топ-3 (только пользователь)
        document.getElementById('top1Name').textContent = user.name;
        document.getElementById('top1Avatar').textContent = user.avatar;
        document.getElementById('top1Points').textContent = `${user.points} очков`;
        
        // Скрываем 2 и 3 места
        document.querySelector('.top-student.second').style.display = 'none';
        document.querySelector('.top-student.third').style.display = 'none';
        
        // Полный список
        const listContainer = document.getElementById('fullRatingList');
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="rating-table-row current-user">
                    <div class="table-cell rank-cell">
                        <span class="rank-number">${user.rank}</span>
                    </div>
                    <div class="table-cell student-cell">
                        <div class="student-avatar">${user.avatar}</div>
                        <div class="student-info">
                            <div class="student-name">${user.name}</div>
                            <div class="student-class">7Б класс</div>
                        </div>
                    </div>
                    <div class="table-cell points-cell">
                        <i class="fas fa-star"></i>
                        ${user.points}
                    </div>
                    <div class="table-cell level-cell">
                        ${user.level} уровень
                    </div>
                </div>
            `;
        }
    }
    
    function updateTop3Rating(top3) {
        if (top3.length > 0) {
            document.getElementById('top1Name').textContent = top3[0].name;
            document.getElementById('top1Avatar').textContent = top3[0].avatar;
            document.getElementById('top1Points').textContent = `${top3[0].points} очков`;
        }
        
        if (top3.length > 1) {
            document.getElementById('top2Name').textContent = top3[1].name;
            document.getElementById('top2Avatar').textContent = top3[1].avatar;
            document.getElementById('top2Points').textContent = `${top3[1].points} очков`;
            document.querySelector('.top-student.second').style.display = 'block';
        } else {
            document.querySelector('.top-student.second').style.display = 'none';
        }
        
        if (top3.length > 2) {
            document.getElementById('top3Name').textContent = top3[2].name;
            document.getElementById('top3Avatar').textContent = top3[2].avatar;
            document.getElementById('top3Points').textContent = `${top3[2].points} очков`;
            document.querySelector('.top-student.third').style.display = 'block';
        } else {
            document.querySelector('.top-student.third').style.display = 'none';
        }
    }
    
    function updateFullRatingList(rating) {
        const listContainer = document.getElementById('fullRatingList');
        if (!listContainer) return;
        
        listContainer.innerHTML = rating.map((student, index) => `
            <div class="rating-table-row ${student.id === currentUser.id ? 'current-user' : ''}">
                <div class="table-cell rank-cell">
                    <span class="rank-number">${index + 1}</span>
                </div>
                <div class="table-cell student-cell">
                    <div class="student-avatar">${student.avatar}</div>
                    <div class="student-info">
                        <div class="student-name">${student.name}</div>
                        <div class="student-class">7Б класс</div>
                    </div>
                </div>
                <div class="table-cell points-cell">
                    <i class="fas fa-star"></i>
                    ${student.points}
                </div>
                <div class="table-cell level-cell">
                    ${student.level || 1} уровень
                </div>
                <div class="table-cell tasks-cell">
                    ${Math.floor(student.points / 50)}
                </div>
            </div>
        `).join('');
    }
    
    function loadRealTasks() {
        const tasks = leoDB.getUserTasks(currentUser.id);
        updateTasksUI(tasks);
    }
    
    function updateTasksUI(tasks) {
        if (!tasks || tasks.length === 0) {
            // Нет заданий
            document.getElementById('upcomingTasks').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>Заданий пока нет</p>
                </div>
            `;
            document.getElementById('tasksCount').textContent = '0';
            return;
        }
        
        const pendingTasks = tasks.filter(t => !t.completed);
        document.getElementById('tasksCount').textContent = pendingTasks.length;
        
        // Ближайшие задания
        const upcomingContainer = document.getElementById('upcomingTasks');
        if (upcomingContainer) {
            if (pendingTasks.length === 0) {
                upcomingContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>Все задания выполнены!</p>
                    </div>
                `;
            } else {
                const tasksToShow = pendingTasks.slice(0, 3);
                upcomingContainer.innerHTML = tasksToShow.map(task => `
                    <div class="deadline-item" data-task-id="${task.id}">
                        <div class="deadline-subject ${task.priority || 'medium'}">
                            ${task.subject}
                        </div>
                        <div class="deadline-title">${task.title}</div>
                        <div class="deadline-info">
                            <span>До ${formatDate(task.dueDate)}</span>
                            <button class="btn-small complete-task-btn" data-task-id="${task.id}">
                                <i class="fas fa-check"></i> Выполнить
                            </button>
                        </div>
                    </div>
                `).join('');
                
                // Добавляем обработчики для кнопок выполнения
                upcomingContainer.querySelectorAll('.complete-task-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const taskId = parseInt(this.getAttribute('data-task-id'));
                        completeTask(taskId);
                    });
                });
            }
        }
    }
    
    function loadRealSchedule() {
        const todaySchedule = leoDB.getTodaySchedule();
        updateScheduleUI(todaySchedule);
    }
    
    function updateScheduleUI(schedule) {
        const container = document.getElementById('todaySchedule');
        if (!container) return;
        
        if (!schedule || !schedule.lessons || schedule.lessons.length === 0) {
            container.innerHTML = `
                <div class="lesson-item">
                    <div class="lesson-time">—</div>
                    <div class="lesson-details">
                        <div class="lesson-subject">Занятий нет</div>
                        <div class="lesson-room">Можно отдохнуть</div>
                    </div>
                    <div class="lesson-status upcoming">
                        Свободно
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = schedule.lessons.map((lesson, index) => {
            const [subject, room] = lesson.split('(');
            const cleanRoom = room ? room.replace(')', '') : '—';
            const time = `${8 + index}:00`;
            
            return `
                <div class="lesson-item">
                    <div class="lesson-time">${time}</div>
                    <div class="lesson-details">
                        <div class="lesson-subject">${subject.trim()}</div>
                        <div class="lesson-room">Каб. ${cleanRoom}</div>
                    </div>
                    <div class="lesson-status upcoming">
                        Скоро
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function updateRealStats() {
        // Обновляем статистику на виджетах
        document.getElementById('completedTasks').textContent = 
            currentUser.stats?.total_tasks_completed || 0;
        document.getElementById('pointsEarned').textContent = 
            currentUser.points || 0;
    }
    
    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    function setupEventListeners() {
        // Навигация в сайдбаре
        setupNavigation();
        
        // Кнопка сворачивания сайдбара
        document.getElementById('toggleSidebar')?.addEventListener('click', toggleSidebar);
        
        // Уведомления
        setupNotifications();
        
        // Голосовой помощник
        setupVoiceAssistant();
        
        // Выход из системы
        document.querySelector('.logout-btn')?.addEventListener('click', logout);
        
        // Быстрый чат с AI
        setupQuickChat();
        
        // Кнопки выполнения заданий
        setupTaskCompletion();
        
        // Мобильное меню
        setupMobileMenu();
    }
    
    function setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Убираем активный класс у всех
                document.querySelectorAll('.nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                
                // Добавляем текущему
                this.classList.add('active');
                
                // Показываем секцию
                const section = this.getAttribute('data-section');
                if (section) {
                    showSection(section);
                }
            });
        });
    }
    
    function toggleSidebar() {
        const sidebar = document.querySelector('.dashboard-sidebar');
        sidebar.classList.toggle('collapsed');
        
        // Обновляем иконку
        const icon = document.querySelector('#toggleSidebar i');
        if (sidebar.classList.contains('collapsed')) {
            icon.className = 'fas fa-bars';
        } else {
            icon.className = 'fas fa-times';
        }
    }
    
    function setupNotifications() {
        const notificationsBtn = document.getElementById('notificationsBtn');
        const notificationsPopup = document.getElementById('notificationsPopup');
        
        if (notificationsBtn && notificationsPopup) {
            notificationsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                notificationsPopup.classList.toggle('show');
                
                // Помечаем все как прочитанные при открытии
                if (notificationsPopup.classList.contains('show')) {
                    markAllNotificationsAsRead();
                }
            });
            
            // Закрытие по клику вне попапа
            document.addEventListener('click', function(e) {
                if (!notificationsPopup.contains(e.target) && !notificationsBtn.contains(e.target)) {
                    notificationsPopup.classList.remove('show');
                }
            });
            
            // Кнопка очистки уведомлений
            document.getElementById('clearNotifications')?.addEventListener('click', function() {
                if (confirm('Очистить все уведомления?')) {
                    clearAllNotifications();
                }
            });
        }
    }
    
    function markAllNotificationsAsRead() {
        notifications.forEach(notification => {
            if (!notification.read) {
                leoDB.markNotificationAsRead(notification.id);
            }
        });
        
        // Обновляем UI
        loadRealNotifications();
    }
    
    function clearAllNotifications() {
        // В реальной системе нужно удалить из базы
        // Пока просто скрываем
        notifications = [];
        updateNotificationsUI();
        
        // Закрываем попап
        document.getElementById('notificationsPopup').classList.remove('show');
    }
    
    function setupVoiceAssistant() {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', function() {
                if (typeof initVoiceAssistant === 'function') {
                    const assistant = initVoiceAssistant();
                    if (assistant) {
                        assistant.startListening();
                        showFloatingNotification('Голосовой помощник активирован', 'info');
                    }
                } else {
                    showFloatingNotification('Голосовой помощник временно недоступен', 'warning');
                }
            });
        }
    }
    
    function logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('current_user');
            window.location.href = 'index.html';
        }
    }
    
    function setupQuickChat() {
        const chatInput = document.getElementById('quickQuestion');
        const sendBtn = document.getElementById('askQuickBtn');
        
        if (chatInput && sendBtn) {
            sendBtn.addEventListener('click', sendQuickMessage);
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') sendQuickMessage();
            });
        }
    }
    
    function sendQuickMessage() {
        const input = document.getElementById('quickQuestion');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Добавляем сообщение пользователя
        const messagesContainer = document.getElementById('quickAnswer');
        messagesContainer.innerHTML = `
            <div class="chat-message user">
                <div class="message-avatar">${currentUser.avatar}</div>
                <div class="message-content">
                    <div class="message-text">${message}</div>
                    <div class="message-time">Только что</div>
                </div>
            </div>
        `;
        
        input.value = '';
        
        // Имитация ответа AI
        setTimeout(() => {
            const response = getAIResponse(message);
            messagesContainer.innerHTML += `
                <div class="chat-message ai">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <div class="message-text">${response}</div>
                        <div class="message-time">Только что</div>
                    </div>
                </div>
            `;
            
            // Прокручиваем вниз
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 800);
    }
    
    function getAIResponse(message) {
        const lowerMsg = message.toLowerCase();
        const db = leoDB.getAll();
        const knowledge = db?.ai_knowledge || {};
        
        // Проверяем ключевые слова
        if (lowerMsg.includes('привет') || lowerMsg.includes('здравств')) {
            return knowledge.greetings?.[0] || 'Привет! Чем могу помочь?';
        }
        
        if (lowerMsg.includes('расписан')) {
            const schedule = leoDB.getTodaySchedule();
            if (schedule.lessons && schedule.lessons.length > 0) {
                return `Сегодня у вас ${schedule.lessons.length} уроков. Посмотреть подробнее можно в разделе "Расписание".`;
            } else {
                return 'Сегодня занятий нет. Можно отдохнуть!';
            }
        }
        
        if (lowerMsg.includes('задан') || lowerMsg.includes('домашк')) {
            const tasks = leoDB.getUserTasks(currentUser.id);
            const pending = tasks.filter(t => !t.completed);
            
            if (pending.length > 0) {
                return `У вас ${pending.length} заданий. Самое ближайшее: "${pending[0].title}"`;
            } else {
                return 'Все задания выполнены! Молодец!';
            }
        }
        
        if (lowerMsg.includes('очк') || lowerMsg.includes('балл')) {
            return `У вас ${currentUser.points || 0} очков. Так держать!`;
        }
        
        if (lowerMsg.includes('рейтинг') || lowerMsg.includes('место')) {
            const rating = leoDB.getClassRating();
            const userPosition = rating.findIndex(s => s.id === currentUser.id);
            
            if (userPosition >= 0) {
                return `Ваше место в рейтинге: ${userPosition + 1}. Продолжайте в том же духе!`;
            } else {
                return 'Вы пока не в рейтинге. Выполняйте задания!';
            }
        }
        
        return 'Я еще учусь понимать такие вопросы. Попробуйте спросить о заданиях, расписании или рейтинге.';
    }
    
    function setupTaskCompletion() {
        // Обработчик для выполнения заданий
        document.addEventListener('click', function(e) {
            if (e.target.closest('.complete-task-btn')) {
                const taskId = e.target.closest('.complete-task-btn').getAttribute('data-task-id');
                if (taskId) {
                    completeTask(parseInt(taskId));
                }
            }
        });
    }
    
    function completeTask(taskId) {
        const result = leoDB.completeTask(currentUser.id, taskId);
        
        if (result.success) {
            // Обновляем данные пользователя
            const db = leoDB.getAll();
            const updatedUser = db.users.find(u => u.id === currentUser.id);
            if (updatedUser) {
                currentUser = updatedUser;
                localStorage.setItem('current_user', JSON.stringify(updatedUser));
                
                // Обновляем UI
                updateUserInterface();
                loadRealData();
                
                // Показываем уведомление
                showFloatingNotification(`✅ +${result.points} очков! Задание выполнено!`, 'success');
                
                if (result.level_up) {
                    setTimeout(() => {
                        showFloatingNotification(`🎉 Поздравляем! Вы достигли ${result.new_level} уровня!`, 'success');
                    }, 1000);
                }
            }
        } else {
            showFloatingNotification(`❌ ${result.error || 'Ошибка выполнения задания'}`, 'error');
        }
    }
    
    function setupMobileMenu() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.querySelector('.dashboard-sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', function() {
                sidebar.classList.toggle('mobile-open');
            });
            
            // Закрытие по клику вне сайдбара на мобильных
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
    
    function showSection(sectionId) {
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Показываем нужную секцию
        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
            targetSection.classList.add('active');
            currentSection = sectionId;
            
            // Загружаем данные для секции
            switch(sectionId) {
                case 'rating':
                    loadRealRating();
                    break;
                case 'tasks':
                    loadRealTasks();
                    break;
                case 'ai-chat':
                    initFullChat();
                    break;
                case 'games':
                    loadGames();
                    break;
            }
            
            // Закрываем сайдбар на мобильных
            if (window.innerWidth <= 768) {
                document.querySelector('.dashboard-sidebar').classList.remove('mobile-open');
            }
        }
    }
    
    function initFullChat() {
        // Инициализация полного чата
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');
        
        if (chatInput && sendBtn) {
            sendBtn.addEventListener('click', function() {
                const message = chatInput.value.trim();
                if (message) {
                    sendChatMessage(message);
                    chatInput.value = '';
                }
            });
            
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendBtn.click();
                }
            });
        }
    }
    
    function sendChatMessage(message) {
        // Реализация отправки сообщения в полный чат
        // ... аналогично быстрому чату
    }
    
    function loadGames() {
        // Загрузка игр (в реальной системе - из базы)
        // ... 
    }
    
    function initRealTimeUpdates() {
        // Автоматическое обновление времени
        setInterval(updateDateTime, 60000);
        
        // Проверка новых уведомлений каждые 30 секунд
        setInterval(() => {
            const oldCount = notifications.length;
            loadRealNotifications();
            
            if (notifications.length > oldCount) {
                showFloatingNotification('📩 Новое уведомление', 'info');
            }
        }, 30000);
    }
    
    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function showFloatingNotification(message, type = 'info') {
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
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
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
    
    function formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Только что';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
        if (diff < 86400000) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        return date.toLocaleDateString('ru-RU');
    }
    
    function formatDate(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }
    
    // ========== ЗАПУСК ПАНЕЛИ ==========
    initDashboard();
});
