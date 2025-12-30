// js/main.js - ТОЛЬКО ВХОД И РЕГИСТРАЦИЯ
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Leo Assistant загружен');
    
    // ========== ПЕРЕМЕННЫЕ ==========
    let currentMode = 'login';
    
    // ========== ПАНЕЛЬ ВЫБОРА РЕЖИМА ==========
    const modeButtons = document.querySelectorAll('.mode-btn');
    
    modeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            switchForm(target);
        });
    });
    
    // Функция переключения формы
    function switchForm(target) {
        if (currentMode === target) return;
        
        currentMode = target;
        
        // Убираем активный класс
        modeButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс
        this.classList.add('active');
        
        // Скрываем все формы
        document.querySelectorAll('.form').forEach(form => {
            form.classList.remove('active');
        });
        
        // Показываем нужную форму
        const targetForm = document.getElementById(target + 'Form');
        if (targetForm) {
            targetForm.classList.add('active');
        }
    }
    
    // ========== ВХОД В СИСТЕМУ ==========
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    function handleLogin() {
        const login = document.getElementById('loginUsername')?.value.trim();
        const password = document.getElementById('loginPassword')?.value.trim();
        
        if (!login || !password) {
            showNotification('Заполните все поля', 'error');
            return;
        }
        
        // Проверка в базе данных
        const user = leoDB.authUser(login, password);
        if (user) {
            showNotification(`Добро пожаловать, ${user.name}!`, 'success');
            
            // Сохраняем пользователя
            localStorage.setItem('current_user', JSON.stringify(user));
            
            // Если админ - сохраняем флаг
            if (user.role === 'admin') {
                localStorage.setItem('is_admin', 'true');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            } else {
                // Обычный пользователь
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } else {
            showNotification('Неверный логин или пароль', 'error');
        }
    }
    
    // ========== РЕГИСТРАЦИЯ ==========
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
    }
    
    function handleRegister() {
        const login = document.getElementById('regLogin')?.value.trim();
        const name = document.getElementById('regName')?.value.trim();
        const password = document.getElementById('regPassword')?.value.trim();
        const confirmPassword = document.getElementById('regConfirmPassword')?.value.trim();
        
        if (!login || !name || !password || !confirmPassword) {
            showNotification('Заполните все поля', 'error');
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
        
        // Регистрация в базе данных
        const result = leoDB.addUser({
            login: login,
            password: password,
            name: name
        });
        
        if (result.success) {
            showNotification(`Аккаунт создан для ${name}!`, 'success');
            
            // Автоматический вход
            const user = leoDB.authUser(login, password);
            if (user) {
                localStorage.setItem('current_user', JSON.stringify(user));
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
        } else {
            showNotification(result.error || 'Ошибка регистрации', 'error');
        }
    }
    
    // ========== ВХОД АДМИНИСТРАТОРА ==========
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', handleAdminLogin);
    }
    
    function handleAdminLogin() {
        const password = document.getElementById('adminPassword')?.value.trim();
        const db = leoDB.getAll();
        
        if (db && password === (db.system?.admin_password || 'admin123')) {
            showNotification('Вход как администратор', 'success');
            localStorage.setItem('is_admin', 'true');
            
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            showNotification('Неверный пароль администратора', 'error');
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
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    console.log('✅ Система входа готова');
});
