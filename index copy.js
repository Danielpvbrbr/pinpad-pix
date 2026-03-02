const { SerialPort } = require('serialport');

const port = new SerialPort({
  path: 'COM3', 
  baudRate: 19200, 
});

// Função para calcular o LRC (XOR de todos os bytes após o STX até o ETX inclusive)
function calcularLRC(buffer) {
  let lrc = 0;
  for (let i = 1; i < buffer.length; i++) {
    lrc ^= buffer[i];
  }
  return lrc;
}

// Função para montar o comando no padrão ABECS
function montarComando(cmd) {
  const STX = 0x02;
  const ETX = 0x03;
  const dados = Buffer.from(cmd);
  const bufferSemLRC = Buffer.concat([Buffer.from([STX]), dados, Buffer.from([ETX])]);
  const lrc = calcularLRC(bufferSemLRC);
  return Buffer.concat([bufferSemLRC, Buffer.from([lrc])]);
}

port.on('open', () => {
  console.log('✅ Conectado ao Pinpad.');
  
  // Tenta fechar qualquer sessão anterior primeiro (Boa prática)
  const fechar = montarComando('CLO000'); 
  port.write(fechar);

  setTimeout(() => {
    // Agora pede as informações do hardware
    const getInfo = montarComando('GIX000');
    console.log('Enviando GIX000...');
    port.write(getInfo);
  }, 500); // Pequeno delay para o pinpad processar o fechamento
});
// Escuta a resposta do Pinpad
port.on('data', (data) => {
  console.log('📥 Resposta (Buffer):', data);
  console.log('📥 Resposta (String):', data.toString());

  // O Pinpad costuma responder 0x06 (ACK) se entendeu o comando
  if (data[0] === 0x06) {
    console.log('👍 Pinpad confirmou o recebimento (ACK)');
  }
});

port.on('error', (err) => {
  console.error('❌ Erro:', err.message);
});