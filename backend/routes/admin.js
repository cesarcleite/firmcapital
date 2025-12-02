// backend/routes/admin.js
const express = require("express");
const {
  getDashboard,
  getEmpresa,
  atualizarEmpresa,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/roles");

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.get("/dashboard", getDashboard);
router.route("/empresa").get(getEmpresa).put(atualizarEmpresa);

module.exports = router;
