________________________________________
PROMPT MASTER - SISTEMA DE SIMULAÇÃO DE FUNDOS DE INVESTIMENTO
CONTEXTO DO PROJETO
Desenvolver um sistema web fullstack para simulação e comparação de diferentes tipos de fundos de investimento (FII, FIP, FIDC, FIA, FI-Infra). O sistema possui 3 níveis de acesso (Admin, Usuário, Cliente) e deve permitir cadastro de usuários, clientes e gestão completa de simulações.
ARQUITETURA TECNOLÓGICA
•	Backend: Node.js + Express + MongoDB (Mongoose)
•	Frontend: HTML5 + CSS3 + JavaScript Vanilla
•	Autenticação: JWT + bcrypt
•	Deploy: Backend (Railway/Render) + Frontend (Vercel)
________________________________________
ESTRUTURA DE DIRETÓRIOS COMPLETA
projeto-simulador-fundos/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   ├── roles.js
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Cliente.js
│   │   ├── Simulacao.js
│   │   ├── TipoFundo.js
│   │   ├── Empresa.js
│   │   └── Log.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── usuarios.js
│   │   ├── clientes.js
│   │   ├── simulacoes.js
│   │   └── tiposFundos.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── usuarioController.js
│   │   ├── clienteController.js
│   │   ├── simulacaoController.js
│   │   └── tipoFundoController.js
│   ├── services/
│   │   └── emailService.js
│   ├── scripts/
│   │   ├── seedAdmin.js
│   │   └── seedTiposFundos.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── usuarios.html
│   │   ├── clientes.html
│   │   └── tipos-fundos.html
│   ├── usuario/
│   │   ├── dashboard.html
│   │   ├── simulacoes.html
│   │   └── meus-clientes.html
│   ├── cliente/
│   │   ├── dashboard.html
│   │   └── minhas-simulacoes.html
│   ├── simuladores/
│   │   ├── FII.html
│   │   └── generico.html
│   ├── shared/
│   │   ├── login.html
│   │   └── cadastro.html
│   ├── css/
│   │   ├── main.css
│   │   ├── auth.css
│   │   ├── admin.css
│   │   ├── dashboard.css
│   │   └── fii.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── usuario.js
│   │   ├── cliente.js
│   │   ├── fii.js
│   │   └── utils.js
│   ├── images/
│   │   └── logos/
│   └── index.html
└── README.md
________________________________________
REQUISITOS FUNCIONAIS DETALHADOS
1. SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO
Três níveis de acesso:
ADMIN:
•	Gerenciar usuários (criar, editar, desativar)
•	Gerenciar clientes de todos os usuários
•	Configurar tipos de fundos e campos
•	Visualizar todas as simulações
•	Acessar relatórios consolidados
•	Gerenciar configurações da empresa
USUÁRIO:
•	Criar e gerenciar seus próprios clientes
•	Criar simulações para seus clientes
•	Visualizar apenas simulações que criou
•	Editar/deletar suas simulações
•	Compartilhar simulações com clientes
CLIENTE:
•	Visualizar APENAS simulações criadas para ele
•	Ver detalhes completos de cada simulação
•	Não pode criar ou editar simulações
•	Dashboard simplificado
2. GESTÃO DE CLIENTES
•	Cadastro completo (nome, email, CPF/CNPJ, telefone, endereço)
•	Vincular cliente a um usuário responsável
•	Opção de criar acesso ao sistema para cliente
•	Tags e observações
•	Histórico de simulações do cliente
3. SISTEMA DE SIMULAÇÕES FLEXÍVEL
Modelo de dados genérico que suporta:
•	FII - Fundos Imobiliários
•	FIP - Fundos de Participações
•	FIDC - Fundos de Direitos Creditórios
•	FIA - Fundos de Ações
•	FI-Infra - Fundos de Infraestrutura
Características:
•	Campos dinâmicos baseados no tipo de fundo
•	Armazenamento de parâmetros como Map/Object
•	Armazenamento de resultados flexível
•	Versionamento de simulações
•	Status (rascunho, concluída, arquivada)
•	Compartilhamento via link único
4. CONFIGURAÇÃO DE TIPOS DE FUNDOS
Cada tipo deve ter:
•	Nome e código único
•	Descrição
•	Ícone e cor
•	Definição de campos do formulário (JSON)
•	Parâmetros padrão
•	Configurações específicas (permite venda, permite correção, etc)
________________________________________
DETALHAMENTO DOS ARQUIVOS
BACKEND
server.js
Arquivo principal do servidor Express. Responsável por:
•	Inicializar conexão MongoDB
•	Configurar middlewares (cors, helmet, rate-limit, json parser)
•	Registrar rotas
•	Error handler global
•	Iniciar servidor na porta configurada
config/database.js
Configuração e conexão com MongoDB usando Mongoose
config/roles.js
Definir constantes de roles (ADMIN, USUARIO, CLIENTE) e permissões (MANAGE_USERS, CREATE_SIMULATIONS, etc)
middleware/auth.js
•	Função protect: verificar JWT token e popular req.user
•	Função authorize: verificar role do usuário
middleware/rbac.js
•	checkPermission: verificar se usuário tem permissão específica
•	canAccessSimulation: verificar se usuário pode acessar uma simulação
models/User.js
Schema: nome, email, senha (hash), role, empresa, telefone, avatar, ativo, ultimoAcesso, dataCriacao, criadoPor Métodos: compararSenha, gerarToken Pre-save: hash senha com bcrypt
models/Cliente.js
Schema: nome, email, cpfCnpj, telefone, empresa, cargo, endereco (objeto), usuario (ref), responsavel (ref User), empresaDona (ref Empresa), tags[], observacoes, ativo, datas
models/Simulacao.js
Schema FLEXÍVEL:
•	titulo, descricao
•	tipoFundo (ref), codigoTipoFundo
•	cliente (ref), criadoPor (ref), empresa (ref)
•	parametros (Map of Mixed) - FLEXÍVEL
•	resultado (Map of Mixed) - FLEXÍVEL
•	dadosDetalhados: { direto: [], fundo: [], comparativo: [] }
•	versao, status, favorita
•	compartilhada, linkCompartilhamento
•	anexos[]
•	datas, visualizacoes
models/TipoFundo.js
Schema: nome, codigo, descricao, icone, cor
•	camposFormulario[] (define os campos do form dinamicamente)
•	parametrosDefault (Map)
•	configuracoes (objeto)
•	ativo, ordem, datas
models/Empresa.js
Schema: nome, nomeFantasia, cnpj, email, telefone, site, logo, endereco, configuracoes, plano, ativo
models/Log.js
Schema: usuario, acao, entidade, entidadeId, ip, userAgent, detalhes, timestamp
Controllers
Implementar CRUD completo para cada entidade respeitando permissões
Routes
Definir rotas RESTful com proteção de autenticação e autorização
scripts/seedAdmin.js
Criar empresa padrão e usuário admin inicial
scripts/seedTiposFundos.js
Popular banco com os 5 tipos de fundos iniciais (FII, FIP, FIDC, FIA, FI-Infra)
FRONTEND
Estrutura de Dashboards
admin/dashboard.html: Dashboard administrativo com estatísticas gerais, gráficos usuario/dashboard.html: Dashboard do usuário com suas simulações recentes cliente/dashboard.html: Dashboard do cliente vendo suas simulações
Sistema de Navegação
Cada dashboard tem sidebar com menu contextual baseado no role
js/api.js
Classe API com métodos para todas as chamadas HTTP:
•	Auth: login, register, logout
•	Simulações: criar, listar, obter, atualizar, deletar
•	Clientes: CRUD completo
•	Usuários: CRUD (apenas admin)
•	Tipos de fundos: listar
simuladores/FII.html
Página de simulação específica para FII (baseada no modelo fornecido) Integrada com API para salvar simulações
simuladores/generico.html
Simulador dinâmico que carrega campos baseado no tipo de fundo selecionado
________________________________________
ARQUIVOS MODELO (INSPIRAÇÃO)
FII.html (fornecido)
Interface completa de simulação FII com:
•	Formulário com abas (Básico, Custos, Avançado)
•	Campos de entrada organizados
•	Botão calcular
•	Área de resultados com gráficos
•	Tabelas detalhadas
fii.js (fornecido)
Lógica de cálculo complexa:
•	Formatação de moeda
•	Validações
•	Cálculos mensais iterativos
•	Geração de gráficos Chart.js
•	Atualização de tabelas HTML
•	Cálculo de TIR
fii.css (fornecido)
Estilo visual com tema Firm Capital:
•	Cores: gray-dark, beige, accent-gold
•	Layout responsivo
•	Cards e grids
•	Tabelas estilizadas
________________________________________
________________________________________
INSTRUÇÕES PARA GERAÇÃO DOS CÓDIGOS
1.	Seguir fielmente a estrutura definida
2.	Manter padrões do código modelo (FII.html, fii.js, fii.css)
3.	Usar mesma paleta de cores e estilo visual
4.	Implementar segurança (validações, sanitização, RBAC)
5.	Código completo e funcional - não usar placeholders
6.	Comentários explicativos em pontos críticos
7.	Tratamento de erros em todas as operações
8.	Responsividade no frontend
9.	Consistência entre backend e frontend
________________________________________

