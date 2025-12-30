// js/main.js - ЧИСТАЯ ЛОГИКА БЕЗ ДЕМО
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Leo Assistant загружен');
    
    // Переключение форм
    document.querySelectorAll('.form-switch').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            
            document.querySelectorAll('.form').forEach(form => {
                form.classList.remove('active');
            });
            
            document.getElementById(target + 'Form').classList.add('active');
        });
    });

    // ========== ВХОД ПОЛЬЗОВАТЕЛЯ ==========
    document.getElementById('loginBtn')?.addEventListener('click', function() {
        const login = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!login || !password) {
            showNotification('Заполните все поля', 'error');
            return;
        }
        
        // Ищем пользователя в базе
        const user = leoDB.getUser(login, password);
        
        if (user) {
            // Сохраняем данные пользователя (без пароля)
            const userData = {
                id: user.id,
                name: user.name,
                login: user.login,
                avatar: user.avatar,
                class: user.class,
                points: user.points || 0,
                level: user.level || 1
            };
            
            localStorage.setItem('current_user', JSON.stringify(userData));
            
            showNotification(`Добро пожаловать, ${user.name}!`, 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showNotification('Неверный логин или пароль', 'error');
        }
    });

    // ========== РЕГИСТРАЦИЯ ==========
    document.getElementById('registerBtn')?.addEventListener('click', function() {
        const login = document.getElementById('regLogin').value.trim();
        const name = document.getElementById('regName').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
        
        // Проверки
        if (!login || !name || !password || !confirmPassword) {
            showNotification('Заполните все поля', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 4) {
            showNotification('Пароль должен быть не менее 4 символов', 'error');
            return;
        }
        
        // Регистрируем пользователя
        const result = leoDB.addUser({
            login: login,
            name: name,
            password: password
        });
        
        if (result.success) {
            // Автоматически входим
            const userData = {
                id: result.user.id,
                name: result.user.name,
                login: result.user.login,
                avatar: result.user.avatar,
                class: result.user.class,
                points: result.user.points,
                level: result.user.level
            };
            
            localStorage.setItem('current_user', JSON.stringify(userData));
            
            showNotification(`Аккаунт создан для ${name}!`, 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showNotification(result.error, 'error');
        }
    });

    // ========== ВХОД АДМИНИСТРАТОРА ==========
    document.getElementById('adminBtn')?.addEventListener('click', function() {
        const password = document.getElementById('adminPassword').value.trim();
        
        // Пароль администратора по умолчанию
        if (password === 'admin123') {
            localStorage.setItem('is_admin', 'true');
            showNotification('Вход как администратор', 'success');
            
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            showNotification('Неверный пароль администратора', 'error');
        }
    });

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) oldNotification.remove();
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Стили уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
});
