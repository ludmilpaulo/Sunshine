// Simulação de teste do scanner para verificar se o listener está funcionando
// Execute no console do navegador na página de teste do scanner

console.log("🧪 Teste Simulado do Scanner");
console.log("==============================");

// Simula um código de barras sendo digitado rapidamente
function simulateBarcodeScan(barcode) {
  console.log(`📷 Simulando escaneamento: ${barcode}`);
  
  // Simula eventos de teclado rápidos (como um scanner real)
  const chars = barcode.split('');
  let index = 0;
  
  function typeNextChar() {
    if (index < chars.length) {
      const char = chars[index];
      const keyEvent = new KeyboardEvent('keydown', {
        key: char,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(keyEvent);
      index++;
      setTimeout(typeNextChar, 10); // 10ms entre caracteres (simula scanner rápido)
    } else {
      // Envia Enter no final
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(enterEvent);
      console.log(`✅ Simulação completa: ${barcode}`);
    }
  }
  
  typeNextChar();
}

// Teste com código de exemplo
console.log("\n💡 Para testar, execute no console:");
console.log("simulateBarcodeScan('7898553445613');");
console.log("\nOu escaneie um código de barras real!");

// Exporta a função para uso no console
window.simulateBarcodeScan = simulateBarcodeScan;

