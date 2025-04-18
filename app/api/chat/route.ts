import { StreamingTextResponse } from "ai"
import OpenAI from "openai"

// Sample reflection prompts - now organized by importance level and rephrased as statements
const reflectionPrompts = {
  trivial: [
    ["Consider your gut feeling about this choice.", "Think about how this might affect the rest of your day."],
    ["Imagine what a satisfying outcome would look like.", "Consider if you're missing any information to decide."],
  ],
  routine: [
    ["Reflect on how this aligns with your short-term goals.", "Consider the trade-offs you're making with this choice."],
    ["Think about what you've learned from similar past decisions.", "Consider how this might affect your weekly routine."],
  ],
  complex: [
    ["Consider which values are most important in this decision.", "Think about the worst possible outcome of each option."],
    ["Imagine how this decision might look different in 6 months.", "Consider what someone you respect would advise here."],
  ],
  "life-altering": [
    ["Reflect on how this aligns with your core values and vision.", "Consider what fears might be influencing your thinking."],
    ["Think about how this might affect your key relationships.", "Imagine what would make you proud looking back on this choice."],
  ],
}

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to classify decision importance and determine timer in one call
async function classifyDecisionAndTimer(messages: any[], aiResponse: string) {
  try {
    const classificationResponse = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `Analyze the conversation and the MOST RECENT AI RESPONSE to determine how much reflection time the user needs.
Return TWO pieces of information in this exact format:
"importance: [category]
duration: [seconds]"

For importance, classify the overall decision context into:
- trivial: Simple day-to-day choices with minimal consequences
- routine: Regular choices with short-term impacts
- complex: Significant choices with medium to long-term consequences
- life-altering: Major choices with far-reaching consequences

For duration, determine appropriate reflection time (in seconds) based on:
1. How complex or thought-provoking the JUST GENERATED AI RESPONSE is
2. How many questions were asked in the AI's response
3. Whether the user needs time to deeply consider these specific questions

In other words, the timer is for the user to reflect on what the AI just asked them.

Guidelines for duration:
- If the AI response contains simple clarifying questions: 0-20 seconds
- If the AI response raises moderate complexity considerations: 10-20 seconds
- If the AI response asks deep, value-based questions: 15-30 seconds
- If the AI response requires life-changing reflection: 30-60 seconds

Set 0 seconds in case the decision is simple, AI didn't ask any questions or they are simple and the user doesn't need to reflect. but in general be judicious - too long timers can be frustrating.`
        },
        ...messages,
        {
          role: "system",
          content: `The above was the conversation history. This is the LAST AI response the user needs to reflect on: "${aiResponse}"`
        }
      ],
      max_tokens: 30
    });
    
    const result = classificationResponse.choices[0].message.content?.trim() || "";
    
    // Parse the result to extract importance and duration
    const importanceMatch = result.match(/importance:\s*(\w+-?\w*)/i);
    const durationMatch = result.match(/duration:\s*(\d+)/i);
    
    const importance = importanceMatch ? importanceMatch[1].toLowerCase() : "routine";
    const duration = durationMatch ? parseInt(durationMatch[1]) : 60;
    
    // Validate importance is one of our categories
    const validImportance = ["trivial", "routine", "complex", "life-altering"].includes(importance) 
      ? importance 
      : "routine";
    
    // Validate duration is within reasonable bounds (10-240 seconds)
    const validDuration = Math.min(Math.max(duration, 0), 240);
    
    console.log(`Decision classified as: ${validImportance}, Timer duration: ${validDuration}s`);
    
    return { importance: validImportance, duration: validDuration };
  } catch (error) {
    console.error("Error in classification:", error);
    return { importance: "routine", duration: 60 }; // Default if classification fails
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Generate AI response first
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a thoughtful decision-making assistant who helps users think through their choices.

Instead of asking many direct questions, use a conversational approach with just 1-2 key points to consider. For example:
- "It might help to think about your budget constraints here."
- "Understanding the startup's business model would be an important factor to consider."

Especially at the start of a conversation, focus on gathering information the user likely already knows, rather than prompting deep reflection immediately.

Be concise and avoid overwhelming the user. If you do need to ask a direct question, limit yourself to just one.`,
        },
        ...messages
      ],
    })

    // Get the text content
    const text = aiResponse.choices[0].message.content || ""

    // Classify decision importance AND determine timer duration in one call
    const { importance: importanceLevel, duration: timerDuration } = 
      await classifyDecisionAndTimer(messages, text);
    
    // Select appropriate reflection prompts for the importance level
    const promptOptions = reflectionPrompts[importanceLevel as keyof typeof reflectionPrompts];
    const randomPromptSet = promptOptions[Math.floor(Math.random() * promptOptions.length)];
    
    // Create a readable stream from the text
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text))
        controller.close()
      }
    })
    
    // Create response with headers
    const streamingResponse = new StreamingTextResponse(stream)

    // Add timer information as headers
    streamingResponse.headers.set("X-Timer-Duration", timerDuration.toString())
    streamingResponse.headers.set("X-Reflection-Prompt-1", randomPromptSet[0])
    streamingResponse.headers.set("X-Reflection-Prompt-2", randomPromptSet[1])
    
    // Also add importance level as header for potential UI customization
    streamingResponse.headers.set("X-Decision-Importance", importanceLevel)

    return streamingResponse
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response("Sorry, there was an error processing your request.", { status: 500 })
  }
}
