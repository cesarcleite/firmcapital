// Migração para corrigir o índice de cpfCnpj para ser sparse
// Isso permite múltiplos documentos sem cpfCnpj (com valor vazio)

const mongoose = require('mongoose');
require('dotenv').config();

async function fixCpfCnpjIndex() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simulador_fundos');
    console.log('✓ Conectado ao MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('clientes');

    // Listar índices atuais
    const indexes = await collection.indexes();
    console.log('\nÍndices atuais:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, idx.key, idx.unique ? '(unique)' : '', idx.sparse ? '(sparse)' : '');
    });

    // Verificar se existe o índice cpfCnpj_1
    const cpfCnpjIndex = indexes.find(idx => idx.name === 'cpfCnpj_1');
    
    if (cpfCnpjIndex) {
      console.log('\n⚠️  Índice cpfCnpj_1 encontrado');
      
      // Verificar se já é sparse
      if (cpfCnpjIndex.sparse) {
        console.log('✓ O índice já é sparse, nada a fazer');
      } else {
        console.log('⚠️  O índice NÃO é sparse, recriando...');
        
        // Dropar o índice antigo
        await collection.dropIndex('cpfCnpj_1');
        console.log('✓ Índice antigo removido');
        
        // Criar novo índice sparse
        await collection.createIndex(
          { cpfCnpj: 1 },
          { unique: true, sparse: true, name: 'cpfCnpj_1' }
        );
        console.log('✓ Novo índice sparse criado');
      }
    } else {
      console.log('\n⚠️  Índice cpfCnpj_1 não encontrado, criando...');
      
      // Criar índice sparse
      await collection.createIndex(
        { cpfCnpj: 1 },
        { unique: true, sparse: true, name: 'cpfCnpj_1' }
      );
      console.log('✓ Índice sparse criado');
    }

    // Listar índices após a migração
    const newIndexes = await collection.indexes();
    console.log('\nÍndices após migração:');
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, idx.key, idx.unique ? '(unique)' : '', idx.sparse ? '(sparse)' : '');
    });

    console.log('\n✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Conexão fechada');
    process.exit(0);
  }
}

// Executar migração
fixCpfCnpjIndex();
