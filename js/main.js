// js/main.js - ОБНОВЛЕННАЯ ЛОГИКА С КЛИКАБЕЛЬНЫМИ КНОПКАМИ
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Leo Assistant загружен (кликабельные кнопки)');
    
    // ========== ОПТИМИЗАЦИЯ ДЛЯ МОБИЛЬНЫХ ==========
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isMobile || isTouchDevice) {
        document.body.classList.add('touch-device');
        console.log('📱 Устройство с сенсорным экраном');
    }
    
    // ========== ПАНЕЛЬ ВЫБОРА РЕЖИМА - ИСПРАВЛЕНА КЛИКАБЕЛЬНОСТЬ ==========
    const modeButtons = document.querySelectorAll('.mode-btn');
    let currentMode = 'login';
    
    // Функция для переключения форм
    function switchForm(target) {
        if (currentMode === target) return;
        
        currentMode = target;
        
        // Убираем активный класс со всех кнопок
        modeButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс текущей кнопке
        const activeBtn = document.querySelector(`.mode-btn[data-target="${target}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Скрываем все формы
        document.querySelectorAll('.form').forEach(form => {
            form.classList.remove('active');
        });
        
        // Показываем нужную форму
        const targetForm = document.getElementById(target + 'Form');
        if (targetForm) {
            targetForm.classList.add('active');
            
            // Анимация появления
            targetForm.style.animation = 'none';
            setTimeout(() => {
                targetForm.style.animation = 'fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }, 10);
            
            // Фокус на первое поле
            setTimeout(() => {
                const firstInput = targetForm.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 300);
        }
        
        // Вибрация на мобильных (если поддерживается)
        if (isTouchDevice && navigator.vibrate) {
            navigator.vibrate(15);
        }
    }
    
    // Обработчики для кнопок выбора режима
    modeButtons.forEach(button => {
        // Для надежности добавляем оба обработчика
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const target = this.getAttribute('data-target');
            switchForm(target);
        });
        
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const target = this.getAttribute('data-target');
            switchForm(target);
        });
        
        // Клавиатурная навигация
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
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
        
        // Автовход по Enter в форме входа
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
    
    // ========== ОПТИМИЗИРОВАННЫЕ УВЕДОМЛЕНИЯ ==========
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
        const autoCloseTime = isMobile ? 4000 : 5000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = `${isSmallScreen ? 'slideOutDown' : 'slideOutRight'} 0.4s ease`;
                setTimeout(() => notification.remove(), 400);
            }
        }, autoCloseTime);
        
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
    
    // ========== ДОПОЛНИТЕЛЬНЫЕ АНИМАЦИИ ==========
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
        
        /* Улучшение доступности */
        .mode-btn:focus,
        .auth-btn:focus {
            outline: 2px solid var(--primary);
            outline-offset: 2px;
        }
        
        /* Предотвращение выделения текста */
        .mode-btn,
        .auth-btn {
            user-select: none;
        }
        
        /* Улучшение для мобильных */
        @media (max-width: 768px) {
            .mode-btn:active,
            .auth-btn:active {
                transform: scale(0.97);
                transition: transform 0.1s;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ========== УЛУЧШЕНИЕ ДОСТУПНОСТИ ==========
    // Фокус на первую кнопку при загрузке
    setTimeout(() => {
        const firstBtn = document.querySelector('.mode-btn.active');
        if (firstBtn) {
            firstBtn.focus();
        }
    }, 100);
    
    // Навигация стрелками
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const currentIndex = Array.from(modeButtons).findIndex(btn => 
                btn.classList.contains('active')
            );
            
            let nextIndex;
            if (e.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % modeButtons.length;
            } else {
                nextIndex = (currentIndex - 1 + modeButtons.length) % modeButtons.length;
            }
            
            const target = modeButtons[nextIndex].getAttribute('data-target');
            switchForm(target);
            modeButtons[nextIndex].focus();
        }
    });
    
    // ========== ОТЛАДОЧНАЯ ИНФОРМАЦИЯ ==========
    console.log('✅ Кнопки переключения форм активированы и кликабельны');
    console.log('🎨 Фичи красиво оформлены с иконками в кружках');
});
