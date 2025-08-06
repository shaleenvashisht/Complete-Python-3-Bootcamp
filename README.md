# 🔍 MicroTrace - Distributed Log Analyzer

A Silicon Valley-grade developer productivity tool for analyzing distributed microservice logs. Upload log files and visualize request lifecycles across multiple services with an intuitive, modern interface.

## ✨ Features

- 📁 **Smart Log Parsing**: Automatically parse and reconstruct request lifecycles from distributed logs
- 🎯 **Request Tracking**: Track requests across microservices using requestId/externalOrderId
- 🔍 **Source Detection**: Identify request origins (API Gateway, Batch Jobs, Schedulers, etc.)
- 📊 **Interactive Timeline**: Beautiful timeline visualization with collapsible sections
- 🌙 **Dark/Light Mode**: Modern UI with theme switching
- 🔍 **Advanced Search**: Filter by requestId, service name, errors, and more
- 📤 **Export Options**: Export processed results as JSON or CSV
- ⚡ **High Performance**: Handle 10K+ log lines efficiently

## 🛠️ Tech Stack

- **Frontend**: React 18, TailwindCSS, shadcn/ui, Framer Motion
- **Backend**: Python FastAPI, Pydantic, asyncio
- **State Management**: Zustand
- **Build Tools**: Vite, TypeScript
- **Testing**: Jest, Pytest

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+
- pip

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## 📁 Project Structure

```
microtrace/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── utils/
│   │   └── types/
│   ├── public/
│   └── package.json
└── README.md
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📊 Log Format Support

The analyzer supports various log formats and automatically detects:
- Timestamps (ISO format, custom patterns)
- Service names
- Request/Order IDs
- Event types
- Error conditions
- Request sources

## 🎨 Design Philosophy

Built with Silicon Valley design principles:
- **Minimalist**: Clean, clutter-free interface
- **Cognitive Load Reduction**: Information hierarchy and progressive disclosure
- **Developer-First**: Optimized for developer workflows
- **Performance**: Smooth animations and efficient rendering

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
