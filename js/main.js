// js/main.js - ОПТИМИЗИРОВАННЫЙ ДЛЯ МОБИЛЬНЫХ
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Leo Assistant загружен (мобильная версия)');
    
    // ========== ОПТИМИЗАЦИЯ ДЛЯ МОБИЛЬНЫХ ==========
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isMobile || isTouchDevice) {
        document.body.classList.add('touch-device');
        console.log('📱 Устройство с сенсорным экраном');
        
        // Оптимизация для касаний
        document.querySelectorAll('input, button').forEach(element => {
            element.style.fontSize = '16px'; // Предотвращаем зумирование на iOS
        });
    }
    
    // ========== ПАНЕЛЬ ВЫБОРА РЕЖИМА ==========
    const modeButtons = document.querySelectorAll('.mode-btn');
    
    modeButtons.forEach(button => {
        // Для мобильных используем touchend, для десктопа - click
        const eventType = isTouchDevice ? 'touchend' : 'click';
        
        button.addEventListener(eventType, function(e) {
            if (isTouchDevice) {
                e.preventDefault(); // Предотвращаем двойное срабатывание
            }
            
            const target = this.getAttribute('data-target');
            switchForm(target);
            
            // Вибрация на мобильных (если поддерживается)
            if (isTouchDevice && navigator.vibrate) {
                navigator.vibrate(10);
            }
        });
    });
    
    // Функция переключения формы
    function switchForm(target) {
        // Убираем активный класс
        modeButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс текущей кнопке
        document.querySelector(`.mode-btn[data-target="${target}"]`).classList.add('active');
        
        // Скрываем все формы
        document.querySelectorAll('.form').forEach(form => {
            form.classList.remove('active');
        });
        
        // Показываем нужную форму
        const targetForm = document.getElementById(target + 'Form');
        if (targetForm) {
            targetForm.classList.add('active');
            currentMode = target;
            
            // Плавная прокрутка к форме на мобильных
            if (window.innerWidth < 768) {
                setTimeout(() => {
                    targetForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }
        }
    }
    
    // ========== ВХОД В СИСТЕМУ ==========
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        const eventType = isTouchDevice ? 'touchend' : 'click';
        loginBtn.addEventListener(eventType, handleLogin);
        
        // Автовход по Enter
        document.getElementById('loginPassword')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    function handleLogin(e) {
        if (isTouchDevice && e) {
            e.preventDefault();
        }
        
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
        
        // Оптимизированная задержка для мобильных
        const delay = isMobile ? 600 : 800;
        
        setTimeout(() => {
            const user = leoDB.authUser(login, password);
            
            if (user) {
                showNotification(`Добро пожаловать, ${user.name}!`, 'success');
                
                btn.innerHTML = '<i class="fas fa-check"></i>';
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
                form.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    form.style.animation = '';
                }, 500);
            }
        }, delay);
    }
    
    // ========== РЕГИСТРАЦИЯ ==========
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        const eventType = isTouchDevice ? 'touchend' : 'click';
        registerBtn.addEventListener(eventType, handleRegister);
    }
    
    function handleRegister(e) {
        if (isTouchDevice && e) {
            e.preventDefault();
        }
        
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
                form.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    form.style.animation = '';
                }, 500);
            }
        }, 1000);
    }
    
    // ========== ВХОД АДМИНИСТРАТОРА ==========
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        const eventType = isTouchDevice ? 'touchend' : 'click';
        adminBtn.addEventListener(eventType, handleAdminLogin);
    }
    
    function handleAdminLogin(e) {
        if (isTouchDevice && e) {
            e.preventDefault();
        }
        
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
                form.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    form.style.animation = '';
                }, 500);
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
        
        // Стили для мобильных
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
        
        // Автозакрытие через 4 секунды на мобильных, 5 на десктопе
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
            'success': 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(52, 211, 153, 0.9) 100%)',
            'error': 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(248, 113, 113, 0.9) 100%)',
            'warning': 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(251, 191, 36, 0.9) 100%)',
            'info': 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(96, 165, 250, 0.9) 100%)'
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
        
        /* Стили для мобильных */
        .touch-device .auth-btn {
            min-height: 56px;
        }
        
        .touch-device .mode-btn {
            cursor: default;
        }
        
        .touch-device input {
            font-size: 16px !important;
        }
        
        /* Предотвращение зума на iOS */
        @media screen and (-webkit-min-device-pixel-ratio:0) {
            select,
            textarea,
            input {
                font-size: 16px !important;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ========== КЛАВИАТУРА ДЛЯ МОБИЛЬНЫХ ==========
    if (isMobile) {
        // Фокус на первое поле при выборе формы
        modeButtons.forEach(btn => {
            btn.addEventListener('touchend', function() {
                setTimeout(() => {
                    const target = this.getAttribute('data-target');
                    const form = document.getElementById(target + 'Form');
                    const firstInput = form?.querySelector('input');
                    if (firstInput) {
                        firstInput.focus({ preventScroll: true });
                    }
                }, 300);
            });
        });
        
        // Скрытие клавиатуры по тапу вне инпутов
        document.addEventListener('touchend', function(e) {
            if (!e.target.matches('input, textarea, button, .mode-btn')) {
                document.activeElement?.blur();
            }
        });
    }
    
    // ========== ПРЕДУПРЕЖДЕНИЕ О ПУСТОЙ БАЗЕ ==========
    console.log('ℹ️ База данных пользователей пуста. Новые пользователи будут добавляться при регистрации.');
    
    // ========== ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ ==========
    let lastTap = 0;
    document.addEventListener('touchend', function(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0) {
            e.preventDefault(); // Предотвращаем двойной тап
        }
        lastTap = currentTime;
    }, false);
});
