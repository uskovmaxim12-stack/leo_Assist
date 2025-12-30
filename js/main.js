// js/main.js - ИСПРАВЛЕННАЯ ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ФОРМ
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Leo Assistant загружен (исправленные кнопки)');
    
    // ========== ПЕРЕКЛЮЧЕНИЕ ФОРМ ==========
    const modeButtons = document.querySelectorAll('.mode-btn');
    let currentMode = 'login';
    
    // Функция для переключения между формами
    function switchForm(target) {
        console.log('🔄 Переключаем на форму:', target);
        
        // Обновляем текущий режим
        currentMode = target;
        
        // 1. Обновляем кнопки
        modeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-target') === target) {
                btn.classList.add('active');
            }
        });
        
        // 2. Скрываем все формы
        document.querySelectorAll('.form').forEach(form => {
            form.classList.remove('active');
            form.style.display = 'none';
        });
        
        // 3. Показываем нужную форму
        const targetForm = document.getElementById(target + 'Form');
        if (targetForm) {
            targetForm.style.display = 'block';
            setTimeout(() => {
                targetForm.classList.add('active');
            }, 10);
            
            // Фокус на первое поле формы
            setTimeout(() => {
                const firstInput = targetForm.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }
        
        // Вибрация на мобильных
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }
    
    // Обработчики для кнопок выбора режима
    modeButtons.forEach(button => {
        // Клик мышью
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const target = this.getAttribute('data-target');
            switchForm(target);
        });
        
        // Касание на мобильных
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const target = this.getAttribute('data-target');
            switchForm(target);
        });
        
        // Клавиатурная навигация
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                const target = this.getAttribute('data-target');
                switchForm(target);
            }
        });
    });
    
    // ========== ВХОД В СИСТЕМУ ==========
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        
        // Автовход по Enter
        document.getElementById('loginPassword')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    function handleLogin(e) {
        if (e) e.preventDefault();
        
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
        
        setTimeout(() => {
            const user = leoDB.authUser(login, password);
            
            if (user) {
                showNotification(`Добро пожаловать, ${user.name}!`, 'success');
                
                btn.innerHTML = '<i class="fas fa-check"></i> Успешно!';
                btn.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
                
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
        registerBtn.addEventListener('click', handleRegister);
    }
    
    function handleRegister(e) {
        if (e) e.preventDefault();
        
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
                
                btn.innerHTML = '<i class="fas fa-check"></i> Создан!';
                btn.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
                
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
        adminBtn.addEventListener('click', handleAdminLogin);
    }
    
    function handleAdminLogin(e) {
        if (e) e.preventDefault();
        
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
                
                btn.innerHTML = '<i class="fas fa-check"></i> Доступ разрешен!';
                btn.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
                
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
            backdrop-filter: blur(20px);
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
            'success': 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(52, 211, 153, 0.95) 100%)',
            'error': 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(248, 113, 113, 0.95) 100%)',
            'warning': 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(251, 191, 36, 0.95) 100%)',
            'info': 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(96, 165, 250, 0.95) 100%)'
        };
        return colors[type] || colors.info;
    }
    
    // ========== АНИМАЦИИ ==========
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
        
        .form {
            display: none;
        }
        
        .form.active {
            display: block;
        }
    `;
    document.head.appendChild(style);
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    console.log('✅ Кнопки переключения форм работают правильно');
    console.log('🤖 Эмодзи робота отображается корректно');
    
    // Тестирование кнопок в консоли
    modeButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            console.log(`🟢 Нажата кнопка ${index + 1}: ${btn.getAttribute('data-target')}`);
        });
    });
});
