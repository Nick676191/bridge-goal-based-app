const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, requireVerified } = require('../middleware/auth');

const router = express.Router();

/**
 * AI Agent Integration
 * 
 * This module provides a structure for integrating any LLM API (Anthropic Claude, OpenAI, etc.)
 * to help users create roadmaps for achieving their goals.
 * 
 * To integrate your chosen AI API:
 * 1. Install the appropriate SDK (e.g., npm install @anthropic-ai/sdk)
 * 2. Add your API key to .env as AI_API_KEY
 * 3. Implement the callAIService function below
 */

/**
 * Generic function to call AI service
 * Replace this with your actual AI API implementation
 */
async function callAIService(userMessage, conversationHistory = []) {
  // IMPLEMENTATION PLACEHOLDER
  // This is where you'll integrate your chosen LLM API
  
  const AI_API_KEY = process.env.AI_API_KEY;
  const AI_API_URL = process.env.AI_API_URL;

  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY not configured');
  }

  // Example structure for Anthropic Claude API:
  /*
  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({
    apiKey: AI_API_KEY,
  });

  const systemPrompt = `You are a helpful AI assistant specializing in goal planning and achievement strategies. 
  Your role is to help users create actionable roadmaps to achieve their goals. 
  When a user shares a goal, you should:
  1. Ask clarifying questions to understand their goal better
  2. Break down the goal into manageable milestones
  3. Suggest specific, actionable steps
  4. Provide realistic timelines
  5. Offer motivation and accountability strategies
  Be encouraging, practical, and specific in your advice.`;

  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages,
  });

  return {
    content: response.content[0].text,
    role: 'assistant'
  };
  */

  // For now, return a placeholder response
  return {
    content: `AI Agent placeholder response. To enable this feature, please integrate your chosen AI API in routes/ai-agent.js.
    
Your message: "${userMessage}"

To integrate:
1. Install your AI SDK (e.g., npm install @anthropic-ai/sdk)
2. Add AI_API_KEY to your .env file
3. Uncomment and configure the AI integration code in this file`,
    role: 'assistant'
  };
}

// Start or continue AI conversation for goal planning
router.post(
  '/chat',
  authenticateToken,
  requireVerified,
  [
    body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
    body('postId').optional().isInt().withMessage('Post ID must be an integer'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { message, postId } = req.body;
      const userId = req.user.id;

      let conversationHistory = [];
      let conversationId = null;

      // If postId is provided, get or create conversation for that post
      if (postId) {
        // Verify post belongs to user
        const postCheck = await db.query(
          'SELECT user_id FROM posts WHERE id = $1',
          [postId]
        );

        if (postCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Post not found' });
        }

        if (postCheck.rows[0].user_id !== userId) {
          return res.status(403).json({ error: 'Unauthorized access to this post' });
        }

        // Get existing conversation or create new one
        const convResult = await db.query(
          'SELECT id, conversation_history FROM ai_conversations WHERE user_id = $1 AND post_id = $2',
          [userId, postId]
        );

        if (convResult.rows.length > 0) {
          conversationId = convResult.rows[0].id;
          conversationHistory = convResult.rows[0].conversation_history;
        } else {
          // Create new conversation with post context
          const postResult = await db.query(
            'SELECT title, description, plan, deadline FROM posts WHERE id = $1',
            [postId]
          );
          const post = postResult.rows[0];

          // Add initial context message
          conversationHistory = [{
            role: 'user',
            content: `I want to achieve the following goal:
Title: ${post.title}
Description: ${post.description}
My current plan: ${post.plan}
Deadline: ${post.deadline || 'Not set'}

Can you help me create a detailed roadmap to achieve this goal?`
          }];
        }
      }

      // Call AI service
      const aiResponse = await callAIService(message, conversationHistory);

      // Update conversation history
      conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse.content }
      );

      // Save or update conversation
      if (conversationId) {
        await db.query(
          'UPDATE ai_conversations SET conversation_history = $1 WHERE id = $2',
          [JSON.stringify(conversationHistory), conversationId]
        );
      } else {
        const insertResult = await db.query(
          'INSERT INTO ai_conversations (user_id, post_id, conversation_history) VALUES ($1, $2, $3) RETURNING id',
          [userId, postId || null, JSON.stringify(conversationHistory)]
        );
        conversationId = insertResult.rows[0].id;
      }

      res.json({
        message: 'AI response generated',
        conversationId,
        response: aiResponse.content,
        history: conversationHistory,
      });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ 
        error: 'Failed to get AI response', 
        message: error.message 
      });
    }
  }
);

// Get conversation history
router.get('/conversation/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, post_id, conversation_history, created_at, updated_at
       FROM ai_conversations
       WHERE id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation: result.rows[0] });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation', message: error.message });
  }
});

// Get all conversations for user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT 
        c.id, c.post_id, c.created_at, c.updated_at,
        p.title as post_title
       FROM ai_conversations c
       LEFT JOIN posts p ON c.post_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      conversations: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations', message: error.message });
  }
});

// Delete conversation
router.delete('/conversation/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const convCheck = await db.query(
      'SELECT user_id FROM ai_conversations WHERE id = $1',
      [conversationId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (convCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this conversation' });
    }

    await db.query('DELETE FROM ai_conversations WHERE id = $1', [conversationId]);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation', message: error.message });
  }
});

module.exports = router;