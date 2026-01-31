# Bridge - Goal-Sharing Social Media Platform

Bridge is a social media web application designed to help users connect based on their goals and aspirations. Users can post about their goals, share their plans, and engage with a community focused on achievement and growth.

## Features

### Current Features (v1.0)
- User authentication (email/password with email verification)
- Create, read, update, delete posts
- Trending posts feed (based on recency + engagement)
- Like and comment on posts
- User profiles with followers/following
- Search functionality
- Goal milestones tracking
- AI agent integration framework (ready for LLM API)

### Coming Soon
- Mobile apps (iOS & Android)
- Full AI roadmap assistant
- Progress tracking dashboard
- Achievement badges
- Image uploads
- Notifications

## Architecture

### Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL (database)
- JWT (authentication)
- Bcrypt (password hashing)
- Nodemailer (email verification)

**Frontend:**
- Vanilla JavaScript
- HTML5/CSS3
- RESTful API integration

## Prerequisites

Before setting up the project, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v13 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Setup Instructions

### 1. Database Setup

First, create a PostgreSQL database for the project:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bridge_db;

# Create user (optional, but recommended)
CREATE USER bridge_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bridge_db TO bridge_user;

# Exit psql
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd bridge-app/backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your configuration
# Important: Update these values in .env:
# - DB_USER=your_db_user
# - DB_PASSWORD=your_db_password
# - JWT_SECRET=your_super_secret_key (generate a random string)
# - EMAIL_USER=your_gmail@gmail.com
# - EMAIL_PASSWORD=your_app_specific_password
```

#### Email Configuration (Gmail)

To enable email verification:

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated password
4. Use this password as `EMAIL_PASSWORD` in your `.env` file

### 3. Initialize Database

```bash
# Run database initialization script
npm run init-db
```

This will create all necessary tables, indexes, and triggers.

### 4. Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR production mode
npm start
```

The backend API will be running at `http://localhost:3000`

### 5. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# No installation needed for frontend (vanilla JS)
# Just serve the files with any static server

# Option 1: Using Python (if installed)
python -m http.server 8000

# Option 2: Using Node.js http-server (install globally first)
npm install -g http-server
http-server -p 8000

# Option 3: Using VS Code Live Server extension
# Just right-click index.html and select "Open with Live Server"
```

The frontend will be accessible at `http://localhost:8000`

### 6. Test the Application

1. Open `http://localhost:8000` in your browser
2. Click "Sign Up" to create an account
3. Check your email for verification link
4. Verify your email
5. Log in and start posting!

## Project Structure

```
bridge-app/
├── backend/
│   ├── database/
│   │   ├── init-db.js             # Database initialization
│   │   └── db.js                  # Database connection pool
│   ├── middleware/
│   │   └── auth.js                # Authentication middleware
│   ├── routes/
│   │   ├── auth.js                # Auth routes (login, register, verify)
│   │   ├── posts.js               # Posts CRUD operations
│   │   ├── comments.js            # Comments operations
│   │   ├── users.js               # User profile operations
│   │   └── ai-agent.js            # AI agent integration
│   ├── utils/
│   │   └── email.js               # Email service
│   ├── server.js                  # Main server file
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── js/
    │   ├── api-client-utility.js. # API client
    │   ├── homepage.js            # Homepage logic
    │   ├── login.js               # Login page logic
    │   └── signup.js              # Sign-up page logic
    ├── pages/
    │   ├── login.html
    │   ├── login.css
    │   ├── sign-up.html
    │   └── sign-up.css
    ├── images/
    ├── fonts/
    ├── index.html                 # Homepage
    └── style.css                  # Main styles
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email?token=xxx` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email

### Posts
- `GET /api/posts/trending` - Get trending posts
- `GET /api/posts/explore` - Get all public posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (auth required)
- `PUT /api/posts/:id` - Update post (auth required)
- `DELETE /api/posts/:id` - Delete post (auth required)
- `POST /api/posts/:id/like` - Like/unlike post (auth required)
- `GET /api/posts/user/:userId` - Get user's posts

### Comments
- `GET /api/comments/post/:postId` - Get comments for post
- `POST /api/comments/post/:postId` - Create comment (auth required)
- `PUT /api/comments/:id` - Update comment (auth required)
- `DELETE /api/comments/:id` - Delete comment (auth required)

### Users
- `GET /api/users/:userId` - Get user profile
- `GET /api/users/me/profile` - Get own profile (auth required)
- `PUT /api/users/me/profile` - Update profile (auth required)
- `POST /api/users/:userId/follow` - Follow/unfollow user (auth required)
- `GET /api/users/:userId/followers` - Get followers
- `GET /api/users/:userId/following` - Get following

### AI Agent
- `POST /api/ai/chat` - Chat with AI agent (auth required)
- `GET /api/ai/conversation/:id` - Get conversation (auth required)
- `GET /api/ai/conversations` - Get all conversations (auth required)
- `DELETE /api/ai/conversation/:id` - Delete conversation (auth required)

## AI Agent Integration

The AI agent functionality is built with a generic interface that can work with any LLM API (Anthropic Claude, OpenAI GPT, etc.).

### To integrate an AI service:

1. Install the appropriate SDK:
```bash
cd backend
npm install @anthropic-ai/sdk  # For Anthropic Claude
# OR
npm install openai              # For OpenAI
```

2. Add your API key to `.env`:
```
AI_API_KEY=your_api_key_here
```

3. Edit `backend/routes/ai-agent.js` and uncomment/modify the `callAIService` function with your chosen API implementation.

Example for Anthropic Claude (already included in comments):
```javascript
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.AI_API_KEY,
});

// ... implementation code is already in the file
```

## Customization

### Changing Colors/Styling
Edit `frontend/style.css` to customize the look and feel.

### Adding Categories
Goal categories are currently hardcoded in the right sidebar. To make them dynamic, create a `categories` table and API endpoints.

### Email Templates
Customize email templates in `backend/utils/email.js`

## 🔒 Security Considerations

### For Production Deployment:

1. **Environment Variables:**
   - Use strong, random JWT_SECRET
   - Never commit `.env` file to version control
   - Use environment variables in production

2. **Database:**
   - Use SSL for database connections
   - Regular backups
   - Implement connection pooling limits

3. **Rate Limiting:**
   - Already implemented for API routes
   - Adjust limits in `server.js` based on your needs

4. **HTTPS:**
   - Always use HTTPS in production
   - Update CORS settings for production domain

5. **Input Validation:**
   - Already implemented with express-validator
   - Add more validation as needed

## Database Schema

### Users Table
- id, username, email, phone, password_hash
- is_verified, verification_token
- bio, profile_image_url
- created_at, updated_at

### Posts Table
- id, user_id, title, description, plan, deadline
- category, is_public, engagement_score
- created_at, updated_at

### Milestones Table
- id, post_id, title, description, deadline
- is_completed, completed_at, created_at

### Likes Table
- id, user_id, post_id, created_at

### Comments Table
- id, user_id, post_id, content
- created_at, updated_at

### Follows Table
- id, follower_id, following_id, created_at

### AI Conversations Table
- id, user_id, post_id, conversation_history (JSONB)
- created_at, updated_at

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # Mac

# Test connection
psql -U your_db_user -d bridge_db
```

### Email Verification Not Working
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`
- Make sure you're using an App Password, not your regular password
- Check spam folder
- Look at backend console for email errors

### Frontend Not Loading Posts
- Make sure backend is running on port 3000
- Check browser console for errors
- Verify CORS settings in `backend/server.js`
- Make sure `API_BASE_URL` in `frontend/js/api.js` is correct

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000        # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>        # Mac/Linux
```

## Deployment

### AWS Deployment (Recommended)

#### Backend (EC2 + RDS)
1. Set up RDS PostgreSQL instance
2. Launch EC2 instance
3. Install Node.js and PostgreSQL client
4. Clone repository and set up backend
5. Use PM2 for process management
6. Set up Nginx as reverse proxy
7. Configure SSL with Let's Encrypt

#### Frontend (S3 + CloudFront)
1. Build static files
2. Upload to S3 bucket
3. Configure S3 for static website hosting
4. Set up CloudFront distribution
5. Configure custom domain

### Alternative: Heroku
- Backend: Deploy to Heroku with PostgreSQL addon
- Frontend: Deploy to Netlify or Vercel

## Future Development

### Phase 2 Features
- [ ] Mobile app development (React Native)
- [ ] Real-time notifications (WebSockets)
- [ ] Image upload and storage (AWS S3)
- [ ] Advanced search and filtering
- [ ] Goal progress analytics
- [ ] Achievement system
- [ ] Direct messaging

### Phase 3 Features
- [ ] Group goals and challenges
- [ ] Integration with fitness trackers
- [ ] Gamification elements
- [ ] Premium features (paid tier)
- [ ] API for third-party integrations

## License

This project is private and proprietary.

## Contributors

- Nick Bourgeois - Initial development

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check backend logs
4. Contact the development team

---

**Built for helping people achieve their goals**