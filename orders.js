const express = require('express');
const router  = express.Router();
const Order = require('./Order');

// Mapa de produto ID → link PayPal
const PAYPAL_LINKS = {
  0: process.env.PAYPAL_PENDANT,  // Anhänger
  1: process.env.PAYPAL_PYRAMID,  // Pyramide
  2: process.env.PAYPAL_KIT,      // Kit
};

// ─────────────────────────────────────────────────────────────
// POST /api/orders
// Recebe os dados do pré-checkout, salva no MongoDB
// e devolve o link PayPal do produto escolhido
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      produto,
      vorname, nachname, geburtsdatum, steuernummer,
      telefon, email,
      strasse, hausnummer, plz, stadt, bundesland, land, anmerkungen,
    } = req.body;

    // Validação básica dos campos obrigatórios
    const required = { vorname, nachname, telefon, email, strasse, hausnummer, plz, stadt, land };
    const missing  = Object.entries(required).filter(([, v]) => !v || !String(v).trim());
    if (missing.length > 0) {
      return res.status(400).json({
        ok: false,
        erro: `Campos obrigatórios em falta: ${missing.map(([k]) => k).join(', ')}`,
      });
    }

    // Validar que o produto existe
    const produtoId = Number(produto?.id);
    if (![0, 1, 2].includes(produtoId)) {
      return res.status(400).json({ ok: false, erro: 'Produto inválido.' });
    }

    const paypalUrl = PAYPAL_LINKS[produtoId];
    if (!paypalUrl) {
      return res.status(500).json({ ok: false, erro: 'Link de pagamento não configurado.' });
    }

    // Salvar pedido no MongoDB
    const order = await Order.create({
      produto,
      vorname:      String(vorname).trim(),
      nachname:     String(nachname).trim(),
      geburtsdatum: geburtsdatum || '',
      steuernummer: steuernummer || '',
      telefon:      String(telefon).trim(),
      email:        String(email).trim().toLowerCase(),
      strasse:      String(strasse).trim(),
      hausnummer:   String(hausnummer).trim(),
      plz:          String(plz).trim(),
      stadt:        String(stadt).trim(),
      bundesland:   bundesland || '',
      land:         String(land).trim(),
      anmerkungen:  anmerkungen || '',
      status:       'redirected',
      ip:           req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      userAgent:    req.headers['user-agent'] || '',
    });

    console.log(`[ORDER] Novo pedido #${order._id} — ${order.vorname} ${order.nachname} — ${produto?.nome}`);

    // Devolver o link PayPal ao frontend
    return res.status(201).json({
      ok: true,
      orderId: order._id,
      paypalUrl,
    });

  } catch (err) {
    console.error('[ORDER ERROR]', err.message);
    return res.status(500).json({ ok: false, erro: 'Erro interno. Tente novamente.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/orders  (lista todos — para painel admin simples)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ criadoEm: -1 }).lean();
    return res.json({ ok: true, total: orders.length, orders });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/orders/:id  (detalhe de um pedido)
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ ok: false, erro: 'Pedido não encontrado.' });
    return res.json({ ok: true, order });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/orders/:id/status  (marcar como pago)
// ─────────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'redirected', 'paid'].includes(status)) {
      return res.status(400).json({ ok: false, erro: 'Status inválido.' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ ok: false, erro: 'Pedido não encontrado.' });
    return res.json({ ok: true, order });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: err.message });
  }
});

module.exports = router;
