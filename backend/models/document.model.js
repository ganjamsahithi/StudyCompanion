const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema({
  fileName: { type: String, required: true },
  filePath: { type: String, required: true }, // Path where the file is stored locally
  fileMimeType: { type: String, required: true },
  uploadedDate: { type: Date, default: Date.now },
  summary: { type: String, default: null }, // To store the AI-generated summary
  userId: { type: String, required: true }, // Important for multi-user support
}, {
  timestamps: true,
});

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
