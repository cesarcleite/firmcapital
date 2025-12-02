const express = require("express");
const {
  register,
  login,
  getMe,
  updateMe,
  updatePassword,
  logout,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../config/roles");

const router = express.Router();

// Register pode ser público (primeiro admin) OU autenticado (admin criando usuário)
router.post(
  "/register",
  async (req, res, next) => {
    // Tentar aplicar protect, mas não falhar se não houver token
    try {
      await protect(req, res, () => {});
    } catch (err) {
      // Ignorar erro de autenticação - deixar o controller decidir
    }
    next();
  },
  register
);

router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/updatepassword", protect, updatePassword);

module.exports = router;
