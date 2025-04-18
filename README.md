# SmartChoice-AI

A lightweight web app that injects a short, topic-aware reflection timer into conversations to help users make better decisions.

## Features

- Single-page stateless web app (all data stored in browser memory)
- Chat interface with AI responses
- Automatic topic detection (financial, career, relationship, general)
- Probabilistic reflection timer (7-15 seconds) based on topic
- Topic-specific reflection prompts
- Clean UI with progress bar for countdown

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How It Works

1. Enter your decision dilemma
2. The app sends your message to the AI
3. Depending on the topic, there's a 40-70% chance of triggering a reflection timer
4. If triggered, you'll see a countdown timer and reflection prompts related to your topic
5. After the timer expires, you can continue the conversation
6. If you refresh the page, all conversation history is cleared

## Built With

- Next.js
- React
- Tailwind CSS
- shadcn/ui components
- OpenAI GPT-4.1 