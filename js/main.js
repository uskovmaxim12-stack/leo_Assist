// РЕАЛЬНАЯ АВТОРИЗАЦИЯ - ВСЕ КНОПКИ РАБОТАЮТ
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, если пользователь уже авторизован
    const currentUser = window.leoDB.getCurrentUser();
    if (currentUser) {
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return;
    }
    
    // Настраиваем переключение между формами
    setupFormSwitching();
    
    // Настраиваем кнопки
    setupButtons();
});

function setupFormSwitching() {
    // Показ/скрытие форм
    window.showSection = function(sectionId) {
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId + 'Section');
        if (targetSection) {
            targetSection.classList.add('active');
        }
    };
    
    // Показ админ-логина
    window.showAdminLogin = function() {
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const adminSection = document.getElementById('adminLoginSection');
        if (adminSection) {
            adminSection.classList.add('active');
        }
    };
}

function setupButtons() {
    // Кнопка входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = handleLogin;
    }
    
    // Кнопка админ-входа
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.onsubmit = handleAdminLogin;
    }
    
    // Кнопка регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.onsubmit = handleRegister;
    }
    
    // Кнопки показа/скрытия пароля
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
}

// ===== РЕАЛЬНЫЙ ВХОД =====
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showToast('Заполните все поля', 'error');
        return false;
    }
    
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
    btn.disabled = true;
    
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = window.leoDB.login(username, password);
    
    if (result.success) {
        showToast('Вход выполнен!', 'success');
        
        // Сохраняем информацию о пользователе
        localStorage.setItem('leo_current_user', JSON.stringify(result.user));
        
        // Перенаправляем
        setTimeout(() => {
            if (result.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1000);
    } else {
        showToast(result.error || 'Ошибка входа', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
    
    return false;
}

// ===== РЕАЛЬНЫЙ АДМИН ВХОД =====
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    
    if (!password) {
        showToast('Введите пароль администратора', 'error');
        return false;
    }
    
    const result = window.leoDB.login('admin', password);
    
    if (result.success && result.user.role === 'admin') {
        showToast('Вход в админ-панель выполнен!', 'success');
        
        localStorage.setItem('leo_current_user', JSON.stringify(result.user));
        
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    } else {
        showToast('Неверный пароль администратора', 'error');
    }
    
    return false;
}

// ===== РЕАЛЬНАЯ РЕГИСТРАЦИЯ =====
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('regName').value;
    const login = document.getElementById('regLogin').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const userClass = document.getElementById('regClass').value;
    
    // Валидация
    if (!name || !login || !password || !confirmPassword) {
        showToast('Заполните все поля', 'error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showToast('Пароли не совпадают', 'error');
        return false;
    }
    
    if (password.length < 3) {
        showToast('Пароль должен быть не менее 3 символов', 'error');
        return false;
    }
    
    // Проверяем, существует ли логин
    const users = window.leoDB.getAllUsers();
    if (users.some(u => u.login === login)) {
        showToast('Пользователь с таким логином уже существует', 'error');
        return false;
    }
    
    const userData = {
        name: name,
        login: login,
        password: password,
        class: userClass,
        role: 'student'
    };
    
    const result = window.leoDB.addUser(userData);
    
    if (result.success) {
        showToast('Регистрация успешна! Теперь войдите.', 'success');
        
        // Автоматически входим
        setTimeout(() => {
            window.leoDB.login(login, password);
            localStorage.setItem('leo_current_user', JSON.stringify(result.user));
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        showToast(result.error || 'Ошибка регистрации', 'error');
    }
    
    return false;
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function showToast(message, type = 'info') {
    // Создаем контейнер если его нет
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Автоматическое удаление
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Экспортируем функции для HTML
window.handleLogin = handleLogin;
window.handleAdminLogin = handleAdminLogin;
window.handleRegister = handleRegister;
window.showSection = showSection;
window.showAdminLogin = showAdminLogin;
