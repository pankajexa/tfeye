const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { TSECHALLAN_CONFIG, SAMPLE_RTA_DATA } = require('./config');

// Import database setup
const { setupDatabase, checkDatabaseConnection } = require('./config/db-setup');

// Import routes
const healthRoutes = require('./routes/health');
const vehicleRoutes = require('./routes/vehicle-routes');
const aiRoutes = require('./routes/ai-routes');

// Import middleware
const errorHandler = require('./middleware/error-handler');

const app = express();
const PORT = process.env.PORT || 3001;

// Deployment-friendly settings
app.set('trust proxy', 1); // Trust first proxy for cloud deployments
app.disable('x-powered-by'); // Hide Express.js signature for security

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(healthRoutes);
app.use(vehicleRoutes);
app.use(aiRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Check database connection
    const dbReady = await checkDatabaseConnection();
    if (!dbReady) {
      console.warn('⚠️ Database connection failed, but starting server anyway...');
    }

    // Setup database tables (this is safe to run multiple times)
    if (dbReady) {
      await setupDatabase();
    }

    // Start server - Follow Render's exact pattern
    const server = app.listen(PORT, () => {
      console.log(`🚀 Traffic Challan Backend listening on port ${PORT}`);
      console.log(`🔗 Database Status: ${dbReady ? 'Connected' : 'Disconnected'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();




module.exports = app; 