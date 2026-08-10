require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('./middleware/cors');
const errorHandler = require('./utils/errorHandler');
const { startUptimeCron } = require('./jobs/uptimeCron');

// Import route modules
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const salesRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');
const alertRoutes = require('./routes/alerts');
const uptimeRoutes = require('./routes/uptime');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/uptime', uptimeRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Error handler
app.use(errorHandler);

// Start uptime cron job
startUptimeCron();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
