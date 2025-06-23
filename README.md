# xAI Careers Assistant 🤖

**Live Demo:** <a href="https://xai-careers.vercel.app/" target="_blank">https://xai-careers.vercel.app/</a>

An AI-powered career assistant that helps you discover the perfect job opportunities at xAI by analyzing your resume and providing personalized recommendations with intelligent explanations.

## 🎯 Problem & Solution

### The Problem

xAI's careers page currently has **131+ open positions** (as of June 22, 2025), making it overwhelming and time-consuming for job seekers to:

- Read through each individual job posting
- Identify which roles match their skills and experience
- Understand why certain positions might be a good fit
- Navigate the extensive list of opportunities across different departments

### The Solution

Our AI-powered platform transforms the job search experience by allowing you to:

- **Upload your resume** and let AI analyze your background
- **Ask natural language questions** like "recommend me full stack engineering jobs related to web app dev and machine learning"
- **Get personalized job recommendations** ranked by relevance to your profile
- **Receive AI explanations** for why specific roles are recommended for you
- **Explore opportunities** through an intuitive chat interface

## ✨ Key Features

- 🧠 **AI-Powered Matching**: Leverages xAI's Grok model for intelligent job recommendations
- 📄 **Resume Analysis**: Upload and parse PDF resumes to understand your background
- 💬 **Conversational Interface**: Natural language job search through chat
- 🔄 **Real-Time Job Sync**: Automatically syncs with xAI's latest job postings via Greenhouse API
- 🎯 **Smart Filtering**: Filter by location, department, and experience level
- 📱 **Responsive Design**: Optimized for both desktop and mobile experiences
- 🌙 **Dark Mode Support**: Clean, modern UI with dark mode
- ⚡ **Fast Performance**: Built on Next.js with edge runtime for speed

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with dark mode

### AI & Machine Learning

- **xAI Grok Integration** - Powered by xAI's latest Grok model
- **AI SDK** - Vercel's AI SDK for seamless model integration
- **PDF Processing** - Resume parsing and text extraction

### Backend & Database

- **Vercel Postgres** - Serverless database for job storage (using NEON db)
- **Edge Runtime** - Fast, distributed API endpoints
- **Greenhouse API** - Real-time job data synchronization (via web scraping)

### Deployment & Analytics

- **Vercel** - Serverless deployment platform
- **Vercel Analytics** - Performance and usage tracking

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Vercel account (for database and deployment)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/xai-careers.git
   cd xai-careers
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:

   ```env
   # xAI API Configuration
   XAI_API_KEY=your_xai_api_key_here

   # Vercel Postgres (get from Vercel dashboard)
   POSTGRES_URL=your_postgres_connection_string
   POSTGRES_PRISMA_URL=your_postgres_prisma_url
   POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url
   POSTGRES_USER=your_postgres_user
   POSTGRES_HOST=your_postgres_host
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_DATABASE=your_postgres_database
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Initial Setup

1. **Sync job data**
   Visit `/api/jobs/sync` to populate your database with the latest xAI job listings

2. **Test the chat interface**
   Try asking questions like:
   - "What engineering roles are available?"
   - "Show me remote positions"
   - Upload your resume and ask for personalized recommendations

## 🏗️ Architecture

### API Routes

- `/api/chat` - Main AI chat endpoint with Grok integration
- `/api/jobs/sync` - Syncs job data from Greenhouse API
- `/api/jobs/filters` - Returns available job filters (locations, departments)
- `/api/parse-cv` - Handles resume/CV file upload and parsing

### Key Components

- `ChatContainer` - Main chat interface with streaming responses
- `ChatInput` - File upload and message input with filters
- `ChatMessage` - Message display with job card rendering
- `JobListingCard` - Interactive job recommendation cards

### Data Flow

1. Jobs are synced from xAI's Greenhouse API and stored locally
2. User uploads resume (optional) and asks questions
3. AI analyzes user input, resume, and available jobs
4. Personalized recommendations are streamed back with explanations
5. Job cards are dynamically rendered for easy application

## 🔧 Configuration

### Job Sync

Jobs automatically sync from xAI's Greenhouse careers page. The sync process:

- Fetches all current openings with full descriptions
- Cleans and standardizes job content
- Updates local database with latest information
- Removes outdated postings

### AI Model Settings

The application uses xAI's Grok model with high reasoning effort for better job matching accuracy.

## 📱 Usage Examples

**Basic Job Search:**

> "What software engineering roles are available at xAI?"

**Location-Specific Search:**

> "Show me remote engineering positions"

**Experience-Based Matching:**

> "I have 5 years of Python and ML experience. What roles would be good for me?"

**Resume-Based Recommendations:**

> Upload your CV and ask: "Based on my background, recommend the top 3 positions that match my experience"

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **xAI** for providing the Grok AI model and job opportunities
- **Vercel** for the deployment platform and AI SDK
- **Greenhouse** for the careers API

---

**Built with ❤️ for the xAI community and people looking for their next role**
