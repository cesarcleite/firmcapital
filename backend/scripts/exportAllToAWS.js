const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const LOCAL_URI = 'mongodb://localhost:27017/simulador_fundos';
const OUTPUT_DIR = 'C:/Users/cesar/OneDrive - Firm Capital/-- Firm Capital/TI/Site/Firm/exports';

async function exportAll() {
  console.log('📤 Exportando TODAS as collections do MongoDB local...\n');
  
  // Criar diretório se não existir
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const conn = await mongoose.connect(LOCAL_URI);
  console.log('✅ Conectado ao MongoDB local\n');
  
  // Listar TODAS as collections
  const collections = await conn.connection.db.listCollections().toArray();
  console.log(`🔍 Encontradas ${collections.length} collections\n`);
  
  for (const collectionInfo of collections) {
    const collectionName = collectionInfo.name;
    console.log(`📋 Exportando: ${collectionName}`);
    
    const collection = conn.connection.db.collection(collectionName);
    const data = await collection.find({}).toArray();
    
    const outputFile = path.join(OUTPUT_DIR, `${collectionName}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`   ✅ ${data.length} documentos exportados para ${outputFile}\n`);
  }
  
  await conn.connection.close();
  console.log('🎉 Export completo!');
  console.log(`📁 Arquivos salvos em: ${OUTPUT_DIR}`);
}

exportAll().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
