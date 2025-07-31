# MongoDB Atlas Setup Guide

## Current Issue
Your MongoDB connection is failing because your current IP address is not whitelisted in MongoDB Atlas.

## Solution Steps

### 1. Whitelist Your IP Address in MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Select your cluster (Cluster0)
4. Click on "Network Access" in the left sidebar
5. Click "Add IP Address"
6. Choose one of these options:
   - **Add Current IP Address** (recommended for development)
   - **Allow Access from Anywhere** (0.0.0.0/0) - less secure but works from any location

### 2. Alternative: Use a Different Connection String

If you want to allow access from anywhere temporarily, you can:
1. Go to "Database Access" in MongoDB Atlas
2. Make sure your database user has proper permissions
3. Go to "Clusters" and click "Connect"
4. Choose "Connect your application"
5. Copy the new connection string

### 3. Verify Your Database User

Make sure your database user (yadavnitesh) has the correct permissions:
1. Go to "Database Access" in MongoDB Atlas
2. Check if user "yadavnitesh" exists and has "readWrite" permissions
3. If not, create a new user or update permissions

## Current Connection String
```
mongodb+srv://yadavnitesh:9523882805@cluster0.2ihbdi6.mongodb.net/primeTaskMovers?retryWrites=true&w=majority
```

## Testing the Connection

After whitelisting your IP, run:
```bash
node index.js
```

You should see:
```
✅ MongoDB Connected
🚀 Server is running on http://localhost:3000
```

## Security Note
- Never commit your actual MongoDB password to version control
- Consider using environment variables for sensitive data
- Regularly rotate your database passwords