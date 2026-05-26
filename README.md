# Napnix Admin Dashboard

Admin dashboard for managing clients, projects, and leads.

## 🚀 Quick Start

### 1. Install Dependencies
Already done! ✅

### 2. Start Development Server
```bash
npm run dev
```

Dashboard will run on: **http://localhost:5174**

### 3. Login Credentials
- **Email:** `admin@napnix.in`
- **Password:** `admin123`

## 📦 Features

✅ Authentication (Login/Logout)
✅ Dashboard with Statistics
✅ Client Management (CRUD)
✅ Project Management (CRUD)
✅ Lead Management (CRUD)
✅ Responsive Design
✅ Modern UI with Tailwind CSS

## 🛠️ Tech Stack

- React 18
- Vite
- React Router v6
- Tailwind CSS
- Axios
- Chart.js
- React Hot Toast

## 📁 Project Structure

```
nexs-admin/
├── src/
│   ├── api/           # API services
│   ├── components/    # Reusable components
│   ├── contexts/      # React contexts
│   ├── pages/         # Page components
│   ├── utils/         # Utility functions
│   ├── App.jsx        # Main app
│   └── main.jsx       # Entry point
├── .env.development   # Local API config
├── .env.production    # Production API config
└── package.json
```

## 🔌 API Configuration

### Development
Backend API: `http://localhost:5000/api`

### Production
Backend API: `https://api.napnix.in/api`

## 📝 Next Steps

The core structure has been created. To complete the dashboard:

1. **Run the backend:**
   ```bash
   cd ../nexs-backend
   npm run dev
   ```

2. **Start the admin dashboard:**
   ```bash
   npm run dev
   ```

3. **Access at:** http://localhost:5174

## 🎨 Design

The dashboard uses a modern, professional design with:
- Glassmorphism effects
- Gradient accents
- Responsive layout
- Dark sidebar navigation
- Clean data tables

## 📄 License

Napnix © 2024
