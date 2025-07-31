# 🚀 PrimeTask Movers Backend Setup Guide

## 📋 Overview
Complete backend solution for PrimeTask Movers website with MongoDB Atlas integration, contact form API, and deployment-ready configuration.

## 🏗️ Project Structure
```
primetask-movers/
├── server.js                 # Main Express server
├── models/
│   └── Contact.js            # MongoDB Contact schema
├── assets/
│   └── js/
│       └── contact.js        # Updated frontend contact form
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── test-backend.js           # Backend testing script
├── contact.html              # Contact page with form
└── BACKEND_SETUP_GUIDE.md    # This guide
```

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster (or use existing)
3. Create a database user:
   - Go to **Database Access**
   - Click **Add New Database User**
   - Choose **Password** authentication
   - Set username and password
   - Grant **Read and write to any database** role

4. Configure Network Access:
   - Go to **Network Access**
   - Click **Add IP Address**
   - Add `0.0.0.0/0` (allow from anywhere) or your specific IP

5. Get Connection String:
   - Go to **Clusters** → **Connect**
   - Choose **Connect your application**
   - Copy the connection string

### 3. Environment Configuration
Update `.env` file with your MongoDB Atlas credentials:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/primetask_movers?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
```

**Replace:**
- `your_username` with your MongoDB Atlas username
- `your_password` with your MongoDB Atlas password
- `cluster0.xxxxx.mongodb.net` with your actual cluster URL

### 4. Test the Setup
```bash
# Test MongoDB connection
node test-backend.js

# Start the server
npm start

# For development with auto-restart
npm run dev
```

## 🌐 API Endpoints

### POST /contact
Submit contact form data

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Moving Inquiry",
  "message": "I need help with moving services."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thank you for contacting us! We will get back to you soon.",
  "data": {
    "id": "contact_id",
    "submittedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Error description"
}
```

### GET /api/contacts
Get all contacts (admin endpoint)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "contact_id",
      "name": "John Doe",
      "email": "john@example.com",
      "subject": "Moving Inquiry",
      "message": "Message content",
      "status": "new",
      "submittedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "success": true,
  "message": "PrimeTask Movers Backend is running!",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "Connected"
}
```

## 🚀 Deployment Options

### Option 1: Render.com (Recommended)
1. Push code to GitHub repository
2. Go to [Render.com](https://render.com/)
3. Create new **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** Add your `.env` variables

### Option 2: Heroku
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create primetask-backend`
4. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI="your_mongodb_uri"
   heroku config:set NODE_ENV=production
   ```
5. Deploy: `git push heroku main`

### Option 3: Railway
1. Go to [Railway.app](https://railway.app/)
2. Create new project from GitHub
3. Add environment variables
4. Deploy automatically

## 🔧 Frontend Integration

The contact form in `contact.html` is already configured to work with the backend. It will:

1. **Try local backend first** (`/contact`)
2. **Fallback to deployed backend** (`https://primetask-backend.onrender.com/contact`)
3. **Show loading states** and **error handling**
4. **Real-time validation** for form fields
5. **Auto-hide messages** after 5 seconds

## 📊 Database Schema

### Contact Model
```javascript
{
  name: String (required, 2-100 chars),
  email: String (required, valid email),
  subject: String (required, 5-200 chars),
  message: String (required, 10-1000 chars),
  status: String (enum: 'new', 'read', 'replied', 'archived'),
  submittedAt: Date (auto-generated),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

## 🧪 Testing

### Test Database Connection
```bash
node test-backend.js
```

### Test API Endpoints
```bash
# Start server first
npm start

# In another terminal, test the API
curl -X POST http://localhost:5000/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "This is a test message."
  }'
```

### Test Health Check
```bash
curl http://localhost:5000/health
```

## 🔒 Security Features

- **CORS** enabled for cross-origin requests
- **Input validation** on both client and server
- **Rate limiting** (configurable)
- **Helmet** for security headers
- **Environment variables** for sensitive data
- **Error handling** without exposing internal details

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.net/db` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `JWT_SECRET` | JWT secret key | `your_secret_key` |
| `EMAIL_USER` | Email for notifications | `primetaskmover121@gmail.com` |
| `CONTACT_EMAIL` | Contact email | `primetaskmover121@gmail.com` |

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MONGODB_URI in `.env`
   - Verify username/password
   - Check Network Access in MongoDB Atlas

2. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing process: `lsof -ti:5000 | xargs kill -9`

3. **CORS Errors**
   - Check ALLOWED_ORIGINS in `.env`
   - Verify frontend URL is included

4. **Form Not Submitting**
   - Check browser console for errors
   - Verify API endpoint URL
   - Test with curl/Postman

### Debug Mode
Set `DEBUG=true` in `.env` for verbose logging.

## 📞 Support

For issues or questions:
- **Email:** primetaskmover121@gmail.com
- **Phone:** +91 9523882805

## 🎉 Success!

Your PrimeTask Movers backend is now ready! 

✅ MongoDB Atlas connected  
✅ Contact API working  
✅ Frontend integrated  
✅ Ready for deployment  

Visit your contact page and test the form to see it in action!