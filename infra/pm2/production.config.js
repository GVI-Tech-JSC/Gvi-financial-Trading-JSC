/**
 * VNKR Trade — PM2 Production Config
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
module.exports = {
  apps: [
    {
      name:   "vnkr-backend",
      script: "./dist/app/main.js",
      cwd:    "./apps/backend",
      env_production: {
        NODE_ENV:     "production",
        BACKEND_PORT: "4001",
      },
      instances:  1,
      exec_mode:  "fork",
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/vnkr-backend-error.log",
      out_file:   "/var/log/pm2/vnkr-backend-out.log",
    },
    {
      name:   "vnkr-frontend",
      script: "node_modules/.bin/next",
      args:   "start -p 3001",
      cwd:    "./apps/frontend",
      env_production: {
        NODE_ENV:     "production",
        BACKEND_PORT: "4001",
      },
      instances:  1,
      exec_mode:  "fork",
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/vnkr-frontend-error.log",
      out_file:   "/var/log/pm2/vnkr-frontend-out.log",
    },
  ],
};
