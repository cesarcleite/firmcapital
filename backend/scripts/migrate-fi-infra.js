const mongoose = require("mongoose");
const connectDB = require("../config/database");
const TaxaRegulatoria = require("../models/TaxaRegulatoria");

const migrate = async () => {
  try {
    await connectDB();
    console.log("🔌 Connected to DB");

    const result = await TaxaRegulatoria.updateMany(
      { aplicavelA: "FI-INFRA" },
      { $set: { "aplicavelA.$[elem]": "FIP-IE" } },
      { arrayFilters: [{ "elem": "FI-INFRA" }] }
    );

    console.log(`✅ Updated ${result.modifiedCount} tax documents.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

migrate();
