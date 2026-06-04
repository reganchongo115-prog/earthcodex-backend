require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

// ALTERADO: agora o ficheiro está na raiz
const ordersRouter = require('./orders');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ──────────────────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de cada request
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Rotas ────────────────────────────────────────────────────
app.use('/api/orders', ordersRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── MongoDB ──────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(`✅ MongoDB conectado: ${process.env.MONGODB_URI}`);

    app.listen(PORT, () => {
      console.log(`🚀 Earth Codex Backend rodando em http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   Orders: http://localhost:${PORT}/api/orders`);
    });
  })
  .catch(err => {
    console.error('❌ Erro ao conectar MongoDB:', err.message);
    process.exit(1);
  });