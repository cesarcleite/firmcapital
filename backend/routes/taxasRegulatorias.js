// backend/routes/taxasRegulatorias.js
const express = require("express");
const {
  criarTaxa,
  listarTaxas,
  obterTaxa,
  atualizarTaxa,
  deletarTaxa,
  calcularValorTaxa,
  obterTaxasAplicaveis,
} = require("../controllers/taxaRegulatoriaController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/roles");

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(protect);

// Rotas públicas (para usuários autenticados)
router.get("/", listarTaxas);
router.get("/aplicaveis/:tipoFundo", obterTaxasAplicaveis);
router.get("/:id", obterTaxa);
router.post("/:id/calcular", calcularValorTaxa);

// Rotas apenas para Admin
router.post("/", authorize(ROLES.ADMIN), criarTaxa);
router.put("/:id", authorize(ROLES.ADMIN), atualizarTaxa);
router.delete("/:id", authorize(ROLES.ADMIN), deletarTaxa);

module.exports = router;
