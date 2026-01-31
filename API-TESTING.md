# API Testing Guide

This guide shows you how to test the Bridge API endpoints using curl or Postman.

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require a JWT token. After logging in, you'll receive a token. Include it in requests like this:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/api/endpoint
```

## Test Endpoints

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Bridge API is running",
  "timestamp": "2024-01-30T..."
}
```

### 2. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "555-123-4567",
    "password": "secure123",
    "confirmPassword": "secure123"
  }'
```

Expected response:
```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### 3. Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "isVerified": false
  }
}
```

**Save the token!** You'll need it for authenticated requests.

### 4. Get Trending Posts
```bash
curl http://localhost:3000/api/posts/trending
```

### 5. Create a Post (Requires Auth)
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Run a Marathon in 6 Months",
    "description": "I want to complete my first marathon by July 2024",
    "plan": "Week 1-4: Build base (15-20 miles/week)\nWeek 5-12: Increase mileage gradually\nWeek 13-20: Peak training (40-50 miles/week)\nWeek 21-24: Taper and prepare",
    "deadline": "2024-07-15",
    "category": "Fitness & Health",
    "isPublic": true
  }'
```

### 6. Like a Post (Requires Auth)
```bash
curl -X POST http://localhost:3000/api/posts/1/like \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Create a Comment (Requires Auth)
```bash
curl -X POST http://localhost:3000/api/comments/post/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Great goal! I completed my first marathon last year. Happy to share training tips!"
  }'
```

### 8. Get User Profile
```bash
curl http://localhost:3000/api/users/1
```

### 9. Update Your Profile (Requires Auth)
```bash
curl -X PUT http://localhost:3000/api/users/me/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "bio": "Fitness enthusiast and goal-setter. Running my first marathon in 2024!",
    "username": "johndoe_runner"
  }'
```

### 10. Follow a User (Requires Auth)
```bash
curl -X POST http://localhost:3000/api/users/2/follow \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 11. Chat with AI Agent (Requires Auth)
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "message": "I want to learn web development. Can you help me create a roadmap?",
    "postId": null
  }'
```

### 12. Search Posts
```bash
# Search by keyword
curl "http://localhost:3000/api/posts/explore?search=marathon"

# Filter by category
curl "http://localhost:3000/api/posts/explore?category=Fitness%20%26%20Health"

# Combine filters
curl "http://localhost:3000/api/posts/explore?search=running&category=Fitness%20%26%20Health&limit=10"
```

## Postman Collection

If you prefer Postman, here's how to set it up:

1. Create a new Collection called "Bridge API"
2. Add a variable `baseUrl` = `http://localhost:3000/api`
3. Add a variable `token` = (leave empty, will be set after login)

### Environment Setup in Postman:

For each authenticated request:
1. Go to Headers tab
2. Add: `Authorization` = `Bearer {{token}}`
3. After successful login, copy the token from response
4. Set it as the `token` variable in your environment

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "errors": [
    {
      "msg": "Password must be 5-30 characters",
      "param": "password"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Email verification required",
  "message": "Please verify your email address before accessing this resource"
}
```

### 404 Not Found
```json
{
  "error": "Post not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## Rate Limiting

The API has rate limiting enabled:
- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

If you exceed the limit, you'll get:
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

## Testing Flow

### Complete User Flow Test:

```bash
# 1. Register
TOKEN=$(curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","phone":"555-555-5555","password":"test123","confirmPassword":"test123"}' \
  | jq -r '.token')

# 2. (Verify email - check inbox and click link)

# 3. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.token')

# 4. Create a post
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Goal","description":"Testing the API","plan":"Step 1\nStep 2","deadline":"2024-12-31","category":"Testing"}'

# 5. Get trending posts
curl http://localhost:3000/api/posts/trending

# 6. Like the post (post ID 1)
curl -X POST http://localhost:3000/api/posts/1/like \
  -H "Authorization: Bearer $TOKEN"

# 7. Add a comment
curl -X POST http://localhost:3000/api/comments/post/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"Great goal!"}'
```

## Tips

1. **Save your token** after login - you'll need it for most requests
2. **Use jq** to parse JSON responses (install with `brew install jq` or `apt-get install jq`)
3. **Check the backend logs** in your terminal for detailed error messages
4. **Use Postman** for easier testing with a GUI
5. **Test email verification** by checking the verification link in your email

## Common Issues

**"Access token required"**
- Make sure you're including the Authorization header
- Check that your token is valid and not expired (tokens last 7 days)

**"Email verification required"**
- You need to verify your email before creating posts
- Check your inbox for the verification email
- Use the resend endpoint if needed

**"Invalid credentials"**
- Double-check email and password
- Make sure the user is registered

**"User already exists"**
- The username or email is already taken
- Try a different username/email