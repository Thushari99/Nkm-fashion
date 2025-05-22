const mongoose = require('mongoose');

const mailSettingsSchema = new mongoose.Schema({
  mailMailer: { type: String, required: true },
  mailHost: { type: String, required: true },
  mailPort: { type: Number, required: true },
  mailSenderName: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String},
  encryption: { type: String},
}, { timestamps: true });

module.exports = mongoose.model('MailSettings', mailSettingsSchema);
