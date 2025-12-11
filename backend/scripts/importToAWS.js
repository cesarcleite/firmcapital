const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const AWS_URI = 'mongodb://firmcapital_user:doidomongoDB*@localhost:27017/firmcapital?authSource=firmcapital';
const INPUT_DIR = '/tmp/exports';

async function importData() {
  console.log('📥 Importando dados para AWS MongoDB...\n');
  
  const conn = await mongoose.createConnection(AWS_URI).asPromise();
  console.log('✅ Conectado ao MongoDB AWS\n');

  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const collectionName = file.replace('.json', '');
    console.log(`📋 Importando: ${collectionName}`);
    
    const data = JSON.parse(fs.readFileSync(path.join(INPUT_DIR, file)));
    const collection = conn.db.collection(collectionName);
    
    // Limpar collection existente
    await collection.deleteMany({});
    
    // Inserir novos dados PRESERVANDO _id originais
    if (data.length > 0) {
      // Converter _id strings para ObjectId
      const dataWithObjectIds = data.map(doc => {
        if (doc._id && typeof doc._id === 'string') {
          doc._id = new mongoose.Types.ObjectId(doc._id);
        }
        // Converter ObjectIds de referências também
        if (doc.empresa && typeof doc.empresa === 'string') {
          doc.empresa = new mongoose.Types.ObjectId(doc.empresa);
        }
        if (doc.criadoPor && typeof doc.criadoPor === 'string') {
          doc.criadoPor = new mongoose.Types.ObjectId(doc.criadoPor);
        }
        if (doc.resonsavel && typeof doc.resonsavel === 'string') {
          doc.resonsavel = new mongoose.Types.ObjectId(doc.resonsavel);
        }
        return doc;
      });
      
      await collection.insertMany(dataWithObjectIds);
      console.log(`   ✅ ${data.length} documentos importados\n`);
    } else {
      console.log(`   ℹ️  Nenhum documento\n`);
    }
  }
  
  await conn.close();
  console.log('🎉 Importação concluída com sucesso!');
}

importData().catch(err => { 
  console.error('❌ Erro:', err); 
  process.exit(1); 
});
