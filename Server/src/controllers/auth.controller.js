const User = require('../DB/User.schema.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'greenseva_secret_key_2026';

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ err: true, message: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ err: true, message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'user',
      greenPoints: 250, // Welcome bonus!
    });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      err: false,
      message: 'User registered successfully! Welcome bonus +250 Green Points credited.',
      token,
      user: userObj,
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ err: true, message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ err: true, message: 'User does not exist with this email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ err: true, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      err: false,
      message: 'Login successful',
      token,
      user: userObj,
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ err: true, message: 'User not found' });
    }
    return res.status(200).json({ err: false, user });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({ err: false, message: 'Logged out successfully' });
};

module.exports = { register, login, getMe, logout };