const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Sign a JWT for a user */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** POST /api/auth/register */
async function register(req, res, next) {
  try {
    const { username, password, fullName, role } = req.body;

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const user = await User.create({ username, password, fullName, role });
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    // Explicitly select password (it is select:false on the schema)
    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me  (protected) */
async function getMe(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      fullName: req.user.fullName,
      role: req.user.role,
    },
  });
}

module.exports = { register, login, getMe };
