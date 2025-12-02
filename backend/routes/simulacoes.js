// backend/routes/simulacoes.js
const express = require("express");
const {
  criarSimulacao,
  listarSimulacoes,
  obterSimulacao,
  atualizarSimulacao,
  deletarSimulacao,
  compartilharSimulacao,
  obterSimulacaoCompartilhada,
} = require("../controllers/simulacaoController");
const { protect, authorize } = require("../middleware/auth");
const { canAccessSimulation } = require("../middleware/rbac");
const { ROLES } = require("../config/roles");

const router = express.Router();

// Rota pública para simulações compartilhadas
router.get("/compartilhadas/:link", obterSimulacaoCompartilhada);

// Todas as outras rotas requerem autenticação
router.use(protect);

router
  .route("/")
  .get(listarSimulacoes)
  .post(authorize(ROLES.ADMIN, ROLES.USUARIO), criarSimulacao);

router
  .route("/:id")
  .get(canAccessSimulation, obterSimulacao)
  .put(
    authorize(ROLES.ADMIN, ROLES.USUARIO),
    canAccessSimulation,
    atualizarSimulacao
  )
  .delete(
    authorize(ROLES.ADMIN, ROLES.USUARIO),
    canAccessSimulation,
    deletarSimulacao
  );

router.post(
  "/:id/compartilhar",
  authorize(ROLES.ADMIN, ROLES.USUARIO),
  canAccessSimulation,
  compartilharSimulacao
);

module.exports = router;
