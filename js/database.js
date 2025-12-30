// js/database.js - ЧИСТАЯ БАЗА БЕЗ ДЕМО
const leoDB = {
    // Инициализация базы
    init: function() {
        if (!localStorage.getItem('leo_users')) {
            localStorage.setItem('leo_users', JSON.stringify([]));
        }
    },
    
    // Получить пользователя по логину и паролю
    getUser: function(login, password) {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const user = users.find(u => u.login === login && u.password === password);
        
        if (user) {
            // Возвращаем копию без пароля
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        
        return null;
    },
    
    // Добавить нового пользователя
    addUser: function(userData) {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        
        // Проверяем, нет ли уже такого логина
        if (users.some(u => u.login === userData.login)) {
            return { success: false, error: 'Этот логин уже занят' };
        }
        
        // Создаем нового пользователя
        const newUser = {
            id: Date.now(),
            login: userData.login,
            password: userData.password,
            name: userData.name,
            avatar: userData.name.substring(0, 2).toUpperCase(),
            class: '7Б',
            role: 'student',
            points: 0,
            level: 1,
            tasks_completed: [],
            created_at: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('leo_users', JSON.stringify(users));
        
        // Возвращаем пользователя без пароля
        const { password: _, ...userWithoutPassword } = newUser;
        
        return { 
            success: true, 
            user: userWithoutPassword 
        };
    },
    
    // Получить рейтинг класса
    getClassRating: function() {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        
        // Сортируем по очкам и возвращаем без паролей
        return users
            .map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            })
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, 10);
    },
    
    // Обновить очки пользователя
    updateUserPoints: function(userId, points) {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;
        
        users[userIndex].points = (users[userIndex].points || 0) + points;
        users[userIndex].level = Math.floor(users[userIndex].points / 250) + 1;
        
        localStorage.setItem('leo_users', JSON.stringify(users));
        return true;
    },
    
    // Получить всех пользователей (для админки)
    getAllUsers: function() {
        const users = JSON.parse(localStorage.getItem('leo_users') || '[]');
        return users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }
};

// Инициализируем базу при загрузке
leoDB.init();
