const mongoose = require("mongoose");

const botSchema = new mongoose.Schema(
  {
    name: { type: String },
    photoURL: { type: String },
    model: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bot", botSchema);
