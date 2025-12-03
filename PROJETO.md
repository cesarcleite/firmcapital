# Firm Capital - Informações do Projeto

## 🔐 Credenciais de Teste

**URL:** http://127.0.0.1:5500/frontend-app/shared/login.html

**Login:**
- Email: cesar.leite@firmcapital.com.br
- Senha: 123456

---

## 📦 Repositório GitHub

**URL:** https://github.com/cesarcleite/firmcapital  
**Branch principal:** main  
**Último commit:** feat: Sincronização completa FII/FIP-IE e correções críticas

---

## 🚀 Comandos Git Úteis

### Verificar status
```bash
git status
```

### Adicionar mudanças
```bash
git add .
```

### Fazer commit
```bash
git commit -m "descrição das mudanças"
```

### Enviar para GitHub
```bash
git push
```

### Puxar atualizações
```bash
git pull
```

### Ver histórico
```bash
git log --oneline
```

---

## 🔄 Workflow de Desenvolvimento

1. **Fazer alterações** no código
2. **Verificar status**: `git status`
3. **Adicionar arquivos**: `git add .`
4. **Fazer commit**: `git commit -m "descrição"`
5. **Enviar**: `git push`

---

## 📝 Convenções de Commit

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

**Exemplo:**
```bash
git commit -m "feat: adicionar novo relatório de vendas"
git commit -m "fix: corrigir cálculo de juros no FII"
```

---

## 🏗️ Estrutura do Projeto

```
Firm/
├── backend/          # API Node.js + Express + MongoDB
├── frontend-app/     # Aplicação principal
│   ├── simuladores/  # FII e FIP-IE
│   ├── js/          # Lógica JavaScript
│   ├── css/         # Estilos
│   └── shared/      # Componentes compartilhados
└── .agent/          # Configurações do agente
```

---

## 🔧 Ambiente de Desenvolvimento

### Backend
```bash
cd backend
npm run dev
```
Servidor: http://localhost:3000

### Frontend
```bash
# Servir com Live Server ou similar
# URL: http://127.0.0.1:5500
```

---

## 📊 Simuladores

### FII (Fundo de Investimento Imobiliário)
- **Regime:** Lucro Presumido
- **Label:** Faturamento Bruto Mensal
- **Tributação:** 34% sobre faturamento

### FIP-IE (Fundo de Investimento em Participações - Infraestrutura)
- **Regime:** Lucro Real
- **Label:** Resultado Líquido Mensal
- **Tributação:** 34% sobre lucro líquido

---

## ✅ Últimas Correções Aplicadas

- ✅ Corrigido cálculo TIR no FIP-IE
- ✅ Adicionado window.resultadosSimulacao em ambos sistemas
- ✅ Adicionado campo dividendoAcumulado
- ✅ Padronizada estrutura de salvamento
- ✅ Alterado terminologia FIP-IE para Lucro Real
- ✅ Sincronizado FII e FIP-IE completamente
