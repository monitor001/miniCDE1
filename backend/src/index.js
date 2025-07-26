"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const task_1 = __importDefault(require("./routes/task"));
const document_1 = __importDefault(require("./routes/document"));
const report_1 = __importDefault(require("./routes/report"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
});
setInterval(() => {
    io.emit('task:reminder', { message: 'Có công việc sắp đến hạn!' });
}, 60000);
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/users', user_1.default);
app.use('/api/tasks', task_1.default);
app.use('/api/documents', document_1.default);
app.use('/api/reports', report_1.default);
app.use('/uploads', express_1.default.static('public/uploads'));
app.get('/', (req, res) => {
    res.send('API is running!');
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
