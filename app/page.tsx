"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "../components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// Types for our messages
type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  // State for messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "What decision are you facing?",
    },
  ])

  // State for input
  const [input, setInput] = useState("")

  // Loading state
  const [isLoading, setIsLoading] = useState(false)

  // Decision importance state
  const [decisionImportance, setDecisionImportance] = useState<string>("undefined")

  // Timer states
  const [timerActive, setTimerActive] = useState(false)
  const [timerDuration, setTimerDuration] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [reflectionPrompts, setReflectionPrompts] = useState<string[]>([])

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Function to send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading || timerActive) return

    // Add user message to state
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Send message to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      // Check if we should set a timer
      const timerDuration = Number.parseInt(response.headers.get("X-Timer-Duration") || "0")
      const prompt1 = response.headers.get("X-Reflection-Prompt-1") || ""
      const prompt2 = response.headers.get("X-Reflection-Prompt-2") || ""
      const importance = response.headers.get("X-Decision-Importance") || "undefined"
      
      // Update importance
      setDecisionImportance(importance)

      if (prompt1 && prompt2) {
        setReflectionPrompts([prompt1, prompt2])
      }

      // Get the response text
      const data = await response.text()

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Start timer if needed
      if (timerDuration > 0) {
        setTimerDuration(timerDuration)
        setTimeRemaining(timerDuration)
        setTimerActive(true)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I couldn't process your request. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Timer effect
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && timerActive) {
      setTimerActive(false)
      setReflectionPrompts([])
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timerActive, timeRemaining])

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading, timerActive])

  // Calculate progress percentage
  const progressPercentage = timerActive ? ((timerDuration - timeRemaining) / timerDuration) * 100 : 0

  // Handle key press in the textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Decision Assistant</CardTitle>
          <div className="flex items-center">
            <span className="text-xs mr-2">Importance:</span>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              decisionImportance === "trivial" ? "bg-green-100 text-green-800" :
              decisionImportance === "routine" ? "bg-blue-100 text-blue-800" :
              decisionImportance === "complex" ? "bg-yellow-100 text-yellow-800" :
              decisionImportance === "life-altering" ? "bg-red-100 text-red-800" :
              "bg-gray-100 text-gray-600"
            }`}>
              {decisionImportance === "undefined" ? "Assessing" : decisionImportance}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          {timerActive && reflectionPrompts.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-lg px-4 py-3 bg-amber-50 border border-amber-200">
                <div className="flex items-center text-amber-700 mb-3">
                  <Timer className="h-4 w-4 mr-2 flex-shrink-0" />
                  <p className="font-medium">Let's reflect: consider these points</p>
                </div>

                <div className="pl-6 mb-3">
                  <ol className="list-decimal pl-5 space-y-2 text-amber-700">
                    <li>{reflectionPrompts[0]}</li>
                    <li>{reflectionPrompts[1]}</li>
                  </ol>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>Reflection time</span>
                    <span>{timeRemaining}s remaining</span>
                  </div>
                  <Progress value={progressPercentage} className="h-1.5 bg-amber-100" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        <CardFooter className="border-t p-4">
          <form onSubmit={sendMessage} className="flex w-full space-x-2">
            <Textarea
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={timerActive ? `Please reflect for ${timeRemaining}s...` : "Type a message..."}
              className="flex-1 min-h-[60px] resize-none"
              disabled={isLoading || timerActive}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim() || timerActive}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
