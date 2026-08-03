/**
 * VNKR Trade — PM2 Development Config
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
module.exports = {
  apps: [
    {
      name:   "vnkr-backend-dev",
      script: "node_modules/.bin/nest",
      args:   "start --watch",
      cwd:    "./apps/backend",
      env: {
        NODE_ENV:       "development",
        BACKEND_PORT:   "4001",
        SWAGGER_ENABLED:"true",
      },
      watch:        false,
      instances:    1,
      exec_mode:    "fork",
      max_memory_restart: "512M",
    },
    {
      name:   "vnkr-frontend-dev",
      script: "node_modules/.bin/next",
      args:   "dev -p 3001",
      cwd:    "./apps/frontend",
      env: {
        NODE_ENV:              "development",
        NEXT_PUBLIC_API_URL:   "http://localhost:4001",
        NEXT_PUBLIC_WS_URL:    "ws://localhost:4001",
        NEXT_PUBLIC_SITE_NAME: "VNKR Trade (Dev)",
      },
      watch:     false,
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
