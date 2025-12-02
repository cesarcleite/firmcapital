// backend/routes/empresa.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect, authorize } = require("../middleware/auth");
const {
  createEmpresa, // ADICIONADO
  getEmpresa,
  updateEmpresa,
  uploadLogo,
  deleteLogo,
  resetConfiguracoes,
} = require("../controllers/empresaController");

// Configuração do Multer - Upload temporário primeiro
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const empresaId = req.user.empresa.toString();
    const uploadPath = path.join(
      __dirname,
      "..",
      "uploads",
      "logos",
      `empresa-${empresaId}`
    );

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Nome temporário com timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `temp-${timestamp}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|svg/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Apenas imagens são permitidas (jpeg, jpg, png, gif, svg)"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter,
});

// Rotas
router.post("/", protect, authorize("admin"), createEmpresa); // NOVA ROTA
router.get("/", protect, authorize("admin"), getEmpresa);
router.put("/", protect, authorize("admin"), updateEmpresa);
router.post(
  "/upload-logo",
  protect,
  authorize("admin"),
  upload.single("logo"),
  uploadLogo
);
router.delete("/logo/:tipo", protect, authorize("admin"), deleteLogo);
router.post("/reset", protect, authorize("admin"), resetConfiguracoes);

module.exports = router;
