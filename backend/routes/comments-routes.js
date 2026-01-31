const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, requireVerified } = require('../middleware/auth');

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT 
        c.id, c.content, c.created_at, c.updated_at,
        u.id as user_id, u.username, u.profile_image_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    res.json({
      comments: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments', message: error.message });
  }
});

// Create comment
router.post(
  '/post/:postId',
  authenticateToken,
  requireVerified,
  [
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { postId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Check if post exists
      const postCheck = await db.query('SELECT id FROM posts WHERE id = $1', [postId]);
      if (postCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Insert comment
      const result = await db.query(
        `INSERT INTO comments (user_id, post_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, postId, content]
      );

      res.status(201).json({
        message: 'Comment created successfully',
        comment: result.rows[0],
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Failed to create comment', message: error.message });
    }
  }
);

// Update comment (only by owner)
router.put(
  '/:id',
  authenticateToken,
  requireVerified,
  [
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // Check if comment exists and belongs to user
      const commentCheck = await db.query(
        'SELECT user_id FROM comments WHERE id = $1',
        [id]
      );

      if (commentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (commentCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to edit this comment' });
      }

      // Update comment
      const result = await db.query(
        'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
        [content, id]
      );

      res.json({
        message: 'Comment updated successfully',
        comment: result.rows[0],
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({ error: 'Failed to update comment', message: error.message });
    }
  }
);

// Delete comment (only by owner)
router.delete('/:id', authenticateToken, requireVerified, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if comment exists and belongs to user
    const commentCheck = await db.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [id]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    // Delete comment
    await db.query('DELETE FROM comments WHERE id = $1', [id]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment', message: error.message });
  }
});

module.exports = router;