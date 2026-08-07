const dotenv = require('dotenv');
dotenv.config();

const app = require('./app.js');
const connectDB = require('./src/DB/db.js');

connectDB();

const PORT = parseInt(process.env.PORT, 10) || 8000;

const server = app.listen(PORT, () => {
    console.log(`GreenSeva Server is running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${PORT} is in use. Retrying on port ${PORT + 1}...`);
        server.listen(PORT + 1);
    } else {
        console.error('Server error:', err);
    }
});