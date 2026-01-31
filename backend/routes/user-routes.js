const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, requireVerified } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `SELECT 
        id, username, email, bio, profile_image_url, created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = $1 AND is_public = TRUE) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    // Remove email from public profile
    delete user.email;

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile', message: error.message });
  }
});

// Get current user's own profile
router.get('/me/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        id, username, email, phone, bio, profile_image_url, is_verified, created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = $1) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count
       FROM users
       WHERE id = $1`,
      [userId]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get own profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

// Update user profile
router.put(
  '/me/profile',
  authenticateToken,
  [
    body('username').optional().trim().isLength({ min: 3, max: 50 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('profileImageUrl').optional().trim().isURL(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.id;
      const { username, bio, profileImageUrl } = req.body;

      // Build update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (username !== undefined) {
        // Check if username is already taken
        const usernameCheck = await db.query(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [username, userId]
        );
        if (usernameCheck.rows.length > 0) {
          return res.status(400).json({ error: 'Username already taken' });
        }
        updates.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
      }

      if (bio !== undefined) {
        updates.push(`bio = $${paramCount}`);
        values.push(bio);
        paramCount++;
      }

      if (profileImageUrl !== undefined) {
        updates.push(`profile_image_url = $${paramCount}`);
        values.push(profileImageUrl);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(userId);

      const result = await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} 
         RETURNING id, username, email, bio, profile_image_url, is_verified, created_at`,
        values
      );

      res.json({
        message: 'Profile updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile', message: error.message });
    }
  }
);

// Follow/Unfollow user
router.post('/:userId/follow', authenticateToken, requireVerified, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if target user exists
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const followCheck = await db.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [currentUserId, userId]
    );

    if (followCheck.rows.length > 0) {
      // Unfollow
      await db.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [currentUserId, userId]
      );
      res.json({ message: 'Unfollowed successfully', following: false });
    } else {
      // Follow
      await db.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
        [currentUserId, userId]
      );
      res.json({ message: 'Followed successfully', following: true });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow/unfollow user', message: error.message });
  }
});

// Get user's followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT 
        u.id, u.username, u.profile_image_url, u.bio,
        f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      followers: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to fetch followers', message: error.message });
  }
});

// Get users that a user is following
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT 
        u.id, u.username, u.profile_image_url, u.bio,
        f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      following: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to fetch following', message: error.message });
  }
});

module.exports = router;