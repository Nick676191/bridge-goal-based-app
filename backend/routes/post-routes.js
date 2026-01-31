const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, requireVerified } = require('../middleware/auth');

const router = express.Router();

// Get trending posts (homepage feed)
router.get('/trending', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    // Trending algorithm: combines recency and engagement
    // Posts from last 7 days, sorted by engagement score and recency
    const result = await db.query(
      `SELECT 
        p.id, p.title, p.description, p.plan, p.deadline, p.category,
        p.engagement_score, p.created_at, p.updated_at,
        u.id as user_id, u.username, u.profile_image_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.is_public = TRUE
         AND p.created_at > NOW() - INTERVAL '7 days'
       ORDER BY 
         p.engagement_score DESC,
         p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      posts: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ error: 'Failed to fetch trending posts', message: error.message });
  }
});

// Get all posts (explore page)
router.get('/explore', async (req, res) => {
  try {
    const { limit = 20, offset = 0, category, search } = req.query;

    let query = `
      SELECT 
        p.id, p.title, p.description, p.plan, p.deadline, p.category,
        p.engagement_score, p.created_at, p.updated_at,
        u.id as user_id, u.username, u.profile_image_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_public = TRUE
    `;

    const params = [];
    let paramCount = 1;

    // Filter by category
    if (category) {
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Search by title or description
    if (search) {
      query += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      posts: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get explore posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts', message: error.message });
  }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        p.id, p.title, p.description, p.plan, p.deadline, p.category,
        p.engagement_score, p.created_at, p.updated_at, p.is_public,
        u.id as user_id, u.username, u.profile_image_url, u.bio,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get milestones for this post
    const milestonesResult = await db.query(
      `SELECT id, title, description, deadline, is_completed, completed_at, created_at
       FROM milestones
       WHERE post_id = $1
       ORDER BY deadline ASC`,
      [id]
    );

    const post = {
      ...result.rows[0],
      milestones: milestonesResult.rows,
    };

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post', message: error.message });
  }
});

// Create new post (requires authentication and verification)
router.post(
  '/',
  authenticateToken,
  requireVerified,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
    body('plan').trim().isLength({ min: 1 }).withMessage('Plan is required'),
    body('deadline').optional().isISO8601().withMessage('Invalid deadline date'),
    body('category').optional().trim().isLength({ max: 50 }),
    body('isPublic').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, plan, deadline, category, isPublic = true } = req.body;
      const userId = req.user.id;

      // Insert post
      const result = await db.query(
        `INSERT INTO posts (user_id, title, description, plan, deadline, category, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, title, description, plan, deadline || null, category || null, isPublic]
      );

      const newPost = result.rows[0];

      res.status(201).json({
        message: 'Post created successfully',
        post: newPost,
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: 'Failed to create post', message: error.message });
    }
  }
);

// Update post (only by owner)
router.put(
  '/:id',
  authenticateToken,
  requireVerified,
  [
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ min: 1 }),
    body('plan').optional().trim().isLength({ min: 1 }),
    body('deadline').optional().isISO8601(),
    body('category').optional().trim().isLength({ max: 50 }),
    body('isPublic').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if post exists and belongs to user
      const postCheck = await db.query(
        'SELECT user_id FROM posts WHERE id = $1',
        [id]
      );

      if (postCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (postCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to edit this post' });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      const { title, description, plan, deadline, category, isPublic } = req.body;

      if (title !== undefined) {
        updates.push(`title = $${paramCount}`);
        values.push(title);
        paramCount++;
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }
      if (plan !== undefined) {
        updates.push(`plan = $${paramCount}`);
        values.push(plan);
        paramCount++;
      }
      if (deadline !== undefined) {
        updates.push(`deadline = $${paramCount}`);
        values.push(deadline);
        paramCount++;
      }
      if (category !== undefined) {
        updates.push(`category = $${paramCount}`);
        values.push(category);
        paramCount++;
      }
      if (isPublic !== undefined) {
        updates.push(`is_public = $${paramCount}`);
        values.push(isPublic);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);

      const result = await db.query(
        `UPDATE posts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      res.json({
        message: 'Post updated successfully',
        post: result.rows[0],
      });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ error: 'Failed to update post', message: error.message });
    }
  }
);

// Delete post (only by owner)
router.delete('/:id', authenticateToken, requireVerified, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const postCheck = await db.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    // Delete post (cascades to likes, comments, milestones)
    await db.query('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post', message: error.message });
  }
});

// Like/Unlike post
router.post('/:id/like', authenticateToken, requireVerified, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const likeCheck = await db.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, id]
    );

    if (likeCheck.rows.length > 0) {
      // Unlike
      await db.query(
        'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
        [userId, id]
      );
      res.json({ message: 'Post unliked', liked: false });
    } else {
      // Like
      await db.query(
        'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
        [userId, id]
      );
      res.json({ message: 'Post liked', liked: true });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like/unlike post', message: error.message });
  }
});

// Get user's own posts (profile page)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT 
        p.id, p.title, p.description, p.plan, p.deadline, p.category,
        p.engagement_score, p.created_at, p.updated_at, p.is_public,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
       FROM posts p
       WHERE p.user_id = $1 AND p.is_public = TRUE
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      posts: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts', message: error.message });
  }
});

module.exports = router;