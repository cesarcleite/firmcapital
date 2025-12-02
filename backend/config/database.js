// backend/config/database.js
const mongoose = require("mongoose");
const config = require("./config");

const connectDB = async () => {
  try {
    let uri = config.mongoURI || "mongodb://localhost:27017/simulador_fundos";

    console.log(
      `[Database] Tentando conectar ao MongoDB: ${uri.replace(
        /:[^:]*@/,
        ":****@"
      )}`
    );

    const conn = await mongoose.connect(uri); // Removidas as opções deprecated

    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("❌ Erro na conexão MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB desconectado");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log(
        "🔌 Conexão MongoDB fechada devido ao encerramento da aplicação"
      );
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`❌ Erro na conexão com MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
