const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const axios = require('axios'); // COLA NO TOPO DO ARQUIVO COM OS OUTROS REQUIRES


const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
// TIRA O express.static daqui


// ================== ARQUIVOS ==================
const USERS_FILE = path.join(__dirname, 'users.json');
const KEY_FILE = path.join(__dirname, 'key.json');
const JOGOS_SHARE_FILE = path.join(__dirname, 'jogos_share.json');
const LIKES_FILE = path.join(__dirname, 'like.json');

if (!fs.existsSync(LIKES_FILE)) {
  fs.writeFileSync(LIKES_FILE, '{}');
}

function loadLikes() {
  try {
    return JSON.parse(fs.readFileSync(LIKES_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}
function saveLikes(data) {
  fs.writeFileSync(LIKES_FILE, JSON.stringify(data, null, 2));
}
const JOGOS_FILE = path.join(__dirname, 'jogos.json');

// ================== CRIAR ARQUIVOS ==================
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '[]');
}
if (!fs.existsSync(KEY_FILE)) {
  fs.writeFileSync(KEY_FILE, '{}');
}
if (!fs.existsSync(JOGOS_FILE)) {
  fs.writeFileSync(JOGOS_FILE, '[]');
}
if (!fs.existsSync(JOGOS_SHARE_FILE)) {
  fs.writeFileSync(JOGOS_SHARE_FILE, '{}');
}

// ================== FUNÇÕES USERS ==================
function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    console.log("Erro ao ler users.json");
    return [];
  }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ================== FUNÇÕES JOGOS ==================
function loadJogos() {
  try {
    return JSON.parse(fs.readFileSync(JOGOS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}
function saveJogos(jogos) {
  fs.writeFileSync(JOGOS_FILE, JSON.stringify(jogos, null, 2));
}
function loadJogosShare() {
  try {
    return JSON.parse(fs.readFileSync(JOGOS_SHARE_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}
function saveJogosShare(jogos) {
  fs.writeFileSync(JOGOS_SHARE_FILE, JSON.stringify(jogos, null, 2));
}






// ================== FUNÇÕES KEYS ==================

// Ler keys
function loadKeys() {

  try {

    if (!fs.existsSync(KEY_FILE)) {

      fs.writeFileSync(KEY_FILE, '{}');

    }

    const data = fs.readFileSync(KEY_FILE, 'utf8');

    return JSON.parse(data || '{}');

  } catch (e) {

    console.log("ERRO KEY.JSON:", e);

    return {};
  }
}

// Salvar keys
function saveKeys(keys) {

  fs.writeFileSync(
    KEY_FILE,
    JSON.stringify(keys, null, 2)
  );

}

// ===========

// ================== ROTAS ==================

// STATUS API
app.get('/api/status', (req, res) => {

  res.json({
    online: true,
    users: loadUsers().length,
    keys: loadKeys().length,
    servidor: "JulsonGames"
  });

});

// Logs de hoje - pra mostrar nomes embaixo
app.get('/api/logs/hoje', (req, res) => {
  const logs = loadLogs();
  const hoje = new Date().toLocaleDateString('pt-MZ');
  
  const logsHoje = logs.filter(log => log.dia === hoje);
  res.json(logsHoje);
});


// ================== REGISTRO ==================
app.post('/api/register', (req, res) => {

  const { nome, email, telefone, senha } = req.body;

  if (!nome || !email || !senha) {

    return res.json({
      success: false,
      message: "Preencha todos campos!"
    });

  }

  let users = loadUsers();

  const existe = users.find(
    u =>
      u.nome.toLowerCase() === nome.toLowerCase() ||
      u.email.toLowerCase() === email.toLowerCase()
  );

  if (existe) {

    return res.json({
      success: false,
      message: "Nome ou email já existe!"
    });

  }

  const novoUsuario = {
    id: Date.now(),
    nome,
    email,
    telefone,
    senha,
    saldo: 0,
    data: new Date().toLocaleString('pt-MZ'),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || "Desconhecido"
  };

  users.push(novoUsuario);

  saveUsers(users);

  res.json({
    success: true,
    message: "Conta criada com sucesso!"
  });

});







// ================== ROTAS JOGOS CRUD ==================

// Listar todos jogos
app.get('/api/jogos', (req, res) => {
  const jogos = loadJogos();
  res.json(jogos);
});

// Adicionar jogo
app.post('/api/jogos/add', (req, res) => {
  const jogo = req.body;
  const jogos = loadJogos();
  jogos.push(jogo);
  saveJogos(jogos);
  logAtividade('add-jogo', jogo.nome);
  res.json({success: true, message: 'Jogo adicionado!'});
});

// Apagar jogo pelo índice
app.delete('/api/jogos/del/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const jogos = loadJogos();
  if(index >= 0 && index < jogos.length){
    jogos.splice(index, 1);
    saveJogos(jogos);
    res.json({success: true});
  } else {
    res.json({success: false, message: 'Índice inválido'});
  }
});




// ================== LOGIN ==================
app.post('/api/login', (req, res) => {

  const { nome, senha } = req.body;

  if (!nome || !senha) {

    return res.json({
      success: false,
      message: "Digite nome e senha!"
    });

  }

  const users = loadUsers();

  const user = users.find(
    u =>
      u.nome === nome &&
      u.senha === senha
  );

  if (user) {
logAtividade('login', nome);

    res.json({
      success: true,
      message: "Login feito!",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        saldo: user.saldo || 0
      }
    });

  } else {

    res.json({
      success: false,
      message: "Nome ou senha incorretos!"
    });

  }

});

 // ======================
// Limpar logs - só admin
app.post('/api/logs/limpar', (req, res) => {
  saveLogs([]);
  res.json({ success: true });
});



// ================== ARQUIVO LOGS ==================
const LOGS_FILE = path.join(__dirname, 'logs.json');

if (!fs.existsSync(LOGS_FILE)) {
  fs.writeFileSync(LOGS_FILE, '[]');
}

function loadLogs() {
  try {
    return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveLogs(logs) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
}

function logAtividade(tipo, user) {
  const logs = loadLogs();
  logs.push({
    tipo: tipo, // 'visita', 'login', 'compra', 'share'
    user: user || 'anonimo',
    dia: new Date().toLocaleDateString('pt-MZ'),
    hora: new Date().toLocaleTimeString('pt-MZ'),
    diaSemana: new Date().getDay() // 0=Dom, 1=Seg... 6=Sab
  });
  saveLogs(logs);
}

// ================== ROTAS LOGS ==================

// Registrar atividade
app.post('/api/log', (req, res) => {
  const { tipo, user } = req.body;
  logAtividade(tipo, user);
  res.json({ success: true });
});

// Stats da semana Seg-Sex
app.get('/api/stats/semana', (req, res) => {
  const logs = loadLogs();
  const stats = [0,0,0,0,0,0,0]; // Dom=0 até Sab=6

  logs.forEach(log => {
    stats[log.diaSemana]++;
  });

  // Só segunda a sexta
  res.json({
    seg: stats[1],
    ter: stats[2],
    qua: stats[3],
    qui: stats[4],
    sex: stats[5]
  });
});

// Limpar logs - admin
app.post('/api/logs/limpar', (req, res) => {
  saveLogs([]);
  res.json({ success: true });
});



// ================== PERFIL ==================
app.get('/api/perfil/:nome', (req, res) => {

  const nome = req.params.nome;

  const users = loadUsers();

  const user = users.find(
    u => u.nome === nome
  );

  if (!user) {

    return res.json({
      success: false,
      message: "Usuário não encontrado!"
    });

  }

  res.json({
    success: true,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      telefone: user.telefone,
      saldo: user.saldo || 0,
      data: user.data
    }
  });

});

// ================== USAR KEY ==================
app.post('/api/usar-key', (req, res) => {

  const { key, nome } = req.body;

  if (!key || !nome) {

    return res.json({
      success: false,
      message: "Key inválida!"
    });

  }

  let keys = loadKeys();
  let users = loadUsers();

  // KEY.JSON ESTÁ EM OBJETO
  // EX:
  // {
  //   "ABC123": "20"
  // }

  if (!keys[key]) {

    return res.json({
      success: false,
      message: "Key inexistente!"
    });

  }

  const valor = Number(keys[key]);

  const userIndex = users.findIndex(
    u => u.nome === nome
  );

  if (userIndex === -1) {

    return res.json({
      success: false,
      message: "Usuário não encontrado!"
    });

  }

  // Criar saldo se não existir
  if (!users[userIndex].saldo) {

    users[userIndex].saldo = 0;

  }

  // Adicionar saldo
  users[userIndex].saldo += valor;

  // APAGAR KEY AUTOMATICAMENTE
  delete keys[key];

  // Salvar tudo
  saveUsers(users);
  saveKeys(keys);

  res.json({
    success: true,
    valor: valor,
    saldo: users[userIndex].saldo
  });

});

// ================== COMPRAR ==================
app.post('/api/comprar', (req, res) => {

  const { nome, valor } = req.body;

  if (!nome || !valor) {

    return res.json({
      success: false,
      message: "Dados inválidos!"
    });

  }

  let users = loadUsers();

  const userIndex = users.findIndex(
    u => u.nome === nome
  );

  if (userIndex === -1) {

    return res.json({
      success: false,
      message: "Usuário não encontrado!"
    });

  }

  // Garantir saldo
  if (!users[userIndex].saldo) {
    users[userIndex].saldo = 0;
  }

  // Verificar saldo
  if (users[userIndex].saldo < valor) {

    return res.json({
      success: false,
      message: "Saldo insuficiente!"
    });

  }

  // Remover saldo
  users[userIndex].saldo -= Number(valor);

  saveUsers(users);

  res.json({
    success: true,
    saldo: users[userIndex].saldo
  });

});

// ================== ADICIONAR SALDO ==================
app.post('/api/add-saldo', (req, res) => {

  const { nome, valor } = req.body;

  if (!nome || valor === undefined) {

    return res.json({
      success: false,
      message: "Dados inválidos!"
    });

  }

  let users = loadUsers();

  const userIndex = users.findIndex(
    u => u.nome === nome
  );

  if (userIndex === -1) {

    return res.json({
      success: false,
      message: "Usuário não encontrado!"
    });

  }

  // Garantir saldo
  if (!users[userIndex].saldo) {

    users[userIndex].saldo = 0;

  }

  // ADICIONAR SALDO
  users[userIndex].saldo += Number(valor);

  // Evitar bugs números negativos
  if (users[userIndex].saldo < 0) {

    users[userIndex].saldo = 0;

  }

  // Salvar
  saveUsers(users);

  res.json({
    success: true,
    saldo: users[userIndex].saldo
  });

});




// ================== ROTAS SHARE ==================
// GET dados do jogo - pra saber quantas vezes o user já compartilhou
app.get('/api/jogo/:id', (req, res) => {
  const id = req.params.id;
  const user = req.query.user;
  const jogosShare = loadJogosShare();

  if(!jogosShare[id]){
    jogosShare[id] = { shares: {} };
    saveJogosShare(jogosShare);
  }

  res.json({
    shareCount: jogosShare[id].shares[user] || 0
  });
});

// POST compartilhar - adiciona +1 share
app.post('/api/share', (req, res) => {
  const { userId, jogoId } = req.body;
  const jogosShare = loadJogosShare();

  if(!jogosShare[jogoId]){
    jogosShare[jogoId] = { shares: {} };
  }

  if(!jogosShare[jogoId].shares[userId]) jogosShare[jogoId].shares[userId] = 0;
  jogosShare[jogoId].shares[userId]++;

  saveJogosShare(jogosShare);
  res.json({ count: jogosShare[jogoId].shares[userId] });
});




// POST /api/voto - salva like/dislike
app.post('/api/voto', (req, res) => {
  const { userId, jogoId, tipo } = req.body;
  const likes = loadLikes();

  if(!likes[jogoId]) likes[jogoId] = { likes: 0, dislikes: 0, votos: {} };

  const votoAnt = likes[jogoId].votos[userId];

  if(votoAnt === 'like') likes[jogoId].likes--;
  if(votoAnt === 'dislike') likes[jogoId].dislikes--;

  if(votoAnt === tipo){
    delete likes[jogoId].votos[userId];
  } else {
    likes[jogoId].votos[userId] = tipo;
    if(tipo === 'like') likes[jogoId].likes++;
    if(tipo === 'dislike') likes[jogoId].dislikes++;
  }

  saveLikes(likes);
  res.json({
    likes: likes[jogoId].likes,
    dislikes: likes[jogoId].dislikes,
    meuVoto: likes[jogoId].votos[userId] || null
  });
});

// GET /api/votos/:jogoId - busca votos do jogo
app.get('/api/votos/:jogoId', (req, res) => {
  const { jogoId } = req.params;
  const user = req.query.user;
  const likes = loadLikes();

  if(!likes[jogoId]) likes[jogoId] = { likes: 0, dislikes: 0, votos: {} };

  res.json({
    likes: likes[jogoId].likes,
    dislikes: likes[jogoId].dislikes,
    meuVoto: likes[jogoId].votos[user] || null
  });
});







// ================== LISTAR USERS ==================
app.get('/api/users', (req, res) => {

  const users = loadUsers();

  res.json(users);

});

// ================== LISTAR KEYS ==================
app.get('/api/keys', (req, res) => {

  const keys = loadKeys();

  res.json(keys);

});

// GERAR KEY ADM - só quem souber a senha JULSON2010
app.post('/api/gerar-key-adm', (req, res) => {
  const { senha, valor } = req.body;

  if(senha !== "JULSON2010"){
    return res.json({ success: false, message: "Senha ADM incorreta!" });
  }

  if(!valor || valor < 50 || valor > 10000){
    return res.json({ success: false, message: "Valor deve ser entre 50 e 10000 MZN" });
  }

  // Gera key JULSON + 8 chars
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for(let i = 0; i < 8; i++){
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const novaKey = `JULSON${codigo}`;

  // Salva no key.json
  let keys = loadKeys();
  keys[novaKey] = String(valor);
  saveKeys(keys);

  res.json({ 
    success: true, 
    key: novaKey,
    valor: valor,
    message: `Key de ${valor} MZN criada com sucesso!`
  });
});

//==========================================================


// ================== START ==================

app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JULSON GAMES SERVER ONLINE`);
  console.log(`⚡ Porta: ${PORT}`);
  console.log(`📂 Banco USERS: users.json`);
  console.log(`🔑 Banco KEYS: key.json`);
});