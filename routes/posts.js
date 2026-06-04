const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content cannot be empty' });
    }

    const post = await Post.create({
      content: content.trim(),
      author: req.user._id
    });

    // Populate author before returning
    const populatedPost = await Post.findById(post._id).populate('author', 'username bio followers following');

    res.status(201).json({
      success: true,
      post: populatedPost
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get all posts (Global Feed)
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username bio followers following')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts
    });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get posts by user
// @route   GET /api/posts/user/:username
// @access  Public
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const posts = await Post.find({ author: user._id })
      .populate('author', 'username bio followers following')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      posts
    });
  } catch (err) {
    console.error('Get user posts error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Toggle like on a post
// @route   PUT /api/posts/:id/like
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if post already liked by this user
    const likeIndex = post.likes.indexOf(req.user._id);

    let isLiked = false;
    if (likeIndex > -1) {
      // Unlike it
      post.likes.splice(likeIndex, 1);
    } else {
      // Like it
      post.likes.push(req.user._id);
      isLiked = true;
    }

    await post.save();

    res.status(200).json({
      success: true,
      likes: post.likes,
      liked: isLiked
    });
  } catch (err) {
    console.error('Like post error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Create a comment on a post
// @route   POST /api/posts/:id/comments
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      content: content.trim(),
      post: post._id,
      author: req.user._id
    });

    const populatedComment = await Comment.findById(comment._id).populate('author', 'username bio');

    res.status(201).json({
      success: true,
      comment: populatedComment
    });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'username bio')
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({
      success: true,
      comments
    });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Verify ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    // Delete post comments
    await Comment.deleteMany({ post: post._id });

    // Delete post itself
    await Post.deleteOne({ _id: post._id });

    res.status(200).json({ success: true, message: 'Post and comments deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
