// backend/middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Criar diretório se não existir
const uploadDir = path.join(__dirname, "../uploads/logos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único: logo-claro-1234567890.png
    const tipo = req.body.tipo || "logo"; // 'claro' ou 'escuro'
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${tipo}-${timestamp}${ext}`);
  },
});

// Filtro de arquivos (apenas imagens)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Apenas imagens são permitidas (jpeg, jpg, png, gif, svg, webp)"
      )
    );
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: fileFilter,
});

// Função para deletar arquivo antigo
const deleteOldFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  upload,
  deleteOldFile,
};
