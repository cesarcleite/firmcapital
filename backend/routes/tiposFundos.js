// backend/routes/tiposFundos.js
const express = require("express");
const {
  listarTiposFundos,
  obterTipoFundo,
  criarTipoFundo,
  atualizarTipoFundo,
  deletarTipoFundo,
} = require("../controllers/tipoFundoController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/roles");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(listarTiposFundos)
  .post(authorize(ROLES.ADMIN), criarTipoFundo);

router
  .route("/:id")
  .get(obterTipoFundo)
  .put(authorize(ROLES.ADMIN), atualizarTipoFundo)
  .delete(authorize(ROLES.ADMIN), deletarTipoFundo);

module.exports = router;
