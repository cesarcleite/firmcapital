// Script simplificado para exportar para JSON
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const LOCAL_URI = 'mongodb://localhost:27017/simulador_fundos';
const OUTPUT_DIR = path.join(__dirname, '../exports');

const COLLECTIONS = ['users', 'clientes', 'simulacoes', 'tiposfundos', 'empresas'];

async function exportDatabase() {
  console.log('📤 Exportando banco de dados local...\n');

  try {
    // Criar diretório de output
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Conectar ao MongoDB local
    console.log('📥 Conectando ao MongoDB LOCAL...');
    const conn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Conectado\n');

    // Exportar cada collection
    for (const collectionName of COLLECTIONS) {
      console.log(`📋 Exportando: ${collectionName}`);
      
      const collections = await conn.db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) {
        console.log(`   ⚠️  Não existe, pulando...\n`);
        continue;
      }

      const collection = conn.db.collection(collectionName);
      const documents = await collection.find({}).toArray();
      
      console.log(`   📊 ${documents.length} documentos`);

      if (documents.length > 0) {
        const outputPath = path.join(OUTPUT_DIR, `${collectionName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2));
        console.log(`   ✅ Salvo em: ${outputPath}\n`);
      }
    }

    await conn.close();
    console.log(`\n🎉 Exportação concluída! Arquivos em: ${OUTPUT_DIR}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

exportDatabase();
