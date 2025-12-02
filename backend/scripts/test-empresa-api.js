// scripts/test-empresa-api.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:5000/api";
let TOKEN = "";

// Cores para console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. Login
async function login() {
  log("\n=== TESTE 1: Login ===", "blue");

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@firmcapital.com", // AJUSTE AQUI seu email de admin
      senha: "Admin@123456", // AJUSTE AQUI sua senha
    });

    TOKEN = response.data.token;
    log(`✓ Login bem-sucedido!`, "green");
    log(`Token: ${TOKEN.substring(0, 50)}...`, "yellow");
    return true;
  } catch (error) {
    log(
      `✗ Erro no login: ${error.response?.data?.error || error.message}`,
      "red"
    );
    return false;
  }
}

// 2. Buscar empresa
async function getEmpresa() {
  log("\n=== TESTE 2: Buscar Empresa ===", "blue");

  try {
    const response = await axios.get(`${BASE_URL}/admin/empresa`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    log("✓ Empresa encontrada:", "green");
    console.log(JSON.stringify(response.data.data, null, 2));
    return response.data.data;
  } catch (error) {
    log(`✗ Erro: ${error.response?.data?.error || error.message}`, "red");
    return null;
  }
}

// 3. Atualizar empresa
async function updateEmpresa() {
  log("\n=== TESTE 3: Atualizar Empresa ===", "blue");

  try {
    const response = await axios.put(
      `${BASE_URL}/admin/empresa`,
      {
        nome: "Firm Capital Investimentos LTDA",
        telefone: "(51) 99999-9999",
        endereco: {
          cidade: "Porto Alegre",
          estado: "RS",
          rua: "Avenida Ipiranga",
          numero: "1234",
        },
      },
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }
    );

    log("✓ Empresa atualizada:", "green");
    console.log(JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    log(`✗ Erro: ${error.response?.data?.error || error.message}`, "red");
    return false;
  }
}

// 4. Upload de logo (TESTE SEM ARQUIVO - só estrutura)
async function testUploadStructure() {
  log("\n=== TESTE 4: Estrutura de Upload ===", "blue");

  // Criar uma imagem fake de 1x1 pixel PNG
  const fakeImageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  const formData = new FormData();
  formData.append("logo", fakeImageBuffer, "test-logo.png");
  formData.append("tipo", "claro");

  try {
    const response = await axios.post(
      `${BASE_URL}/admin/empresa/upload-logo`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );

    log("✓ Upload bem-sucedido:", "green");
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.data.path;
  } catch (error) {
    log(`✗ Erro: ${error.response?.data?.error || error.message}`, "red");
    return null;
  }
}

// 5. Atualizar cores
async function updateCores() {
  log("\n=== TESTE 5: Atualizar Cores ===", "blue");

  try {
    const response = await axios.put(
      `${BASE_URL}/admin/empresa`,
      {
        configuracoes: {
          coresPersonalizadas: {
            primaria: "#1a1a1a",
            secundaria: "#d4af37",
            fundo: "#ffffff",
          },
        },
      },
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }
    );

    log("✓ Cores atualizadas:", "green");
    console.log(
      JSON.stringify(
        response.data.data.configuracoes.coresPersonalizadas,
        null,
        2
      )
    );
    return true;
  } catch (error) {
    log(`✗ Erro: ${error.response?.data?.error || error.message}`, "red");
    return false;
  }
}

// 6. Resetar configurações
async function resetConfiguracoes() {
  log("\n=== TESTE 6: Resetar Configurações ===", "blue");

  try {
    const response = await axios.post(
      `${BASE_URL}/admin/empresa/reset`,
      {},
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }
    );

    log("✓ Configurações resetadas:", "green");
    console.log(
      JSON.stringify(
        response.data.data.configuracoes.coresPersonalizadas,
        null,
        2
      )
    );
    return true;
  } catch (error) {
    log(`✗ Erro: ${error.response?.data?.error || error.message}`, "red");
    return false;
  }
}

// 7. Deletar logo
async function deleteLogo(tipo) {
  log(`\n=== TESTE 7: Deletar Logo ${tipo} ===`, "blue");

  try {
    const response = await axios.delete(
      `${BASE_URL}/admin/empresa/logo/${tipo}`,
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }
    );

    log(`✓ Logo ${tipo} deletado`, "green");
    return true;
  } catch (error) {
    log(`✗ Erro: ${error.response?.data?.error || error.message}`, "red");
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  log("\n╔════════════════════════════════════════╗", "blue");
  log("║   TESTE DA API DE EMPRESA - BACKEND   ║", "blue");
  log("╚════════════════════════════════════════╝", "blue");

  // Login primeiro
  const loginSuccess = await login();
  if (!loginSuccess) {
    log("\n✗ Testes abortados - falha no login", "red");
    return;
  }

  // Executar testes
  await getEmpresa();
  await updateEmpresa();
  await testUploadStructure();
  await updateCores();
  await getEmpresa(); // Buscar novamente para ver mudanças
  await resetConfiguracoes();
  await deleteLogo("claro");

  log("\n╔════════════════════════════════════════╗", "green");
  log("║      TODOS OS TESTES CONCLUÍDOS!      ║", "green");
  log("╚════════════════════════════════════════╝", "green");
}

// Executar
runAllTests().catch((error) => {
  log(`\n✗ Erro fatal: ${error.message}`, "red");
  console.error(error);
});
