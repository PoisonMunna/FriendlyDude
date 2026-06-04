const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Get all users (excluding password)
// @route   GET /api/users
// @access  Public
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get user profile details by username
// @route   GET /api/users/profile/:username
// @access  Public
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username bio')
      .populate('following', 'username bio');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Update user profile bio
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { bio } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.bio = bio !== undefined ? bio.trim() : user.bio;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile bio updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        followers: user.followers,
        following: user.following
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Follow/Unfollow user by ID
// @route   PUT /api/users/follow/:id
// @access  Private
router.put('/follow/:id', protect, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if current user is already following the target user
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow: remove from lists
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());
    } else {
      // Follow: add to lists
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      following: currentUser.following,
      followersCount: targetUser.followers.length,
      isFollowing: !isFollowing
    });
  } catch (err) {
    console.error('Follow/unfollow error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
