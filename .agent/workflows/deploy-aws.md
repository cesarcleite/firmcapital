---
description: Deploy completo do sistema Firm Capital na AWS
---

# Workflow: Deploy AWS

Este workflow descreve como fazer o deploy completo do sistema na AWS.

## Pré-requisitos

1. **Chave SSH configurada**: Certifique-se de ter a chave `Firm.pem` em `~/.ssh/`
2. **Git Bash instalado** (Windows) ou terminal Unix/Linux
3. **Acesso SSH à AWS**: `ssh -i ~/.ssh/Firm.pem ubuntu@54.172.212.199`

## Passos do Deploy

### 1. Preparação no Servidor AWS (Primeira vez apenas)

```bash
# Conectar via SSH
ssh -i ~/.ssh/Firm.pem -o ServerAliveInterval=60 ubuntu@54.172.212.199

# Criar estrutura de diretórios
sudo mkdir -p /var/www/firm/backend
sudo mkdir -p /var/www/firm/frontend-app
sudo mkdir -p /var/www/firm/backend/logs
sudo mkdir -p /var/www/firm/backend/uploads

# Ajustar permissões
sudo chown -R ubuntu:ubuntu /var/www/firm

# Instalar Node.js (se não estiver instalado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx (se não estiver instalado)
sudo apt-get update
sudo apt-get install -y nginx

# Instalar MongoDB local (opcional, se não usar Atlas)
# sudo apt-get install -y mongodb
# sudo systemctl start mongodb
# sudo systemctl enable mongodb
```

### 2. Configurar Variáveis de Ambiente

```bash
# No servidor AWS
cd /var/www/firm/backend

# Copiar template e editar
nano .env

# Preencher com os valores de produção:
# - MONGODB_URI
# - JWT_SECRET
# - CORS_ALLOWED_ORIGINS
# etc.

# Proteger arquivo .env
chmod 600 .env
```

### 3. Deploy dos Arquivos

No seu **computador local** (Windows com Git Bash):

```bash
# Navegar até o diretório do projeto
cd "/c/Users/cesar/OneDrive - Firm Capital/-- Firm Capital/TI/Site/Firm"

# Testar sincronização (dry-run)
bash deploy-scripts/sync-to-aws.sh --dry-run

# Sincronizar arquivos
bash deploy-scripts/sync-to-aws.sh

# OU fazer deploy completo (sync + install + restart)
bash deploy-scripts/deploy-aws.sh
```

### 4. Configurar Nginx (Primeira vez apenas)

```bash
# No servidor AWS
sudo cp /var/www/firm/nginx-config/firm-capital.conf /etc/nginx/sites-available/

# Criar symlink
sudo ln -s /etc/nginx/sites-available/firm-capital.conf /etc/nginx/sites-enabled/

# Remover default se necessário
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 5. Iniciar/Reiniciar Aplicação

```bash
# No servidor AWS
cd /var/www/firm/backend

# Instalar dependências
npm install --production

# Iniciar com PM2 (primeira vez)
pm2 start ecosystem.config.js

# OU reiniciar (deploys subsequentes)
pm2 restart ecosystem.config.js

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Execute o comando que aparecer na tela
```

### 6. Verificação

```bash
# Verificar PM2
pm2 status
pm2 logs firm-capital-api --lines 50

# Testar API
curl http://localhost:3000/health

# Testar Nginx
curl http://54.172.212.199

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/firm-capital-error.log
```

### 7. Seed do Banco de Dados (Primeira vez apenas)

```bash
# No servidor AWS
cd /var/www/firm/backend

# Criar empresa e admin padrão
npm run seed:admin

# Criar tipos de fundos
npm run seed:tipos

# OU rodar ambos
npm run seed:all
```

## Deploys Subsequentes

Para deploys após a configuração inicial, use apenas:

```bash
# No computador local
bash deploy-scripts/deploy-aws.sh
```

Este script irá:
1. Sincronizar arquivos
2. Instalar dependências
3. Reiniciar PM2
4. Verificar saúde da API

## Comandos Úteis

### Logs

```bash
# Ver logs PM2
pm2 logs firm-capital-api

# Ver logs específicos
pm2 logs firm-capital-api --err  # Apenas erros
pm2 logs firm-capital-api --out  # Apenas output

# Limpar logs
pm2 flush
```

### Gerenciar PM2

```bash
pm2 status                      # Status de todos os processos
pm2 restart firm-capital-api    # Reiniciar aplicação
pm2 stop firm-capital-api       # Parar aplicação
pm2 start firm-capital-api      # Iniciar aplicação
pm2 delete firm-capital-api     # Remover aplicação do PM2
pm2 monit                       # Monitor interativo
```

### Nginx

```bash
sudo nginx -t                   # Testar configuração
sudo systemctl reload nginx     # Recarregar (sem downtime)
sudo systemctl restart nginx    # Reiniciar (com downtime)
sudo systemctl status nginx     # Status
```

### Banco de Dados

```bash
# Conectar ao MongoDB local
mongosh firmcapital

# Backup
mongodump --db firmcapital --out /backup/$(date +%Y%m%d)

# Restore
mongorestore --db firmcapital /backup/20251209/firmcapital
```

## Troubleshooting

### API não responde

```bash
# Verificar se PM2 está rodando
pm2 status

# Ver logs de erro
pm2 logs firm-capital-api --err --lines 100

# Reiniciar
pm2 restart firm-capital-api
```

### Frontend não carrega

```bash
# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/firm-capital-error.log

# Verificar permissões
ls -la /var/www/firm/frontend-app
```

### Erro de conexão com MongoDB

```bash
# Verificar se MongoDB está rodando
sudo systemctl status mongodb

# Ver logs do MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# Testar conexão
mongosh --eval "db.runCommand({ ping: 1 })"
```

## Segurança

- [ ] Mudar senha do admin após primeiro login
- [ ] Configurar firewall (ufw)
- [ ] Configurar SSL/HTTPS com Let's Encrypt
- [ ] Fazer backup regular do banco de dados
- [ ] Manter sistema atualizado: `sudo apt update && sudo apt upgrade`
