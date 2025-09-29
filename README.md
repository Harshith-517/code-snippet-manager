# 📝 Code Snippet Manager

A collaborative code snippet manager built with the MERN stack. Create, edit, and share code snippets with smart search functionality and collaborative editing features.

## ✨ Features

- 🔐 **Authentication**: JWT-based auth with Google OAuth support
- 👥 **Anonymous Users**: Create and edit snippets without registration
- 🤝 **Collaborative Editing**: Public snippets can be edited by anyone (Wikipedia-style)
- 🔍 **Smart Search**: Search by title - opens existing or creates new snippets
- 🎨 **Modern UI**: Built with React, Tailwind CSS, and Vite
- 📱 **Responsive Design**: Works on all devices
- 🔒 **Privacy Controls**: Public and private snippet options
- 📧 **Email & SMS Verification**: OTP verification system
- 🌐 **Google OAuth Integration**: Easy social login
- JWT-based authentication

## Structure
- client/ — React + Vite + Tailwind frontend
- server/ — Node.js + Express backend with MongoDB (Mongoose)

## Setup

### 1. Server Setup

```bash
cd server
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

### 2. Client Setup

```bash
cd client
cp .env.example .env
# Edit .env with your Google Client ID
npm install
npm run dev
```

## Email OTP Setup

To enable email verification, you need to set up Gmail SMTP:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Update your `.env`** file:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-generated-app-password
   ```

## Phone SMS Setup

The app uses MSG91 for SMS verification, which provides free credits for Indian numbers.

### Setup MSG91 (Free for Indian Numbers)

1. **Sign up at [MSG91.com](https://msg91.com/)**
2. **Verify your email** and complete the registration
3. **Go to API section** in your dashboard
4. **Copy your Auth Key**
5. **Update your `.env`** file:
   ```
   MSG91_AUTH_KEY=your-msg91-auth-key-here
   MSG91_SENDER_ID=CODEIT
   ```

### MSG91 Free Credits
- **New accounts get 100-500 free SMS**
- **Cost after free credits: ~₹0.18-0.25 per SMS**
- **Perfect for testing and small applications**

### Testing
Once configured, test phone verification with Indian numbers (+91XXXXXXXXXX).

## Environment Variables

### Server (.env)
- `PORT`: Server port (default: 5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_APP_PASSWORD`: Gmail app password
- `FRONTEND_URL`: Frontend URL for password reset links
- `MSG91_AUTH_KEY`: MSG91 auth key for SMS verification
- `MSG91_SENDER_ID`: MSG91 sender ID (default: CODEIT)

### Client (.env)
- `VITE_API_URL`: Backend API URL
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth Client ID

This scaffold creates route and controller stubs. Implementation and auth logic not added yet.
