const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Create JWT token
function createToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'supersecret',
    { expiresIn: '7d' }
  );
}

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    if (role && !['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Allowed: patient, doctor, admin' });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'patient'
    });

    await user.save();

    const token = createToken(user);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(user);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LIST USERS (Admin only)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  res.json(req.user);
};

// UPDATE USER (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.password; // prevent password update here

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
