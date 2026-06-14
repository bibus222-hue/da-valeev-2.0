// server.js - серверная часть с Express и Socket.IO
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Создаем приложение Express
const app = express();

// Создаем HTTP сервер
const server = http.createServer(app);

// Создаем экземпляр Socket.IO
const io = socketIo(server);

// Порт для сервера
const PORT = process.env.PORT || 3000;

// Раздаем статические файлы (для HTML, CSS, JS)
app.use(express.static(__dirname));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client.html');
});

// Обработка соединения с Socket.IO
io.on('connection', (socket) => {
    console.log(`✅ Новый клиент подключен! ID: ${socket.id}`);
    console.log(`📊 Всего подключений: ${io.engine.clientsCount}`);
    
    // Отправляем приветственное сообщение новому клиенту
    socket.emit('welcome', {
        message: 'Добро пожаловать на сервер!',
        clientId: socket.id,
        timestamp: new Date().toLocaleTimeString()
    });
    
    // Сообщаем всем остальным клиентам о новом подключении
    socket.broadcast.emit('user_joined', {
        message: `Пользователь ${socket.id} присоединился к чату`,
        clientId: socket.id,
        timestamp: new Date().toLocaleTimeString()
    });
    
    // Обработка сообщений от клиента
    socket.on('client_message', (data) => {
        console.log(`📨 Получено сообщение от ${socket.id}: ${data.message}`);
        
        // Отправляем подтверждение отправителю
        socket.emit('message_received', {
            received: true,
            yourMessage: data.message,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Отправляем сообщение всем клиентам (кроме отправителя)
        socket.broadcast.emit('server_message', {
            from: socket.id,
            message: data.message,
            timestamp: new Date().toLocaleTimeString()
        });
    });
    
    // Обработка события "ping" для проверки соединения
    socket.on('ping', () => {
        console.log(`🏓 Получен ping от ${socket.id}`);
        socket.emit('pong', {
            timestamp: new Date().toLocaleTimeString()
        });
    });
    
    // Обработка отключения клиента
    socket.on('disconnect', () => {
        console.log(`❌ Клиент отключился: ${socket.id}`);
        console.log(`📊 Осталось подключений: ${io.engine.clientsCount}`);
        
        // Сообщаем всем о отключении пользователя
        io.emit('user_left', {
            message: `Пользователь ${socket.id} покинул чат`,
            timestamp: new Date().toLocaleTimeString()
        });
    });
    
    // Обработка ошибок
    socket.on('error', (error) => {
        console.error(`Ошибка у клиента ${socket.id}:`, error);
    });
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен!`);
    console.log(`📍 Адрес: http://localhost:${PORT}`);
    console.log(`⏰ Время запуска: ${new Date().toLocaleString()}`);
    console.log(`💡 Ожидание подключений...`);
});

// Обработка graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка сервера...');
    server.close(() => {
        console.log('✅ Сервер остановлен');
        process.exit(0);
    });
});