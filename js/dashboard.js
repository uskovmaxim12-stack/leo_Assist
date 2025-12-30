// dashboard.js - ПОЛНАЯ ЛОГИКА ПОЛЬЗОВАТЕЛЬСКОЙ ПАНЕЛИ
class DashboardSystem {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'overview';
        this.isSidebarOpen = true;
        this.notifications = [];
        this.aiChatHistory = [];
        this.antiCheat = {
            lastTaskComplete: 0,
            taskCooldown: 30000, // 30 секунд между заданиями
            maxPointsPerDay: 1000,
            dailyPoints: {}
        };
        
        this.init();
    }
    
    init() {
        this.loadUserData();
        this.initUI();
        this.initEventListeners();
        this.loadDashboardData();
        this.initCharts();
        this.initVoiceAssistant();
        this.startAutoUpdates();
        
        console.log('🚀 Панель управления инициализирована');
    }
    
    loadUserData() {
        const userData = localStorage.getItem('current_user');
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }
        
        this.currentUser = JSON.parse(userData);
        
        // Загружаем дополнительные данные из базы
        const db = leoDB.getAll();
        if (db) {
            const dbUser = db.users.find(u => u.id === this.currentUser.id);
            if (dbUser) {
                // Обновляем данные из базы
                Object.assign(this.currentUser, {
                    points: dbUser.points || 0,
                    level: dbUser.level || 1,
                    experience: dbUser.experience || 0,
                    tasks_completed: dbUser.tasks_completed || [],
                    achievements: dbUser.achievements || [],
                    settings: dbUser.settings || {}
                });
                
                // Сохраняем обновленные данные
                localStorage.setItem('current_user', JSON.stringify(this.currentUser));
            }
        }
        
        this.updateUserUI();
    }
    
    updateUserUI() {
        // Аватар и имя
        document.getElementById('userAvatar').textContent = 
            this.currentUser.avatar || this.generateAvatar(this.currentUser.name);
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userRole').textContent = 
            this.currentUser.role === 'admin' ? 'Администратор' : 'Ученик 7Б';
        
        // Очки и уровень
        document.getElementById('statPoints').textContent = this.currentUser.points || 0;
        document.getElementById('statLevel').textContent = this.currentUser.level || 1;
        document.getElementById('headerPoints').textContent = this.currentUser.points || 0;
        document.getElementById('headerLevel').textContent = this.currentUser.level || 1;
        
        // Приветствие
        const hour = new Date().getHours();
        let greeting = 'Доброй ночи';
        if (hour >= 5 && hour < 12) greeting = 'Доброе утро';
        else if (hour >= 12 && hour < 18) greeting = 'Добрый день';
        else if (hour >= 18 && hour < 23) greeting = 'Добрый вечер';
        
        const firstName = this.currentUser.name.split(' ')[0];
        document.getElementById('greetingText').textContent = `${greeting}, ${firstName}!`;
    }
    
    generateAvatar(name) {
        const names = name.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    initUI() {
        // Обновление времени
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000);
        
        // Инициализация боковой панели
        this.initSidebar();
        
        // Загрузка уведомлений
        this.loadNotifications();
    }
    
    updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('currentDateTime').textContent = 
            now.toLocaleDateString('ru-RU', options);
    }
    
    initSidebar() {
        const toggleBtn = document.getElementById('sidebarToggle');
        const mobileToggle = document.getElementById('mobileMenuToggle');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.isSidebarOpen = !this.isSidebarOpen;
                document.querySelector('.dashboard-sidebar').classList.toggle('collapsed');
                toggleBtn.querySelector('i').classList.toggle('fa-chevron-left');
                toggleBtn.querySelector('i').classList.toggle('fa-chevron-right');
            });
        }
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                document.querySelector('.dashboard-sidebar').classList.toggle('mobile-open');
            });
        }
        
        // Закрытие сайдбара при клике вне его на мобильных
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 768) {
                const sidebar = document.querySelector('.dashboard-sidebar');
                const isClickInside = sidebar.contains(e.target) || 
                                     e.target.closest('.mobile-menu-toggle');
                if (!isClickInside && sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });
    }
    
    initEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-item, .mobile-nav-item, .view-all').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });
        
        // Кнопка выхода
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            localStorage.removeItem('current_user');
            window.location.href = 'index.html';
        });
        
        // Быстрые действия
        document.getElementById('quickTask')?.addEventListener('click', () => {
            this.showQuickTask();
        });
        
        document.getElementById('voiceAssistant')?.addEventListener('click', () => {
            this.toggleVoiceAssistant();
        });
        
        // Уведомления
        document.getElementById('notificationsBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('notificationsPopup').classList.toggle('show');
        });
        
        document.getElementById('clearNotifications')?.addEventListener('click', () => {
            this.clearNotifications();
        });
        
        // Закрытие попапа уведомлений при клике вне
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notifications-dropdown')) {
                document.getElementById('notificationsPopup').classList.remove('show');
            }
        });
        
        // Чат с Лео
        this.initChat();
        
        // Игры
        this.initGames();
        
        // Задания
        this.initTasks();
        
        // Адаптивность
        this.initResponsive();
    }
    
    initResponsive() {
        // Обработка изменения размера окна
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // Инициализация для текущего размера
        this.handleResize();
    }
    
    handleResize() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            document.querySelector('.dashboard-sidebar').classList.add('collapsed');
            document.querySelector('.mobile-nav').style.display = 'flex';
        } else {
            document.querySelector('.dashboard-sidebar').classList.remove('collapsed');
            document.querySelector('.mobile-nav').style.display = 'none';
        }
        
        // Обновление графиков
        if (window.progressChart) {
            window.progressChart.resize();
        }
    }
    
    loadDashboardData() {
        // Загрузка данных для главной страницы
        this.loadActiveTasks();
        this.loadTodaySchedule();
        this.loadUserRank();
        this.loadAchievements();
        this.loadRating();
        
        // Загрузка статистики
        this.updateStats();
    }
    
    loadActiveTasks() {
        const db = leoDB.getAll();
        if (!db || !db.classes || !db.classes['7B']) return;
        
        const tasks = db.classes['7B'].tasks || [];
        const userTasks = tasks.filter(task => {
            return !this.currentUser.tasks_completed?.includes(task.id);
        });
        
        // Обновление счетчика
        document.getElementById('tasksCount').textContent = userTasks.length;
        document.getElementById('activeTasksCount').textContent = userTasks.length;
        
        // Отображение ближайших дедлайнов
        const deadlinesList = document.getElementById('deadlinesList');
        if (deadlinesList) {
            deadlinesList.innerHTML = '';
            
            if (userTasks.length === 0) {
                deadlinesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>Все задания выполнены!</p>
                    </div>
                `;
                return;
            }
            
            // Сортируем по дате
            const sortedTasks = userTasks.sort((a, b) => {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }).slice(0, 3);
            
            sortedTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'deadline-item';
                
                const dueDate = new Date(task.dueDate);
                const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                let deadlineText = '';
                
                if (daysLeft < 0) {
                    deadlineText = '<span class="deadline-overdue">Просрочено</span>';
                } else if (daysLeft === 0) {
                    deadlineText = '<span class="deadline-today">Сегодня</span>';
                } else if (daysLeft === 1) {
                    deadlineText = '<span class="deadline-tomorrow">Завтра</span>';
                } else {
                    deadlineText = `<span>Через ${daysLeft} дней</span>`;
                }
                
                taskElement.innerHTML = `
                    <div class="deadline-subject ${task.priority}">${task.subject}</div>
                    <div class="deadline-title">${task.title}</div>
                    <div class="deadline-info">
                        ${deadlineText}
                        <button class="btn-small complete-deadline" data-task-id="${task.id}">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                `;
                
                deadlinesList.appendChild(taskElement);
            });
        }
    }
    
    loadTodaySchedule() {
        const db = leoDB.getAll();
        if (!db || !db.classes || !db.classes['7B']) return;
        
        const schedule = db.classes['7B'].schedule || [];
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1; // Воскресенье = 6, Понедельник = 0
        const todaySchedule = schedule[dayIndex] || { lessons: [] };
        
        document.getElementById('todayLessonsCount').textContent = 
            `${todaySchedule.lessons.length} уроков`;
        
        const todayLessons = document.getElementById('todayLessons');
        if (todayLessons) {
            todayLessons.innerHTML = '';
            
            if (todaySchedule.lessons.length === 0) {
                todayLessons.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <p>Сегодня уроков нет</p>
                    </div>
                `;
                return;
            }
            
            todaySchedule.lessons.forEach((lesson, index) => {
                const lessonElement = document.createElement('div');
                lessonElement.className = 'lesson-item';
                
                // Парсим информацию об уроке
                const parts = lesson.split(' ');
                const time = parts[0] || `${8 + index}:00`;
                const subject = lesson.includes('(') 
                    ? lesson.substring(0, lesson.indexOf('(')).trim()
                    : lesson;
                const room = lesson.match(/\((\d+)\)/)?.[1] || '???';
                
                lessonElement.innerHTML = `
                    <div class="lesson-time">${time}</div>
                    <div class="lesson-details">
                        <div class="lesson-subject">${subject}</div>
                        <div class="lesson-room">Кабинет ${room}</div>
                    </div>
                    <div class="lesson-status ${index < 2 ? 'current' : 'upcoming'}">
                        ${index < 2 ? 'Сейчас' : 'Будет'}
                    </div>
                `;
                
                todayLessons.appendChild(lessonElement);
            });
        }
    }
    
    loadUserRank() {
        const db = leoDB.getAll();
        if (!db || !db.classes || !db.classes['7B']) return;
        
        const students = db.classes['7B'].students || [];
        const sortedStudents = [...students].sort((a, b) => b.points - a.points);
        const userIndex = sortedStudents.findIndex(s => s.id === this.currentUser.id);
        const userRank = userIndex !== -1 ? userIndex + 1 : '-';
        
        document.getElementById('statRank').textContent = userRank;
        document.getElementById('userCurrentRank').textContent = userRank;
        document.getElementById('welcomeRank').textContent = userRank;
        
        // Обновление топ-3
        this.updateTopStudents(sortedStudents);
    }
    
    updateTopStudents(students) {
        const top3 = students.slice(0, 3);
        
        if (top3[0]) {
            document.getElementById('top1Name').textContent = top3[0].name;
            document.getElementById('top1Avatar').textContent = top3[0].avatar || '?';
            document.getElementById('top1Points').textContent = `${top3[0].points} очков`;
        }
        
        if (top3[1]) {
            document.getElementById('top2Name').textContent = top3[1].name;
            document.getElementById('top2Avatar').textContent = top3[1].avatar || '?';
            document.getElementById('top2Points').textContent = `${top3[1].points} очков`;
        }
        
        if (top3[2]) {
            document.getElementById('top3Name').textContent = top3[2].name;
            document.getElementById('top3Avatar').textContent = top3[2].avatar || '?';
            document.getElementById('top3Points').textContent = `${top3[2].points} очков`;
        }
        
        // Обновление полного рейтинга
        this.updateFullRating(students);
    }
    
    updateFullRating(students) {
        const ratingBody = document.getElementById('ratingTableBody');
        if (!ratingBody) return;
        
        ratingBody.innerHTML = '';
        
        students.forEach((student, index) => {
            const row = document.createElement('div');
            row.className = `rating-table-row ${student.id === this.currentUser.id ? 'current-user' : ''}`;
            
            // Рассчитываем точность (процент выполненных заданий)
            const db = leoDB.getAll();
            const user = db?.users?.find(u => u.id === student.id);
            const totalTasks = db?.classes?.['7B']?.tasks?.length || 1;
            const completedTasks = user?.tasks_completed?.length || 0;
            const accuracy = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            row.innerHTML = `
                <div class="table-cell rank-cell">
                    <span class="rank-number">${index + 1}</span>
                    ${index < 3 ? ['🥇', '🥈', '🥉'][index] : ''}
                </div>
                <div class="table-cell student-cell">
                    <div class="student-avatar">${student.avatar || '?'}</div>
                    <div class="student-info">
                        <div class="student-name">${student.name}</div>
                        <div class="student-class">7Б</div>
                    </div>
                </div>
                <div class="table-cell points-cell">
                    <i class="fas fa-star"></i>
                    ${student.points || 0}
                </div>
                <div class="table-cell level-cell">
                    Уровень ${student.level || 1}
                </div>
                <div class="table-cell tasks-cell">
                    ${completedTasks}/${totalTasks}
                </div>
                <div class="table-cell accuracy-cell">
                    <div class="accuracy-bar">
                        <div class="accuracy-fill" style="width: ${accuracy}%"></div>
                    </div>
                    <span>${accuracy}%</span>
                </div>
            `;
            
            ratingBody.appendChild(row);
        });
    }
    
    loadAchievements() {
        const achievements = this.currentUser.achievements || [];
        document.getElementById('achievementsCount').textContent = achievements.length;
        
        const preview = document.getElementById('achievementsPreview');
        if (preview) {
            preview.innerHTML = '';
            
            if (achievements.length === 0) {
                preview.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-award"></i>
                        <p>Достижений пока нет</p>
                    </div>
                `;
                return;
            }
            
            // Показываем последние 3 достижения
            achievements.slice(-3).reverse().forEach(achievement => {
                const achievementEl = document.createElement('div');
                achievementEl.className = 'achievement-preview';
                achievementEl.innerHTML = `
                    <div class="achievement-icon">🏆</div>
                    <div class="achievement-info">
                        <div class="achievement-title">${achievement.title}</div>
                        <div class="achievement-date">${new Date(achievement.date).toLocaleDateString('ru-RU')}</div>
                    </div>
                `;
                preview.appendChild(achievementEl);
            });
        }
    }
    
    loadRating() {
        const db = leoDB.getAll();
        if (!db || !db.classes || !db.classes['7B']) return;
        
        const students = db.classes['7B'].students || [];
        this.updateTopStudents(students);
    }
    
    updateStats() {
        const db = leoDB.getAll();
        if (!db) return;
        
        // Рассчитываем статистику
        const totalTasks = db.classes?.['7B']?.tasks?.length || 0;
        const completedTasks = this.currentUser.tasks_completed?.length || 0;
        const accuracy = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Обновляем UI
        document.getElementById('completedCount').textContent = completedTasks;
        document.getElementById('accuracyRate').textContent = `${accuracy}%`;
        document.getElementById('progressPercent').textContent = `${progress}%`;
        
        // Рассчитываем средний балл (упрощенно)
        const avgScore = completedTasks > 0 ? Math.min(5, 3 + (completedTasks / 10)) : 0;
        document.getElementById('avgScore').textContent = avgScore.toFixed(1);
    }
    
    initCharts() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;
        
        // Удаляем старый график если есть
        if (window.progressChart) {
            window.progressChart.destroy();
        }
        
        // Данные для графика
        const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const data = labels.map(() => Math.floor(Math.random() * 5) + 1);
        
        window.progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Выполнено заданий',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
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
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#f1f5f9',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Заданий: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
    
    initChat() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendMessage');
        const quickChatInput = document.getElementById('quickChatInput');
        const quickChatSend = document.getElementById('quickChatSend');
        
        // Основной чат
        if (chatInput && sendBtn) {
            sendBtn.addEventListener('click', () => this.sendChatMessage());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }
        
        // Быстрый чат
        if (quickChatInput && quickChatSend) {
            quickChatSend.addEventListener('click', () => this.sendQuickChatMessage());
            quickChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendQuickChatMessage();
                }
            });
        }
        
        // Быстрые вопросы
        document.querySelectorAll('.quick-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                this.sendAIQuestion(question);
            });
        });
        
        // Очистка чата
        document.getElementById('clearChat')?.addEventListener('click', () => {
            this.clearChat();
        });
    }
    
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addChatMessage(message, 'user');
        input.value = '';
        
        // Обработка сообщения AI
        setTimeout(() => {
            const response = this.getAIResponse(message);
            this.addChatMessage(response, 'ai');
        }, 1000);
    }
    
    sendQuickChatMessage() {
        const input = document.getElementById('quickChatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const quickChat = document.getElementById('quickChatMessages');
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content">
                <div class="message-text">${message}</div>
                <div class="message-time">Только что</div>
            </div>
        `;
        quickChat.appendChild(userMsg);
        
        input.value = '';
        
        setTimeout(() => {
            const response = this.getAIResponse(message);
            const aiMsg = document.createElement('div');
            aiMsg.className = 'chat-message ai';
            aiMsg.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text">${response}</div>
                    <div class="message-time">Только что</div>
                </div>
            `;
            quickChat.appendChild(aiMsg);
            quickChat.scrollTop = quickChat.scrollHeight;
        }, 800);
    }
    
    sendAIQuestion(question) {
        const input = document.getElementById('chatInput');
        input.value = question;
        this.sendChatMessage();
    }
    
    addChatMessage(text, sender) {
        const container = document.getElementById('chatMessagesContainer');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message-full ${sender}`;
        
        const time = new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
            <div class="message-content-full">
                <div class="message-text-full">${text}</div>
                <div class="message-time-full">${time}</div>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        
        // Сохраняем в историю
        this.aiChatHistory.push({
            sender,
            text,
            time: new Date().toISOString()
        });
    }
    
    getAIResponse(question) {
        const lowerQ = question.toLowerCase();
        
        // База знаний для 7 класса
        const knowledgeBase = {
            // Математика 7 класс
            'математика': {
                'теорема пифагора': 'Теорема Пифагора: в прямоугольном треугольнике квадрат гипотенузы равен сумме квадратов катетов. a² + b² = c²',
                'линейные уравнения': 'Линейное уравнение: уравнение вида ax + b = 0. Решение: x = -b/a. Пример: 2x + 4 = 0 → x = -2',
                'алгебраические выражения': 'Алгебраическое выражение - комбинация чисел, переменных и арифметических операций',
                'системы уравнений': 'Система линейных уравнений решается методами подстановки или сложения',
                'проценты': 'Чтобы найти процент от числа, умножь число на процент и раздели на 100',
                'графики функций': 'Линейная функция: y = kx + b, график - прямая линия'
            },
            
            // Физика 7 класс
            'физика': {
                'сила трения': 'Сила трения - сила, возникающая при движении одного тела по поверхности другого',
                'законы ньютона': '1 закон: тело сохраняет состояние покоя или равномерного движения; 2 закон: F = ma; 3 закон: силы действия и противодействия',
                'давление': 'Давление = Сила / Площадь. Единица измерения - Паскаль (Па)',
                'плотность': 'Плотность = Масса / Объем. Единица - кг/м³',
                'механическая работа': 'Работа = Сила × Путь. A = F × S',
                'мощность': 'Мощность = Работа / Время. P = A / t'
            },
            
            // Русский язык 7 класс
            'русский': {
                'причастие': 'Причастие - особая форма глагола, обозначающая признак по действию',
                'деепричастие': 'Деепричастие - неизменяемая форма глагола, обозначающая добавочное действие',
                'наречие': 'Наречие - часть речи, обозначающая признак действия, признак признака или признак предмета',
                'союз': 'Союз - служебная часть речи, связывающая однородные члены и части сложного предложения',
                'предлог': 'Предлог - служебная часть речи, выражающая зависимость существительных от других слов'
            },
            
            // Общие ответы
            'общее': {
                'привет': 'Привет! Я Лео, твой AI помощник по учебе в 7 классе. Чем могу помочь?',
                'помощь': 'Я могу объяснить темы по математике, физике, русскому языку и другим предметам 7 класса',
                'задания': 'Задания можно посмотреть в разделе "Задания". Там же их можно выполнять',
                'рейтинг': 'Твой рейтинг отображается в разделе "Рейтинг класса"',
                'игры': 'Учебные игры помогают закрепить материал. Играть можно в разделе "Учебные игры"'
            }
        };
        
        // Поиск ответа
        let response = 'Я могу помочь с вопросами по математике, физике или русскому языку 7 класса.';
        
        // Проверяем предметы
        if (lowerQ.includes('матем') || lowerQ.includes('алгебр') || lowerQ.includes('геометр')) {
            for (const [key, answer] of Object.entries(knowledgeBase['математика'])) {
                if (lowerQ.includes(key)) {
                    response = answer;
                    break;
                }
            }
            if (response === 'Я могу помочь...') {
                response = 'По математике 7 класса изучаем: алгебраические выражения, линейные уравнения, теорему Пифагора, проценты. Что именно тебя интересует?';
            }
        }
        else if (lowerQ.includes('физик')) {
            for (const [key, answer] of Object.entries(knowledgeBase['физика'])) {
                if (lowerQ.includes(key)) {
                    response = answer;
                    break;
                }
            }
            if (response === 'Я могу помочь...') {
                response = 'По физике 7 класса изучаем: механику, законы Ньютона, давление, плотность, силу трения. Задай конкретный вопрос!';
            }
        }
        else if (lowerQ.includes('русск') || lowerQ.includes('граммат')) {
            for (const [key, answer] of Object.entries(knowledgeBase['русский'])) {
                if (lowerQ.includes(key)) {
                    response = answer;
                    break;
                }
            }
            if (response === 'Я могу помочь...') {
                response = 'По русскому языку 7 класса изучаем: причастия, деепричастия, наречия, союзы, предлоги. Что тебе нужно объяснить?';
            }
        }
        else {
            for (const [key, answer] of Object.entries(knowledgeBase['общее'])) {
                if (lowerQ.includes(key)) {
                    response = answer;
                    break;
                }
            }
        }
        
        return response;
    }
    
    clearChat() {
        const container = document.getElementById('chatMessagesContainer');
        if (container) {
            container.innerHTML = '';
            this.aiChatHistory = [];
            this.addChatMessage('Привет! Я Лео, твой AI помощник по учебе в 7 классе. Чем могу помочь?', 'ai');
        }
    }
    
    initTasks() {
        // Загрузка заданий при открытии раздела
        document.querySelector('[data-section="tasks"]')?.addEventListener('click', () => {
            setTimeout(() => this.loadAllTasks(), 100);
        });
        
        // Фильтр заданий
        document.getElementById('tasksFilter')?.addEventListener('change', (e) => {
            this.filterTasks(e.target.value);
        });
        
        // Обновление заданий
        document.getElementById('refreshTasks')?.addEventListener('click', () => {
            this.loadAllTasks();
            this.showNotification('Задания обновлены', 'success');
        });
        
        // Обработка кликов по заданиям
        document.addEventListener('click', (e) => {
            if (e.target.closest('.complete-deadline') || e.target.closest('.complete-task')) {
                const taskId = e.target.closest('button').getAttribute('data-task-id');
                if (taskId) {
                    this.completeTask(parseInt(taskId));
                }
            }
            
            if (e.target.closest('.view-task')) {
                const taskId = e.target.closest('button').getAttribute('data-task-id');
                if (taskId) {
                    this.viewTaskDetails(parseInt(taskId));
                }
            }
        });
    }
    
    loadAllTasks() {
        const db = leoDB.getAll();
        if (!db || !db.classes || !db.classes['7B']) return;
        
        const allTasks = db.classes['7B'].tasks || [];
        const container = document.querySelector('.tasks-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (allTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state-large">
                    <i class="fas fa-tasks"></i>
                    <h3>Заданий пока нет</h3>
                    <p>Преподаватель скоро добавит новые задания</p>
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
        
        // Создаем карточки для каждого предмета
        Object.entries(tasksBySubject).forEach(([subject, tasks]) => {
            const subjectCard = document.createElement('div');
            subjectCard.className = 'subject-tasks-card glass-effect';
            
            let tasksHTML = '';
            tasks.forEach(task => {
                const isCompleted = this.currentUser.tasks_completed?.includes(task.id);
                const dueDate = new Date(task.dueDate);
                const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
                
                tasksHTML += `
                    <div class="task-item ${isCompleted ? 'completed' : ''}">
                        <div class="task-checkbox">
                            <input type="checkbox" ${isCompleted ? 'checked' : ''} data-task-id="${task.id}">
                        </div>
                        <div class="task-content">
                            <div class="task-title">${task.title}</div>
                            <div class="task-description">${task.description || 'Описание задания'}</div>
                            <div class="task-meta">
                                <span class="task-difficulty ${task.difficulty || 'medium'}">${task.difficulty === 'hard' ? 'Сложное' : task.difficulty === 'easy' ? 'Легкое' : 'Среднее'}</span>
                                <span class="task-deadline ${daysLeft < 0 ? 'overdue' : daysLeft <= 2 ? 'urgent' : ''}">
                                    ${daysLeft < 0 ? 'Просрочено' : daysLeft === 0 ? 'Сегодня' : daysLeft === 1 ? 'Завтра' : `Осталось ${daysLeft} дней`}
                                </span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="btn-small view-task" data-task-id="${task.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${!isCompleted ? `
                                <button class="btn-small btn-primary complete-task" data-task-id="${task.id}">
                                    <i class="fas fa-check"></i> Выполнить
                                </button>
                            ` : `
                                <span class="task-completed-badge">
                                    <i class="fas fa-check-circle"></i> Выполнено
                                </span>
                            `}
                        </div>
                    </div>
                `;
            });
            
            subjectCard.innerHTML = `
                <div class="subject-header">
                    <h3><i class="fas fa-book"></i> ${subject}</h3>
                    <span class="subject-task-count">${tasks.length} заданий</span>
                </div>
                <div class="tasks-list">
                    ${tasksHTML}
                </div>
            `;
            
            container.appendChild(subjectCard);
        });
    }
    
    filterTasks(filter) {
        const allTasks = document.querySelectorAll('.task-item');
        
        allTasks.forEach(task => {
            let show = true;
            const subject = task.closest('.subject-tasks-card')?.querySelector('h3')?.textContent || '';
            
            switch(filter) {
                case 'math':
                    show = subject.includes('Математика');
                    break;
                case 'physics':
                    show = subject.includes('Физика');
                    break;
                case 'russian':
                    show = subject.includes('Русский');
                    break;
                case 'history':
                    show = subject.includes('История');
                    break;
                case 'pending':
                    show = !task.classList.contains('completed');
                    break;
                case 'completed':
                    show = task.classList.contains('completed');
                    break;
                default:
                    show = true;
            }
            
            task.style.display = show ? 'flex' : 'none';
            
            // Скрываем пустые карточки предметов
            const subjectCard = task.closest('.subject-tasks-card');
            if (subjectCard) {
                const visibleTasks = subjectCard.querySelectorAll('.task-item[style*="display: flex"]').length;
                subjectCard.style.display = visibleTasks > 0 ? 'block' : 'none';
            }
        });
    }
    
    completeTask(taskId) {
        // Проверка античит
        if (!this.antiCheatCheck()) {
            this.showNotification('Подождите перед выполнением следующего задания', 'warning');
            return;
        }
        
        const db = leoDB.getAll();
        if (!db) return;
        
        const task = db.classes?.['7B']?.tasks?.find(t => t.id === taskId);
        const user = db.users.find(u => u.id === this.currentUser.id);
        
        if (!task || !user) {
            this.showNotification('Задание не найдено', 'error');
            return;
        }
        
        // Проверяем, не выполнено ли уже задание
        if (user.tasks_completed?.includes(taskId)) {
            this.showNotification('Задание уже выполнено', 'info');
            return;
        }
        
        // Выполняем задание
        const result = leoDB.completeTask(user.id, taskId);
        
        if (result.success) {
            // Обновляем данные пользователя
            const updatedUser = db.users.find(u => u.id === user.id);
            if (updatedUser) {
                this.currentUser = updatedUser;
                localStorage.setItem('current_user', JSON.stringify(updatedUser));
                
                // Обновляем UI
                this.updateUserUI();
                this.loadActiveTasks();
                this.loadUserRank();
                this.updateStats();
                
                // Показываем уведомление
                let message = `Задание выполнено! +${result.points} очков`;
                if (result.levelUp) {
                    message += ` 🎉 Новый уровень: ${updatedUser.level}`;
                }
                
                this.showNotification(message, 'success');
                
                // Обновляем список заданий
                this.loadAllTasks();
                
                // Записываем время выполнения для античитов
                this.antiCheat.lastTaskComplete = Date.now();
            }
        } else {
            this.showNotification('Ошибка при выполнении задания', 'error');
        }
    }
    
    antiCheatCheck() {
        const now = Date.now();
        const timeSinceLastTask = now - this.antiCheat.lastTaskComplete;
        
        // Проверка кулдауна
        if (timeSinceLastTask < this.antiCheat.taskCooldown) {
            return false;
        }
        
        // Проверка дневного лимита очков
        const today = new Date().toDateString();
        this.antiCheat.dailyPoints[today] = this.antiCheat.dailyPoints[today] || 0;
        
        if (this.antiCheat.dailyPoints[today] >= this.antiCheat.maxPointsPerDay) {
            this.showNotification('Дневной лимит очков достигнут', 'warning');
            return false;
        }
        
        return true;
    }
    
    viewTaskDetails(taskId) {
        const db = leoDB.getAll();
        if (!db) return;
        
        const task = db.classes?.['7B']?.tasks?.find(t => t.id === taskId);
        if (!task) return;
        
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTaskTitle');
        const modalContent = document.getElementById('modalTaskContent');
        
        if (!modal || !modalTitle || !modalContent) return;
        
        modalTitle.textContent = `${task.subject}: ${task.title}`;
        
        // Генерация контента задания в зависимости от предмета
        let taskContent = '';
        let solveButton = '';
        
        if (!this.currentUser.tasks_completed?.includes(taskId)) {
            solveButton = `
                <button class="btn-primary solve-task-btn" data-task-id="${taskId}">
                    <i class="fas fa-check"></i> Решить задание
                </button>
            `;
        }
        
        switch(task.subject) {
            case 'Математика':
                taskContent = this.generateMathTask(task);
                break;
            case 'Физика':
                taskContent = this.generatePhysicsTask(task);
                break;
            case 'Русский язык':
                taskContent = this.generateRussianTask(task);
                break;
            default:
                taskContent = `
                    <p>${task.description || 'Описание задания'}</p>
                    <div class="task-info">
                        <p><strong>Сложность:</strong> ${task.difficulty || 'Средняя'}</p>
                        <p><strong>Срок сдачи:</strong> ${new Date(task.dueDate).toLocaleDateString('ru-RU')}</p>
                        <p><strong>Награда:</strong> 50 очков опыта</p>
                    </div>
                `;
        }
        
        modalContent.innerHTML = `
            <div class="task-modal-content">
                ${taskContent}
                <div class="task-modal-actions">
                    ${solveButton}
                    <button class="btn-secondary close-modal-btn" id="closeTaskModal">
                        Закрыть
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        // Обработчики для модального окна
        document.getElementById('closeTaskModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Обработчик кнопки решения
        const solveBtn = modalContent.querySelector('.solve-task-btn');
        if (solveBtn) {
            solveBtn.addEventListener('click', () => {
                this.completeTask(taskId);
                modal.style.display = 'none';
            });
        }
    }
    
    generateMathTask(task) {
        // Генерация математического задания для 7 класса
        const problems = [
            {
                question: "Решите уравнение: 3x + 7 = 16",
                answer: "x = 3",
                solution: "3x = 16 - 7 = 9; x = 9 ÷ 3 = 3"
            },
            {
                question: "Найдите 15% от числа 200",
                answer: "30",
                solution: "200 × 15 ÷ 100 = 30"
            },
            {
                question: "Вычислите площадь прямоугольника со сторонами 8 см и 12 см",
                answer: "96 см²",
                solution: "S = a × b = 8 × 12 = 96 см²"
            },
            {
                question: "Решите систему уравнений: { x + y = 10; x - y = 2 }",
                answer: "x = 6, y = 4",
                solution: "Сложим уравнения: 2x = 12 ⇒ x = 6; Подставим: 6 + y = 10 ⇒ y = 4"
            },
            {
                question: "Упростите выражение: 2a + 3b - a + 4b",
                answer: "a + 7b",
                solution: "2a - a = a; 3b + 4b = 7b"
            }
        ];
        
        const problem = problems[Math.floor(Math.random() * problems.length)];
        
        return `
            <div class="math-task">
                <h4>Задание по математике</h4>
                <p>${problem.question}</p>
                <div class="task-hint">
                    <button class="hint-btn">Показать подсказку</button>
                    <div class="hint-content" style="display: none;">
                        <p><strong>Подсказка:</strong> ${problem.solution}</p>
                    </div>
                </div>
                <div class="answer-input">
                    <label>Введите ответ:</label>
                    <input type="text" class="math-answer" placeholder="Ваш ответ...">
                </div>
                <div class="task-info">
                    <p><strong>Тема:</strong> ${task.title}</p>
                    <p><strong>Награда:</strong> 50 очков + 100 опыта</p>
                </div>
            </div>
        `;
    }
    
    generatePhysicsTask(task) {
        const problems = [
            {
                question: "Какова масса тела, если его вес составляет 50 Н? (g = 10 Н/кг)",
                answer: "5 кг",
                solution: "m = P ÷ g = 50 ÷ 10 = 5 кг"
            },
            {
                question: "Рассчитайте давление, производимое силой 100 Н на площадь 2 м²",
                answer: "50 Па",
                solution: "p = F ÷ S = 100 ÷ 2 = 50 Па"
            },
            {
                question: "Какая работа совершается силой 20 Н при перемещении на 5 м?",
                answer: "100 Дж",
                solution: "A = F × S = 20 × 5 = 100 Дж"
            },
            {
                question: "Определите мощность, если работа 600 Дж совершена за 2 с",
                answer: "300 Вт",
                solution: "P = A ÷ t = 600 ÷ 2 = 300 Вт"
            }
        ];
        
        const problem = problems[Math.floor(Math.random() * problems.length)];
        
        return `
            <div class="physics-task">
                <h4>Задание по физике</h4>
                <p>${problem.question}</p>
                <div class="task-hint">
                    <button class="hint-btn">Показать подсказку</button>
                    <div class="hint-content" style="display: none;">
                        <p><strong>Формула:</strong> ${problem.solution.split(':')[0]}</p>
                    </div>
                </div>
                <div class="answer-input">
                    <label>Введите ответ с единицами измерения:</label>
                    <input type="text" class="physics-answer" placeholder="Например:五百帕">
                </div>
                <div class="task-info">
                    <p><strong>Тема:</strong> ${task.title}</p>
                    <p><strong>Награда:</strong> 70 очков + 150 опыта</p>
                </div>
            </div>
        `;
    }
    
    generateRussianTask(task) {
        const problems = [
            {
                question: "Вставьте пропущенные буквы: пр...красный, пр...зидент, пр...бывать в городе",
                answer: "е, е, пре",
                solution: "прекрасный, президент, пребывать (приставка пре- со значением 'очень')"
            },
            {
                question: "Образуйте деепричастия от глаголов: бежать, писать, говорить",
                answer: "бежав, писав, говоря",
                solution: "бежав (бежать), писав (писать), говоря (говорить)"
            },
            {
                question: "Найдите и исправьте ошибку: 'Он, смотря в окно, мечтал о путешествиях'",
                answer: "смотря → глядя",
                solution: "Правильно: 'Он, глядя в окно, мечтал о путешествиях'"
            }
        ];
        
        const problem = problems[Math.floor(Math.random() * problems.length)];
        
        return `
            <div class="russian-task">
                <h4>Задание по русскому языку</h4>
                <p>${problem.question}</p>
                <div class="task-hint">
                    <button class="hint-btn">Показать правило</button>
                    <div class="hint-content" style="display: none;">
                        <p><strong>Правило:</strong> ${problem.solution}</p>
                    </div>
                </div>
                <div class="answer-input">
                    <label>Введите правильный ответ:</label>
                    <input type="text" class="russian-answer" placeholder="Ваш ответ...">
                </div>
                <div class="task-info">
                    <p><strong>Тема:</strong> ${task.title}</p>
                    <p><strong>Награда:</strong> 40 очков + 80 опыта</p>
                </div>
            </div>
        `;
    }
    
    initGames() {
        // Обработчики для игр
        document.querySelectorAll('.play-game, .play-full-game').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameType = e.target.closest('[data-game]').getAttribute('data-game');
                this.startGame(gameType);
            });
        });
        
        // Информация об играх
        document.querySelectorAll('.game-info').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameCard = e.target.closest('.game-full-card');
                const gameType = gameCard.getAttribute('data-game');
                this.showGameInfo(gameType);
            });
        });
    }
    
    startGame(gameType) {
        // Проверка античит для игр
        if (!this.antiCheatCheck()) {
            this.showNotification('Подождите перед началом новой игры', 'warning');
            return;
        }
        
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalGameTitle');
        const modalContent = document.getElementById('modalGameContent');
        
        if (!modal || !modalTitle || !modalContent) return;
        
        let gameHTML = '';
        let gameTitle = '';
        
        switch(gameType) {
            case 'math':
            case 'math-quiz':
                gameTitle = 'Математический квиз';
                gameHTML = this.generateMathGame();
                break;
            case 'physics':
            case 'physics-lab':
                gameTitle = 'Лаборатория физики';
                gameHTML = this.generatePhysicsGame();
                break;
            case 'russian':
            case 'russian-challenge':
                gameTitle = 'Грамматический вызов';
                gameHTML = this.generateRussianGame();
                break;
        }
        
        modalTitle.textContent = gameTitle;
        modalContent.innerHTML = gameHTML;
        
        modal.style.display = 'flex';
        
        // Обработчики для модального окна игры
        document.getElementById('closeGameModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Инициализация игры
        setTimeout(() => this.initGameLogic(gameType), 100);
    }
    
    generateMathGame() {
        return `
            <div class="math-game">
                <div class="game-header">
                    <div class="game-stats">
                        <div class="game-stat">
                            <span>Вопрос:</span>
                            <span id="currentQuestion">1/10</span>
                        </div>
                        <div class="game-stat">
                            <span>Очки:</span>
                            <span id="gameScore">0</span>
                        </div>
                        <div class="game-stat">
                            <span>Время:</span>
                            <span id="gameTime">60</span>с
                        </div>
                    </div>
                </div>
                
                <div class="game-question" id="mathQuestion">
                    Загрузка вопроса...
                </div>
                
                <div class="game-answers" id="mathAnswers">
                    <!-- Варианты ответов загружаются динамически -->
                </div>
                
                <div class="game-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="gameProgress" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="game-actions">
                    <button class="btn-secondary" id="skipQuestion">Пропустить</button>
                    <button class="btn-primary" id="submitAnswer" disabled>Ответить</button>
                </div>
            </div>
        `;
    }
    
    initGameLogic(gameType) {
        // Инициализация таймера
        let timeLeft = 60;
        const timerElement = document.getElementById('gameTime');
        const timerInterval = setInterval(() => {
            timeLeft--;
            if (timerElement) timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                this.endGame(gameType, 0);
            }
        }, 1000);
        
        // Генерация вопросов для математической игры
        if (gameType === 'math' || gameType === 'math-quiz') {
            this.generateMathQuestions();
        }
        
        // Сохраняем таймер для очистки
        window.gameTimer = timerInterval;
    }
    
    generateMathQuestions() {
        const questions = [
            {
                question: "Решите: 2x + 5 = 17",
                answers: ["x = 6", "x = 7", "x = 8", "x = 9"],
                correct: 0
            },
            {
                question: "15% от 300 равно:",
                answers: ["30", "45", "50", "60"],
                correct: 1
            },
            {
                question: "Площадь квадрата со стороной 7 см:",
                answers: ["14 см²", "28 см²", "49 см²", "56 см²"],
                correct: 2
            },
            {
                question: "Упростите: 3a + 2b - a + 4b",
                answers: ["2a + 6b", "4a + 6b", "2a + 2b", "4a + 2b"],
                correct: 0
            },
            {
                question: "Сумма углов треугольника равна:",
                answers: ["90°", "180°", "270°", "360°"],
                correct: 1
            }
        ];
        
        // Отображаем первый вопрос
        this.displayMathQuestion(questions[0], 1, questions.length);
    }
    
    displayMathQuestion(question, current, total) {
        const questionElement = document.getElementById('mathQuestion');
        const answersElement = document.getElementById('mathAnswers');
        const currentQuestionElement = document.getElementById('currentQuestion');
        const progressElement = document.getElementById('gameProgress');
        
        if (!questionElement || !answersElement) return;
        
        questionElement.textContent = question.question;
        currentQuestionElement.textContent = `${current}/${total}`;
        progressElement.style.width = `${(current / total) * 100}%`;
        
        answersElement.innerHTML = '';
        question.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = answer;
            button.dataset.index = index;
            button.addEventListener('click', () => {
                this.selectAnswer(index, question.correct);
            });
            answersElement.appendChild(button);
        });
    }
    
    selectAnswer(selected, correct) {
        const buttons = document.querySelectorAll('.answer-btn');
        const submitBtn = document.getElementById('submitAnswer');
        
        buttons.forEach(btn => btn.classList.remove('selected'));
        buttons[selected].classList.add('selected');
        
        submitBtn.disabled = false;
        submitBtn.onclick = () => {
            this.checkAnswer(selected === correct);
        };
    }
    
    checkAnswer(isCorrect) {
        if (isCorrect) {
            this.showNotification('Правильно! +10 очков', 'success');
            // Обновляем счет
            const scoreElement = document.getElementById('gameScore');
            if (scoreElement) {
                const currentScore = parseInt(scoreElement.textContent) || 0;
                scoreElement.textContent = currentScore + 10;
            }
        } else {
            this.showNotification('Неправильно! Попробуйте следующий вопрос', 'error');
        }
        
        // Переходим к следующему вопросу
        // (реализация продолжения игры)
    }
    
    endGame(gameType, score) {
        clearInterval(window.gameTimer);
        
        // Начисление очков
        if (score > 0) {
            const db = leoDB.getAll();
            if (db) {
                const user = db.users.find(u => u.id === this.currentUser.id);
                if (user) {
                    user.points += score;
                    leoDB.save(db);
                    
                    // Обновляем UI
                    this.currentUser.points += score;
                    this.updateUserUI();
                    this.loadUserRank();
                    
                    this.showNotification(`Игра завершена! Вы заработали ${score} очков`, 'success');
                }
            }
        }
        
        // Закрываем модальное окно
        document.getElementById('gameModal').style.display = 'none';
    }
    
    showGameInfo(gameType) {
        let info = '';
        
        switch(gameType) {
            case 'math-quiz':
                info = `
                    <h4>Математический квиз</h4>
                    <p>Решайте задачи по математике 7 класса и получайте очки.</p>
                    <ul>
                        <li>10 вопросов разной сложности</li>
                        <li>60 секунд на прохождение</li>
                        <li>+10 очков за правильный ответ</li>
                        <li>Максимум 100 очков за игру</li>
                    </ul>
                    <p><strong>Темы:</strong> алгебра, геометрия, уравнения, проценты</p>
                `;
                break;
            case 'physics-lab':
                info = `
                    <h4>Лаборатория физики</h4>
                    <p>Проводите виртуальные эксперименты и отвечайте на вопросы.</p>
                    <ul>
                        <li>Эксперименты по механике</li>
                        <li>Расчеты по формулам</li>
                        <li>+15 очков за правильный ответ</li>
                        <li>Максимум 150 очков за игру</li>
                    </ul>
                    <p><strong>Темы:</strong> законы Ньютона, давление, работа, мощность</p>
                `;
                break;
        }
        
        this.showNotification(info, 'info', 10000);
    }
    
    showQuickTask() {
        // Показывает случайное быстрое задание
        const tasks = [
            "Реши уравнение: 2(x + 3) = 16",
            "Найди 20% от 250",
            "Вычисли площадь круга радиусом 5 см",
            "Переведи 72 км/ч в м/с",
            "Исправь ошибку: 'Он бежав быстро'"
        ];
        
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        
        this.showNotification(`Быстрое задание: ${randomTask}`, 'info', 8000);
    }
    
    initVoiceAssistant() {
        const voiceBtn = document.getElementById('voiceToggle');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.toggleVoiceAssistant();
            });
        }
    }
    
    toggleVoiceAssistant() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.showNotification('Голосовой помощник активирован', 'success');
            // Здесь будет логика голосового помощника
        } else {
            this.showNotification('Голосовой ввод не поддерживается вашим браузером', 'warning');
        }
    }
    
    loadNotifications() {
        // Загрузка уведомлений из базы данных
        const db = leoDB.getAll();
        if (!db) return;
        
        const userNotifications = db.system?.notifications || [];
        this.notifications = userNotifications.filter(n => 
            !n.read || n.userId === this.currentUser.id || !n.userId
        );
        
        this.updateNotificationsUI();
    }
    
    updateNotificationsUI() {
        const badge = document.getElementById('notificationsBadge');
        const list = document.getElementById('notificationsList');
        
        if (badge) {
            badge.textContent = this.notifications.length;
            badge.style.display = this.notifications.length > 0 ? 'flex' : 'none';
        }
        
        if (list) {
            list.innerHTML = '';
            
            if (this.notifications.length === 0) {
                list.innerHTML = `
                    <div class="notification-empty">
                        <i class="fas fa-bell-slash"></i>
                        <p>Уведомлений нет</p>
                    </div>
                `;
                return;
            }
            
            this.notifications.slice(0, 5).forEach(notification => {
                const item = document.createElement('div');
                item.className = `notification-item ${notification.type || 'info'}`;
                item.innerHTML = `
                    <div class="notification-icon">
                        <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${new Date(notification.timestamp).toLocaleTimeString('ru-RU')}</div>
                    </div>
                `;
                list.appendChild(item);
            });
        }
    }
    
    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
    
    clearNotifications() {
        this.notifications = [];
        this.updateNotificationsUI();
        this.showNotification('Все уведомления очищены', 'success');
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        // Создание уведомления
        const notification = document.createElement('div');
        notification.className = `floating-notification notification-${type}`;
        
        const icon = type === 'success' ? 'check-circle' :
                    type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Стили
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            max-width: 400px;
        `;
        
        // Закрытие
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        document.body.appendChild(notification);
        
        // Автозакрытие
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
        
        return notification;
    }
    
    getNotificationColor(type) {
        switch(type) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#3b82f6';
        }
    }
    
    showSection(sectionId) {
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Убираем активный класс у всех пунктов навигации
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Показываем нужную секцию
        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Активируем соответствующий пункт навигации
            document.querySelector(`.nav-item[data-section="${sectionId}"]`)?.classList.add('active');
            document.querySelector(`.mobile-nav-item[data-section="${sectionId}"]`)?.classList.add('active');
            
            // Загружаем данные для секции
            this.loadSectionData(sectionId);
            
            // На мобильных закрываем сайдбар после выбора
            if (window.innerWidth < 768) {
                document.querySelector('.dashboard-sidebar').classList.remove('mobile-open');
            }
        }
    }
    
    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'tasks':
                this.loadAllTasks();
                break;
            case 'rating':
                this.loadRating();
                break;
            case 'games':
                this.updateGamesStats();
                break;
            case 'ai-chat':
                // Фокус на поле ввода чата
                setTimeout(() => {
                    document.getElementById('chatInput')?.focus();
                }, 300);
                break;
        }
    }
    
    updateGamesStats() {
        // Обновление статистики игр
        const db = leoDB.getAll();
        if (!db) return;
        
        const gameStats = db.system?.gameStats || {
            math: { plays: 0, record: 0 },
            physics: { plays: 0, record: 0 },
            russian: { plays: 0, record: 0 }
        };
        
        document.getElementById('mathPlayers').textContent = gameStats.math.plays || 0;
        document.getElementById('mathRecord').textContent = gameStats.math.record || 0;
        document.getElementById('physicsPlayers').textContent = gameStats.physics.plays || 0;
        document.getElementById('physicsRecord').textContent = gameStats.physics.record || 0;
        document.getElementById('russianPlayers').textContent = gameStats.russian.plays || 0;
        document.getElementById('russianRecord').textContent = gameStats.russian.record || 0;
        
        // Общая статистика
        const totalPlays = Object.values(gameStats).reduce((sum, game) => sum + (game.plays || 0), 0);
        const totalPoints = Object.values(gameStats).reduce((sum, game) => sum + (game.record || 0), 0);
        
        document.getElementById('totalGamesPlayed').textContent = totalPlays;
        document.getElementById('gamesPointsEarned').textContent = totalPoints;
        document.getElementById('gamesAccuracy').textContent = '85%'; // Примерное значение
        document.getElementById('gamesTimeSpent').textContent = `${Math.round(totalPlays * 0.25)}ч`; // Пример
    }
    
    startAutoUpdates() {
        // Автообновление каждые 30 секунд
        setInterval(() => {
            this.loadUserRank();
            this.loadActiveTasks();
        }, 30000);
        
        // Проверка новых уведомлений каждую минуту
        setInterval(() => {
            this.loadNotifications();
        }, 60000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardSystem = new DashboardSystem();
    
    // Добавляем стили для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .floating-notification {
            animation: slideInRight 0.3s ease;
        }
        
        .floating-notification.removing {
            animation: slideOutRight 0.3s ease;
        }
        
        .glass-effect {
            background: rgba(30, 41, 59, 0.85);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        @media (max-width: 768px) {
            .dashboard-sidebar {
                position: fixed;
                left: -280px;
                top: 0;
                bottom: 0;
                z-index: 1000;
                transition: left 0.3s ease;
            }
            
            .dashboard-sidebar.mobile-open {
                left: 0;
            }
            
            .mobile-nav {
                display: flex;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--card-bg);
                border-top: 1px solid var(--border);
                padding: 10px;
                z-index: 999;
            }
            
            .mobile-nav-item {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                color: var(--text-muted);
                text-decoration: none;
                font-size: 12px;
                padding: 8px;
            }
            
            .mobile-nav-item.active {
                color: var(--primary);
            }
            
            .mobile-nav-item i {
                font-size: 20px;
                margin-bottom: 4px;
            }
        }
    `;
    document.head.appendChild(style);
});
