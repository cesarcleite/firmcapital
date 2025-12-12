/**
 * masks.js
 * Máscaras de entrada para campos brasileiros (CPF, CNPJ, Telefone, CEP)
 * Usando IMask.js para máscaras dinâmicas e inteligentes
 */

/**
 * Aplica máscara em campo CPF/CNPJ
 * Alterna automaticamente entre CPF (11 dígitos) e CNPJ (14 dígitos)
 * @param {string} elementId - ID do elemento input
 * @returns {IMask.InputMask} Instância da máscara
 */
function aplicarMascaraCpfCnpj(elementId) {
  const elemento = document.getElementById(elementId);
  if (!elemento) {
    console.warn(`Elemento ${elementId} não encontrado`);
    return null;
  }

  return IMask(elemento, {
    mask: [
      {
        mask: '000.000.000-00',
        lazy: false
      },
      {
        mask: '00.000.000/0000-00',
        lazy: false
      }
    ]
  });
}

/**
 * Aplica máscara em campo de telefone  
 * Alterna automaticamente entre telefone fixo (10 dígitos) e celular (11 dígitos)
 * @param {string} elementId - ID do elemento input
 * @returns {IMask.InputMask} Instância da máscara
 */
function aplicarMascaraTelefone(elementId) {
  const elemento = document.getElementById(elementId);
  if (!elemento) {
    console.warn(`Elemento ${elementId} não encontrado`);
    return null;
  }

  return IMask(elemento, {
    mask: [
      {
        mask: '(00) 0000-0000',
        lazy: false
      },
      {
        mask: '(00) 00000-0000',
        lazy: false
      }
    ]
  });
}

/**
 * Aplica máscara em campo de CEP
 * @param {string} elementId - ID do elemento input
 * @returns {IMask.InputMask} Instância da máscara
 */
function aplicarMascaraCep(elementId) {
  const elemento = document.getElementById(elementId);
  if (!elemento) {
    console.warn(`Elemento ${elementId} não encontrado`);
    return null;
  }

  return IMask(elemento, {
    mask: '00000-000',
    lazy: false
  });
}

/**
 * Valida CPF
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {boolean} True se CPF é válido
 */
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // CPFs com todos dígitos iguais

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;

  if (digito1 !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;

  return digito2 === parseInt(cpf.charAt(10));
}

/**
 * Valida CNPJ
 * @param {string} cnpj - CNPJ com ou sem formatação
 * @returns {boolean} True se CNPJ é válido
 */
function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // CNPJs com todos dígitos iguais

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

/**
 * Valida CPF ou CNPJ dependendo do tamanho
 * @param {string} documento - CPF ou CNPJ com ou sem formatação
 * @returns {boolean} True se documento é válido
 */
function validarCpfCnpj(documento) {
  const numeros = documento.replace(/[^\d]/g, '');
  
  if (numeros.length === 11) {
    return validarCPF(documento);
  } else if (numeros.length === 14) {
    return validarCNPJ(documento);
  }
  
  return false;
}

/**
 * Inicializa todas as máscaras em uma página
 * Busca automaticamente por IDs conhecidos e aplica as máscaras apropriadas
 */
function inicializarMascaras() {
  // CPF/CNPJ
  const idsCpfCnpj = ['novoClienteCpfCnpj', 'clienteCpfCnpj', 'cpfCnpj'];
  idsCpfCnpj.forEach(id => {
    if (document.getElementById(id)) {
      aplicarMascaraCpfCnpj(id);
      console.log(`✅ Máscara CPF/CNPJ aplicada em #${id}`);
    }
  });

  // Telefone
  const idsTelefone = ['novoClienteTelefone', 'clienteTelefone', 'telefone'];
  idsTelefone.forEach(id => {
    if (document.getElementById(id)) {
      aplicarMascaraTelefone(id);
      console.log(`✅ Máscara de telefone aplicada em #${id}`);
    }
  });

  // CEP
  const idsCep = ['novoClienteCep', 'clienteCep', 'cep'];
  idsCep.forEach(id => {
    if (document.getElementById(id)) {
      aplicarMascaraCep(id);
      console.log(`✅ Máscara de CEP aplicada em #${id}`);
    }
  });
}

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarMascaras);
} else {
  inicializarMascaras();
}
