/**
 * One-time script: creates the admin user if it doesn't exist yet.
 * Run with:  node src/scripts/seedAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN = {
  username: 'admin',
  password: 'admin1234',   // change this after first login
  fullName: 'Administrator',
  role: 'admin',
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const exists = await User.findOne({ username: ADMIN.username });
  if (exists) {
    console.log('Admin user already exists — skipping.');
    process.exit(0);
  }

  await User.create(ADMIN);
  console.log(`Admin created → username: ${ADMIN.username}  password: ${ADMIN.password}`);
  console.log('⚠️  Change the password after your first login!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
