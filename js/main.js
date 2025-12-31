// ===== РЕАЛЬНЫЕ ФУНКЦИИ АВТОРИЗАЦИИ =====

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Показываем загрузку
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
    btn.disabled = true;
    
    // Задержка для имитации запроса
    setTimeout(() => {
        const result = window.leoDB.login(username, password);
        
        if (result.success) {
            // Сохраняем данные пользователя
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            
            // Показываем успех
            showNotification('success', 'Вход выполнен успешно!');
            
            // Перенаправляем на дашборд
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            // Показываем ошибку
            showNotification('error', result.error);
            
            // Восстанавливаем кнопку
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }, 800);
    
    return false;
}

function handleAdminLogin(event) {
    event.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    const adminUser = window.leoDB.getUserById(1); // Администратор
    
    if (adminUser && adminUser.password === password) {
        // Сохраняем флаг администратора
        localStorage.setItem('is_admin', 'true');
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        
        showNotification('success', 'Вход в админ-панель выполнен!');
        
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    } else {
        showNotification('error', 'Неверный пароль администратора');
    }
    
    return false;
}

function showAdminLogin() {
    document.getElementById('loginSection').classList.remove('active');
    document.getElementById('adminLoginSection').classList.add('active');
}

// ===== РЕАЛЬНАЯ РЕГИСТРАЦИЯ =====
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const login = document.getElementById('regLogin').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const classSelect = document.getElementById('regClass').value;
    
    // Проверки
    if (password !== confirmPassword) {
        showNotification('error', 'Пароли не совпадают');
        return false;
    }
    
    if (password.length < 3) {
        showNotification('error', 'Пароль должен быть не менее 3 символов');
        return false;
    }
    
    // Проверяем, существует ли пользователь
    const existingUser = window.leoDB.getAllUsers().find(u => u.login === login);
    if (existingUser) {
        showNotification('error', 'Пользователь с таким логином уже существует');
        return false;
    }
    
    // Создаем нового пользователя
    const newUser = {
        name: name,
        login: login,
        password: password,
        class: classSelect,
        role: 'student',
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase()
    };
    
    const success = window.leoDB.addUser(newUser);
    
    if (success) {
        showNotification('success', 'Регистрация успешна! Теперь войдите в систему.');
        showSection('login');
    } else {
        showNotification('error', 'Ошибка регистрации');
    }
    
    return false;
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function showNotification(type, message) {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Добавляем в контейнер
    const container = document.getElementById('notificationContainer') || 
                     (() => {
                         const div = document.createElement('div');
                         div.id = 'notificationContainer';
                         div.className = 'notification-container';
                         document.body.appendChild(div);
                         return div;
                     })();
    
    container.appendChild(notification);
    
    // Автоматическое удаление
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}
