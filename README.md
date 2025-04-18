# SmartChoice-AI

A lightweight web app that injects a decision-importance reflection timer into conversations to help users make better decisions.

## Features

- Single-page stateless web app (all data stored in browser memory)
- Chat interface with AI responses
- Automatic decision importance classification (trivial, routine, complex, life-altering)
- Dynamic reflection timer (10-120 seconds) based on decision importance and AI response complexity
- Importance-specific reflection prompts
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
3. After receiving the AI response, the system automatically classifies the decision importance
4. Based on the importance level and the complexity of the AI response, a reflection timer is set
5. During the reflection period, you'll see contextually relevant prompts based on the decision importance
6. After the timer expires, you can continue the conversation
7. If you refresh the page, all conversation history is cleared

## Built With

- Next.js
- React
- Tailwind CSS
- shadcn/ui components
- OpenAI GPT-4.1
