const mongoose = require("mongoose");

const botSchema = new mongoose.Schema({
  name: { type: String },
  photoURL: { type: String },
  model: { type: String },
});

module.exports = mongoose.model("Bot", botSchema);
