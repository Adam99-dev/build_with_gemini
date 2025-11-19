const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String,required: true ,unique: true },
  passwordHash: {type: String, required: true},
  wellnessScore: { type: Number, default: 88 },
  scores: {
    activity: { type: Number, default: 92 },
    sleep: { type: Number, default: 85 },
    stress: { type: Number, default: 79 },
    nutrition: { type: Number, default: 95 }
  },
  goals: [{ name: String, target: Number, current: Number, type: String }],
  activities: [{ metric: String, value: String, date: Date, type: String }],
  medications: [{ name: String, dosage: String, frequency: String, adherence: Number }]
});

module.exports = mongoose.model('User', userSchema);