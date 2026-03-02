const { SerialPort } = require('serialport');

// Ajuste a porta COM conforme o seu C# identificou
const port = new SerialPort({
  path: 'COM3', 
  baudRate: 115200, 
});

function calcularLRC(buffer) {
  let lrc = 0;
  for (let i = 1; i < buffer.length; i++) lrc ^= buffer[i];
  return lrc;
}

function montarComando(cmd) {
  const STX = 0x02;
  const ETX = 0x03;
  const bufferSemLRC = Buffer.concat([Buffer.from([STX]), Buffer.from(cmd), Buffer.from([ETX])]);
  return Buffer.concat([bufferSemLRC, Buffer.from([calcularLRC(bufferSemLRC)])]);
}

// ---------------------------------------------------------
// FUNÇÃO MÁGICA: Monta o comando de QR Code do Gertec
// ---------------------------------------------------------
function criarComandoQRCode(pixCopiaECola) {
  const timeout = "060"; // Tempo que o QR Code vai ficar na tela (em segundos)
  const tipoLinha = "1"; // 1 = Mostra um título em cima do QR, 0 = Sem título
  const titulo = "PAGUE COM PIX"; 
  
  // O Pinpad exige que os tamanhos tenham zeros à esquerda
  // Exemplo: um título de 13 letras tem que ser enviado como "013"
  const tamTitulo = titulo.length.toString().padStart(2, '0');
  
  // O Copia e Cola do Pix tem que ter 4 dígitos de tamanho (ex: "0234")
  const tamPix = pixCopiaECola.length.toString().padStart(4, '0');

  // Concatena tudo no padrão: QR01 + Timeout + TipoLinha + TamanhoTitulo + TamanhoPix + Titulo + Pix
  return `QR01${timeout}${tipoLinha}${tamTitulo}${tamPix}${titulo}${pixCopiaECola}`;
}

port.on('open', () => {
  console.log('✅ Conectado! Enviando QR Code para a tela...');
  
  // AQUI VOCÊ COLOCA O RETORNO 
  const copiaEColaUnicred = "00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5915NOME DO VENDEDOR6009SAO PAULO62070503***6304A1B2";
  
  const payloadString = criarComandoQRCode(copiaEColaUnicred);
  console.log('Enviando Payload:', payloadString);
  
  const comandoFinal = montarComando(payloadString);
  port.write(comandoFinal);
});

port.on('data', (data) => {
  if (data[0] === 0x06) return; // Ignora o ACK no console para ficar limpo

  // Lê a resposta final do Pinpad
  const resposta = data.toString().replace(/[\x02\x03]/g, '').trim();
  console.log(`Resposta do Pinpad: ${resposta}`);
});