# AI Chatbot Application

# Deployed Link :- https://analyst-ai-final-1tfk.vercel.app/

A full-stack AI-powered chatbot application built with React and Django. This project enables companies to integrate intelligent chat functionality with a modern, responsive user interface.

## 📋 Project Structure

```
ai-app/
├── .gitignore                 # Git ignore rules
├── eslint.config.js           # ESLint configuration
├── index.html                 # HTML entry point
├── package.json               # Frontend dependencies
├── vite.config.js             # Vite build configuration
├── README.md                  # Project documentation
├── public/                    # Static assets
├── src/                       # React application source
│   ├── App.jsx                # Main App component
│   ├── App.css                # App styles
│   ├── main.jsx               # React entry point
│   ├── index.css              # Global styles
│   ├── assets/                # Images, fonts, etc.
│   ├── components/            # Reusable React components
│   │   ├── ChatContainer.jsx  # Chat interface container
│   │   ├── CompanyChatbot.jsx # Main chatbot component
│   │   ├── Header.jsx         # Header component
│   │   ├── Message.jsx        # Message display component
│   │   └── OptionsPanel.jsx   # Options/settings panel
│   └── hooks/                 # Custom React hooks
│       └── useApi.js          # API communication hook
│
aiagent/
├── .env                       # Environment variables
├── db.sqlite3                 # SQLite database
├── manage.py                  # Django management script
├── requirements.txt           # Python dependencies
├── agent/                     # Main Django app
│   ├── __init__.py
│   ├── admin.py               # Django admin configuration
│   ├── apps.py                # App configuration
│   ├── models.py              # Database models
│   ├── serializers.py         # DRF serializers
│   ├── tests.py               # Unit tests
│   ├── urls.py                # URL routing
│   ├── utils.py               # Utility functions
│   └── views.py               # API views
└── aiagent/                   # Django project settings
    └── settings.py            # Django configuration
```

## 🚀 Features

- **Real-time Chat Interface** - Interactive chatbot communication
- **Company Integration** - Multi-company chatbot support
- **RESTful API** - Django REST Framework backend
- **Modern UI** - React with Vite for fast development
- **Custom Hooks** - Optimized API communication with `useApi`
- **Responsive Design** - Mobile-friendly chat interface

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **CSS3** - Styling
- **ESLint** - Code quality

### Backend
- **Django** - Web framework
- **Django REST Framework** - RESTful API development
- **SQLite** - Database (development)
- **Python** - Programming language

## 📦 Installation

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- npm or yarn

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ai-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default).

### Backend Setup

1. Navigate to the backend directory:
```bash
cd aiagent
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables in `.env`:
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Start the development server:
```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`.

## 🔧 Configuration

### Environment Variables (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

### CORS Configuration
Update Django settings to allow requests from the frontend:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
```

## 📚 API Endpoints

- `GET /api/chatbot/` - List all chatbots
- `POST /api/chat/` - Send message
- `GET /api/messages/` - Retrieve chat history

## 🧪 Testing

### Frontend Tests
```bash
cd ai-app
npm test
```

### Backend Tests
```bash
cd aiagent
python manage.py test
```

## 📝 Development Guide

### Frontend Components
- [ChatContainer.jsx](src/components/ChatContainer.jsx) - Manages chat state and layout
- [CompanyChatbot.jsx](src/components/CompanyChatbot.jsx) - Main chatbot interface
- [Message.jsx](src/components/Message.jsx) - Individual message rendering
- [Header.jsx](src/components/Header.jsx) - Application header
- [OptionsPanel.jsx](src/components/OptionsPanel.jsx) - Configuration options

### Hooks
- [useApi.js](src/hooks/useApi.js) - Handles API calls and data fetching

### Backend Models
Check [aiagent/agent/models.py](aiagent/agent/models.py) for database schema.

## 🚢 Deployment

### Frontend (Vite Build)
```bash
cd ai-app
npm run build
```

### Backend (Django)
```bash
cd aiagent
python manage.py collectstatic
python manage.py runserver
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Last Updated:** 2024
