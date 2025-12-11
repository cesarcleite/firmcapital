// backend/ecosystem.config.js
// Arquivo de configuração do PM2 para gerenciar o processo Node.js na AWS

module.exports = {
  apps: [
    {
      // Identificação da aplicação
      name: 'firm-capital-api',
      
      // Script principal
      script: './server.js',
      
      // Diretório de trabalho
      cwd: '/var/www/firm/backend',
      
      // Modo de execução
      // 'cluster' = múltiplas instâncias para aproveitar todos os cores
      // 'fork' = single instance
      exec_mode: 'cluster',
      
      // Número de instâncias
      // 'max' = uma instância por core da CPU
      // ou especifique um número (ex: 2)
      instances: 'max',
      
      // Variáveis de ambiente (complementam o .env)
      env: {
        NODE_ENV: 'production',
        PORT: 5002
      },
      
      // Auto-restart em caso de crash
      autorestart: true,
      
      // Tentativas de restart antes de desistir
      max_restarts: 10,
      
      // Tempo mínimo entre restarts (evita restart loop)
      min_uptime: '10s',
      
      // Delay entre restarts
      restart_delay: 4000,
      
      // Máximo de memória permitida (restart se exceder)
      max_memory_restart: '500M',
      
      // Modo watch (recarregar em mudanças de arquivo)
      // Desabilitado em produção
      watch: false,
      
      // Ignorar certos arquivos se watch estiver ativo
      ignore_watch: [
        'node_modules',
        'uploads',
        'logs',
        '.git'
      ],
      
      // Logs
      error_file: '/var/www/firm/backend/logs/pm2-error.log',
      out_file: '/var/www/firm/backend/logs/pm2-out.log',
      log_file: '/var/www/firm/backend/logs/pm2-combined.log',
      
      // Formato de log com timestamp
      time: true,
      
      // Merge logs de todas as instâncias
      merge_logs: true,
      
      // Rotação de logs (requer pm2-logrotate)
      // Instalar com: pm2 install pm2-logrotate
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Kill timeout antes de forçar shutdown
      kill_timeout: 3000,
      
      // Esperar aplicação estar pronta antes de considerar "online"
      wait_ready: true,
      listen_timeout: 10000,
      
      // Incrementar variável de ambiente NODE_APP_INSTANCE
      // Útil para distinguir instâncias em cluster
      instance_var: 'INSTANCE_ID',
      
      // Source map support para stack traces melhores
      source_map_support: true,
      
      // Desabilitar auto-dump em crash (pode gerar arquivos grandes)
      pmx: false,
    }
  ],

  // Configuração do deploy (opcional, para deploy via PM2)
  deploy: {
    production: {
      user: 'ubuntu',
      host: '54.172.212.199',
      key: '~/.ssh/Firm.pem',
      ref: 'origin/main',
      repo: 'https://github.com/cesarcleite/firmcapital.git', // Ajustar se necessário
      path: '/var/www/firm/backend',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/firm/backend/logs'
    }
  }
};
