// backend/routes/clientes.js
const express = require("express");
const {
  criarCliente,
  listarClientes,
  obterCliente,
  atualizarCliente,
  deletarCliente,
  atualizarAcesso,
} = require("../controllers/clienteController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/roles");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(listarClientes)
  .post(authorize(ROLES.ADMIN, ROLES.USUARIO), criarCliente);

router
  .route("/:id")
  .get(obterCliente)
  .put(authorize(ROLES.ADMIN, ROLES.USUARIO), atualizarCliente)
  .delete(authorize(ROLES.ADMIN, ROLES.USUARIO), deletarCliente);

router
  .route("/:id/acesso")
  .put(authorize(ROLES.ADMIN, ROLES.USUARIO), atualizarAcesso);

module.exports = router;
