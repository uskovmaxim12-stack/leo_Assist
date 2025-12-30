// js/main.js - ИСПРАВЛЕННАЯ ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ФОРМ
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Leo Assistant загружен');
    
    // ========== ПЕРЕКЛЮЧЕНИЕ ФОРМ - ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ ==========
    const modeButtons = document.querySelectorAll('.mode-btn');
    
    // Показываем форму входа по умолчанию
    showForm('login');
    
    // Обработчики для кнопок
    modeButtons.forEach(button => {
        // Клик мышью
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            console.log('🔄 Переключаем на форму:', target);
            showForm(target);
            
            // Делаем кнопку активной
            modeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
        
        // Для мобильных
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            console.log('📱 Переключаем на форму (мобильный):', target);
            showForm(target);
            
            modeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Функция показа формы
    function showForm(formName) {
        // Скрываем все формы
        document.querySelectorAll('.form').forEach(form => {
            form.classList.remove('active');
            form.style.display = 'none';
        });
        
        // Показываем нужную форму
        const targetForm = document.getElementById(formName + 'Form');
        if (targetForm) {
            targetForm.style.display = 'block';
            setTimeout(() => {
                targetForm.classList.add('active');
            }, 10);
            
            // Фокус на первое поле
            setTimeout(() => {
                const firstInput = targetForm.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 50);
        }
    }
    
    // ========== ВХОД В СИСТЕМУ ==========
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    function handleLogin() {
        const login = document.getElementById('loginUsername')?.value.trim();
        const password = document.getElementById('loginPassword')?.value.trim();
        
        if (!login || !password) {
            showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }
        
        // Анимация кнопки
        const btn = document.getElementById('loginBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<div class="loading-spinner"></div>';
        btn.disabled = true;
        
        // Демо-вход для тестирования
        setTimeout(() => {
            // Проверяем демо-аккаунт
            if (login === 'demo' && password === 'demo') {
                const demoUser = {
                    id: 1,
                    name: 'Демо Пользователь',
                    avatar: 'ДП',
                    role: 'student',
                    points: 1280,
                    level: 5,
                    tasks_completed: []
                };
                
                localStorage.setItem('current_user', JSON.stringify(demoUser));
                showNotification('Демо-вход успешен!', 'success');
                
                btn.innerHTML = '<i class="fas fa-check"></i>';
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                return;
            }
            
            // Проверка в базе данных
            const user = leoDB.authUser(login, password);
            
            if (user) {
                showNotification(`Добро пожаловать, ${user.name}!`, 'success');
                
                btn.innerHTML = '<i class="fas fa-check"></i>';
                
                setTimeout(() => {
                    localStorage.setItem('current_user', JSON.stringify(user));
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                
                showNotification('Неверный логин или пароль', 'error');
                
                // Анимация ошибки
                const form = document.getElementById('loginForm');
                form.style.animation = 'none';
                setTimeout(() => {
                    form.style.animation = 'shake 0.5s ease';
                    setTimeout(() => {
                        form.style.animation = '';
                    }, 500);
                }, 10);
            }
        }, 800);
    }
    
    // ========== РЕГИСТРАЦИЯ ==========
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleRegister();
        });
    }
    
    function handleRegister() {
        const login = document.getElementById('regLogin')?.value.trim();
        const name = document.getElementById('regName')?.value.trim();
        const password = document.getElementById('regPassword')?.value.trim();
        const confirmPassword = document.getElementById('regConfirmPassword')?.value.trim();
        
        if (!login || !name || !password || !confirmPassword) {
            showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        if (login.length < 3) {
            showNotification('Логин должен быть не менее 3 символов', 'error');
            return;
        }
        
        // Анимация кнопки
        const btn = document.getElementById('registerBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<div class="loading-spinner"></div>';
        btn.disabled = true;
        
        setTimeout(() => {
            const result = leoDB.addUser({
                login: login,
                password: password,
                name: name
            });
            
            if (result.success) {
                showNotification(`Аккаунт успешно создан для ${name}!`, 'success');
                
                btn.innerHTML = '<i class="fas fa-check"></i>';
                
                setTimeout(() => {
                    const user = leoDB.authUser(login, password);
                    if (user) {
                        localStorage.setItem('current_user', JSON.stringify(user));
                        window.location.href = 'dashboard.html';
                    }
                }, 1500);
            } else {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                
                showNotification(result.error || 'Ошибка регистрации', 'error');
                
                const form = document.getElementById('registerForm');
                form.style.animation = 'none';
                setTimeout(() => {
                    form.style.animation = 'shake 0.5s ease';
                    setTimeout(() => {
                        form.style.animation = '';
                    }, 500);
                }, 10);
            }
        }, 1000);
    }
    
    // ========== ВХОД АДМИНИСТРАТОРА ==========
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleAdminLogin();
        });
    }
    
    function handleAdminLogin() {
        const password = document.getElementById('adminPassword')?.value.trim();
        
        if (!password) {
            showNotification('Введите пароль администратора', 'error');
            return;
        }
        
        const btn = document.getElementById('adminBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<div class="loading-spinner"></div>';
        btn.disabled = true;
        
        setTimeout(() => {
            const db = leoDB.getAll();
            const adminPassword = db.system?.admin_password || 'admin123';
            
            if (password === adminPassword) {
                showNotification('Доступ разрешен. Вход как администратор', 'success');
                
                btn.innerHTML = '<i class="fas fa-check"></i>';
                
                setTimeout(() => {
                    localStorage.setItem('is_admin', 'true');
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                
                showNotification('Неверный пароль администратора', 'error');
                
                const form = document.getElementById('adminForm');
                form.style.animation = 'none';
                setTimeout(() => {
                    form.style.animation = 'shake 0.5s ease';
                    setTimeout(() => {
                        form.style.animation = '';
                    }, 500);
                }, 10);
            }
        }, 800);
    }
    
    // ========== УВЕДОМЛЕНИЯ ==========
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
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
        
        const isSmallScreen = window.innerWidth < 768;
        notification.style.cssText = `
            position: fixed;
            ${isSmallScreen ? 'bottom: 20px; left: 20px; right: 20px;' : 'top: 30px; right: 30px;'}
            background: ${getNotificationColor(type)};
            color: white;
            padding: ${isSmallScreen ? '15px 20px' : '20px 25px'};
            border-radius: ${isSmallScreen ? '16px' : '12px'};
            display: flex;
            align-items: center;
            gap: ${isSmallScreen ? '12px' : '15px'};
            z-index: 10000;
            animation: ${isSmallScreen ? 'slideInUp 0.4s ease' : 'slideInRight 0.4s ease'};
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: ${isSmallScreen ? 'none' : '400px'};
        `;
        
        // Обработчик закрытия
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.style.animation = `${isSmallScreen ? 'slideOutDown' : 'slideOutRight'} 0.4s ease`;
            setTimeout(() => notification.remove(), 400);
        });
        
        // Автозакрытие
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = `${isSmallScreen ? 'slideOutDown' : 'slideOutRight'} 0.4s ease`;
                setTimeout(() => notification.remove(), 400);
            }
        }, 5000);
        
        document.body.appendChild(notification);
    }
    
    function getNotificationColor(type) {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#3b82f6'
        };
        return colors[type] || colors.info;
    }
    
    // ========== ДОБАВЛЯЕМ АНИМАЦИИ ==========
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        
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
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(100%);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideOutDown {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(100%);
            }
        }
        
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Формы */
        .form {
            display: none;
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .form.active {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
    
    // ========== ТЕСТИРОВАНИЕ КНОПОК ==========
    console.log('✅ Кнопки переключения форм готовы к работе');
    console.log('🟢 Вход в аккаунт → форма входа');
    console.log('🔵 Создать аккаунт → форма регистрации');
    console.log('🟣 Админ-панель → форма админа');
    
    // Быстрая проверка кнопок
    modeButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            console.log(`🟢 Нажата кнопка ${index + 1}: ${btn.textContent}`);
        });
    });
    
    // Автозаполнение для тестирования (можно удалить в продакшене)
    setTimeout(() => {
        const loginInput = document.getElementById('loginUsername');
        const passInput = document.getElementById('loginPassword');
        
        if (loginInput && !loginInput.value) {
            loginInput.value = 'demo';
            passInput.value = 'demo';
        }
    }, 1000);
});
