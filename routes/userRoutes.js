// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import User model
const { protect, authorize } = require('../middleware/auth'); // Import authentication and authorization middleware

/**
 * @route GET /api/users
 * @description Get all users (Admin/SuperAdmin only)
 * @access Private/Admin
 */
router.get('/', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
  try {
    // Fetch all users, excluding their passwords
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/users/:id
 * @description Get a single user by ID (Admin/SuperAdmin or self)
 * @access Private/Admin
 */
router.get('/:id', protect, async (req, res) => {
  try {
    // Find user by ID, exclude password
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow access if user is Admin/SuperAdmin or if they are requesting their own profile
    if (req.user.role === 'Admin' || req.user.role === 'SuperAdmin' || req.user._id.toString() === user._id.toString()) {
      res.status(200).json(user);
    } else {
      res.status(403).json({ message: 'Not authorized to view this user profile' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route PUT /api/users/:id
 * @description Update a user by ID (Admin/SuperAdmin or self)
 * @access Private/Admin
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, email, role } = req.body; // Password updates should be handled separately

    // Find the user by ID
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Authorization check: Admin/SuperAdmin can update any user; Member can only update their own profile
    if (req.user.role === 'Admin' || req.user.role === 'SuperAdmin' || req.user._id.toString() === user._id.toString()) {
      user.name = name || user.name;
      user.email = email || user.email;

      // Only Admin/SuperAdmin can change roles
      if ((req.user.role === 'Admin' || req.user.role === 'SuperAdmin') && role) {
        user.role = role;
      } else if (role && (req.user.role === 'Member')) {
        return res.status(403).json({ message: 'Members are not authorized to change roles' });
      }

      const updatedUser = await user.save(); // Save the updated user

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      });
    } else {
      res.status(403).json({ message: 'Not authorized to update this user' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/users/:id
 * @description Delete a user by ID (Admin/SuperAdmin only)
 * @access Private/Admin
 */
router.delete('/:id', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of self if you are the last Admin or if trying to delete SuperAdmin
    // (Add more robust logic for production to prevent locking out all admins)
    if (req.user._id.toString() === user._id.toString()) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await User.deleteOne({ _id: req.params.id }); // Use deleteOne for Mongoose 6+
    res.status(200).json({ message: 'User removed' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
