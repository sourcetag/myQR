'use strict'
const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
  title: String,
  text: String,
  description: String,
  png: String,
  favorite: Boolean,
  created: Date,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

module.exports = mongoose.model('Code', codeSchema);