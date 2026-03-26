# RankForge

RankForge is an enterprise-grade, AI-powered content generation pipeline designed to research, write, and validate SEO-optimized blog posts in under 3 minutes. Built with a modern tech stack, it features a multi-agent architecture and a robust verification system.

## Key Features

- **Multi-Agent AI Pipeline**: Utilizes multiple LLM agents (Researcher, Writer, Editor) to generate high-quality, long-form content.
- **SEO Validation Engine**: Evaluates content across 20+ SEO and naturalness metrics, including keyword density, Flesch-Kincaid readability, and structural readiness.
- **Keyword Analyzer**: Provides real-time search volume projections, ranking difficulty, and SERP gap analysis to target underserved topics.
- **Authentication**: Fully integrated user authentication system backed by MongoDB Atlas and secured with JSON Web Tokens (JWT).
- **Modern User Interface**: A minimalist cream and dark-indigo design system built with React, Vite, and Tailwind CSS.

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MongoDB Atlas (Async Motor API)
- **AI Integration**: LangChain integration with the Groq API (Meta Llama 3)
- **Authentication**: JWT (python-jose), bcrypt (passlib)

### Frontend
- **Framework**: React 18, Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS, CSS Variables
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- MongoDB Atlas Cluster
- Groq API Key

### Environment Setup

1. Clone the repository and navigate to the project root.
2. Create a `.env` file in the root directory:
```env
# API Keys
GROQ_API_KEY=your_groq_api_key

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rankforge?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_secure_jwt_secret

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
```

### Backend Installation

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```
2. Install the required dependencies:
```bash
pip install -r requirements.txt
```
3. Start the FastAPI backend server:
```bash
python -m app.main
# or run via uvicorn directly:
# uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will be available at `http://localhost:8000`.

### Frontend Installation

1. Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```
2. Install the Node modules:
```bash
npm install
```
3. Start the Vite development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## Architecture Overview

The system operates in three distinct phases:
1. **Research Phase**: The system identifies search intent and extracts competitor gaps.
2. **Generation Phase**: A drafting agent writes the initial document based on the research.
3. **Verification Phase**: An editorial agent verifies the text against target keywords and structural constraints.

## License

Copyright 2026. All rights reserved.
