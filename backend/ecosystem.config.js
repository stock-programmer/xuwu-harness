module.exports = {
  apps: [
    {
      name: 'claude-harness-backend',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Auto-restart and performance
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Watch (disable in production)
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '*.log',
        'dist',
      ],

      // Source maps support
      source_map_support: true,

      // Instance settings
      instance_var: 'INSTANCE_ID',

      // Cron restart (optional - restart at 3 AM daily)
      // cron_restart: '0 3 * * *',

      // Error handling
      exp_backoff_restart_delay: 100,

      // Advanced features
      vizion: false,
      post_update: ['npm install'],
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/claude-code-harness.git',
      path: '/var/www/claude-harness',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': '',
      'post-deploy-local': '',
    },
  },
};
