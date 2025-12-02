const mongoose = require("mongoose");
const connectDB = require("../config/database");
const TipoFundo = require("../models/TipoFundo");

const checkFunds = async () => {
  try {
    await connectDB();
    console.log("🔌 Connected to DB");

    const funds = await TipoFundo.find({});
    console.log(`Found ${funds.length} funds:`);
    funds.forEach(f => console.log(`- ${f.codigo}: ${f.nome}`));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkFunds();
