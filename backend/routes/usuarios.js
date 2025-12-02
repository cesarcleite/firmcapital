// backend/routes/usuarios.js
const express = require("express");
const {
  listarUsuarios,
  obterUsuario,
  atualizarUsuario,
  deletarUsuario,
} = require("../controllers/usuarioController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/roles");

const router = express.Router();

// Todas as rotas requerem autenticação e role admin
router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.route("/").get(listarUsuarios);

router
  .route("/:id")
  .get(obterUsuario)
  .put(atualizarUsuario)
  .delete(deletarUsuario);

module.exports = router;
