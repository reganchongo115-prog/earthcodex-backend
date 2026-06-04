const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Produto escolhido
  produto: {
    id: { type: Number, required: true },        // 0, 1 ou 2
    nome: { type: String, required: true },
    preco: { type: String, required: true },
  },

  // Dados pessoais
  vorname:    { type: String, required: true },
  nachname:   { type: String, required: true },
  geburtsdatum: { type: String, default: '' },
  steuernummer: { type: String, default: '' },

  // Contacto
  telefon:    { type: String, required: true },
  email:      { type: String, required: true },

  // Endereço de entrega
  strasse:    { type: String, required: true },
  hausnummer: { type: String, required: true },
  plz:        { type: String, required: true },
  stadt:      { type: String, required: true },
  bundesland: { type: String, default: '' },
  land:       { type: String, required: true },
  anmerkungen:{ type: String, default: '' },

  // Metadados
  status:     { type: String, enum: ['pending', 'redirected', 'paid'], default: 'pending' },
  ip:         { type: String, default: '' },
  userAgent:  { type: String, default: '' },
  criadoEm:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
