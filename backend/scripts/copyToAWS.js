// Script para copiar MongoDB local para AWS
const mongoose = require('mongoose');

// Conexões
const LOCAL_URI = 'mongodb://localhost:27017/firmcapital';
const AWS_URI = 'mongodb://firmcapital_user:doidomongoDB*@54.172.212.199:27017/firmcapital?authSource=firmcapital';

// Collections para copiar
const COLLECTIONS = ['users', 'clientes', 'simulacoes', 'tiposfundos', 'empresas'];

async function copyDatabase() {
  console.log('🔄 Iniciando cópia do banco de dados...\n');

  try {
    // Conectar ao MongoDB local
    console.log('📥 Conectando ao MongoDB LOCAL...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Conectado ao LOCAL\n');

    // Conectar ao MongoDB AWS
    console.log('📤 Conectando ao MongoDB AWS...');
    const awsConn = await mongoose.createConnection(AWS_URI).asPromise();
    console.log('✅ Conectado ao AWS\n');

    // Copiar cada collection
    for (const collectionName of COLLECTIONS) {
      console.log(`📋 Copiando collection: ${collectionName}`);
      
      // Verificar se collection existe no local
      const collections = await localConn.db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) {
        console.log(`   ⚠️  Collection ${collectionName} não existe no local, pulando...\n`);
        continue;
      }

      // Buscar documentos do local
      const localCollection = localConn.db.collection(collectionName);
      const documents = await localCollection.find({}).toArray();
      
      console.log(`   📊 Encontrados ${documents.length} documentos`);

      if (documents.length > 0) {
        // Limpar collection na AWS (opcional - comente se quiser manter dados existentes)
        const awsCollection = awsConn.db.collection(collectionName);
        await awsCollection.deleteMany({});
        console.log(`   🗑️  Collection limpa na AWS`);

        // Inserir documentos na AWS
        await awsCollection.insertMany(documents);
        console.log(`   ✅ ${documents.length} documentos copiados!\n`);
      } else {
        console.log(`   ℹ️  Nenhum documento para copiar\n`);
      }
    }

    console.log('🎉 Migração concluída com sucesso!');

    // Fechar conexões
    await localConn.close();
    await awsConn.close();

    console.log('\n✅ Banco de dados copiado completamente!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao copiar banco de dados:', error);
    process.exit(1);
  }
}

copyDatabase();
