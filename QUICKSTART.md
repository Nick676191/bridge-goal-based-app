# Bridge - Quick Start Guide

Get your Bridge application running in under 10 minutes!

## ⚡ Prerequisites Check

```bash
# Check Node.js (should be v16+)
node --version

# Check PostgreSQL
psql --version

# Check npm
npm --version
```

If any are missing, install them first!

## 🚀 5-Minute Setup

### Step 1: Create Database (2 minutes)
```bash
# Login to PostgreSQL
psql -U postgres

# Run these commands:
CREATE DATABASE bridge_db;
CREATE USER bridge_user WITH PASSWORD 'bridge123';
GRANT ALL PRIVILEGES ON DATABASE bridge_db TO bridge_user;
\q
```

### Step 2: Backend Setup (2 minutes)
```bash
# Navigate to backend folder
cd bridge-app/backend

# Install dependencies
npm install

# Copy .env file
cp .env.example .env
```

**Edit .env file - REQUIRED CHANGES:**
```env
DB_USER=bridge_user
DB_PASSWORD=bridge123
JWT_SECRET=my_super_secret_key_change_this_in_production
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Gmail App Password Setup:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy to .env as EMAIL_PASSWORD

```bash
# Initialize database
npm run init-db

# Start server
npm run dev
```

✅ Backend should be running at http://localhost:3000

### Step 3: Frontend Setup (1 minute)
```bash
# Open new terminal
# Navigate to frontend folder
cd bridge-app/frontend

# Start simple server (choose one):

# Python 3:
python3 -m http.server 8000

# OR Node http-server:
npx http-server -p 8000

# OR if you have VS Code:
# Just right-click index.html → "Open with Live Server"
```

✅ Frontend should be running at http://localhost:8000

## 🎉 Test It Out!

1. Open http://localhost:8000
2. Click "Sign Up"
3. Fill in the form
4. Check your email for verification
5. Click the verification link
6. Log in and create your first goal post!

## ⚠️ Quick Troubleshooting

**Database error?**
```bash
# Make sure PostgreSQL is running
sudo systemctl start postgresql  # Linux
brew services start postgresql   # Mac
```

**Port already in use?**
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

**Email not sending?**
- Make sure you're using Gmail App Password, not regular password
- Check spam folder
- Look at backend terminal for error messages

**Frontend can't reach backend?**
- Make sure backend is running (check http://localhost:3000)
- Check browser console (F12) for errors
- Make sure ports match in config

## 📚 Next Steps

- Read the full README.md for detailed documentation
- Customize styling in frontend/style.css
- Integrate AI agent (see README.md AI section)
- Deploy to production (see README.md Deployment section)

## 🎯 Common First Tasks

### Change Site Colors
Edit `frontend/style.css` - look for background colors and update

### Add More Goal Categories
Edit `frontend/index.html` - find the `.communities` section

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","phone":"555-555-5555","password":"test123","confirmPassword":"test123"}'
```

---

**That's it! You're ready to start building on Bridge! 🌉**