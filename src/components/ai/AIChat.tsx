import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Send, User } from "lucide-react";
import { supabase } from "../../../supabase/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AITeacherProps {
  className?: string;
}

export default function AIChat({ className = "" }: AITeacherProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add initial welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hello! I'm your AI music assistant. I can help you with practice techniques, provide feedback on your progress, and suggest exercises tailored to your skill level. What would you like help with today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // First, check if user has a DeepSeek API key in settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("deepseek_api_key")
        .eq("user_id", user?.id)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        console.error("Error fetching user settings:", settingsError);
      }

      const deepseekApiKey = settingsData?.deepseek_api_key;

      // If user has a DeepSeek API key, use it
      if (deepseekApiKey) {
        try {
          // Call Supabase Edge Function with the API key
          const { data, error } = await supabase.functions.invoke(
            "ai-teacher",
            {
              body: {
                message: input,
                userId: user?.id,
                userEmail: user?.email,
                apiKey: deepseekApiKey,
              },
            },
          );

          if (error) throw error;

          // Use the response from the edge function
          if (data && data.response) {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.response,
              timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setLoading(false);
            return;
          }
        } catch (functionError) {
          console.log("DeepSeek API error, using fallback:", functionError);
          // Continue to fallback if DeepSeek API fails
        }
      }

      // Try to call Supabase Edge Function without API key as fallback
      try {
        const { data, error } = await supabase.functions.invoke("ai-teacher", {
          body: {
            message: input,
            userId: user?.id,
            userEmail: user?.email,
          },
        });

        if (error) throw error;

        // Use the response from the edge function if available
        if (data && data.response) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setLoading(false);
          return;
        }
      } catch (functionError) {
        console.log("Edge function error, using fallback:", functionError);
        // Continue to fallback if edge function fails
      }

      // If all else fails, use a simulated response
      const aiResponse = simulateAIResponse(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Fallback response in case of error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simulate AI response for testing
  const simulateAIResponse = (userInput: string) => {
    const responses = [
      "Based on your practice history, I recommend focusing on improving your finger technique. Try practicing scales slowly with a metronome, gradually increasing the tempo as you become more comfortable.",
      "For Bach's pieces, pay special attention to articulation and ornaments. Try practicing each hand separately before combining them.",
      "To improve your sight-reading skills, I recommend spending 10-15 minutes each day reading through new pieces at a comfortable tempo. Don't worry about mistakes - the goal is to keep going and train your eyes to look ahead.",
      "For your current repertoire, I suggest dividing each piece into smaller sections and practicing them intensively. Focus on one section per day, and review previously mastered sections regularly.",
      "Based on your progress, you might be ready to tackle more challenging pieces. Consider adding some Chopin or Debussy to your repertoire to develop different aspects of your technique.",
      "When practicing the Moonlight Sonata, focus on maintaining an even tempo and bringing out the melody in the top voice while keeping the triplet accompaniment soft and flowing.",
      "For Chopin's Nocturnes, work on your pedaling technique. The pedal should create a smooth, connected sound without blurring harmonies.",
      "I recommend practicing with a metronome to develop a solid sense of rhythm, especially for pieces with complex rhythmic patterns.",
    ];

    // Simple keyword matching for more relevant responses
    if (userInput.toLowerCase().includes("bach")) {
      return "For Bach's counterpoint, I recommend practicing each voice separately before combining them. Pay attention to the independence of each line while maintaining a cohesive whole.";
    } else if (userInput.toLowerCase().includes("chopin")) {
      return "Chopin's music requires a delicate touch and expressive rubato. Practice with a flexible wrist and focus on creating a singing tone for the melodies.";
    } else if (
      userInput.toLowerCase().includes("beginner") ||
      userInput.toLowerCase().includes("start")
    ) {
      return "For beginners, I recommend starting with pieces like Bach's Minuet in G, Clementi's Sonatinas, or Schumann's 'The Merry Farmer'. These pieces will help develop fundamental techniques while being musically rewarding.";
    } else if (
      userInput.toLowerCase().includes("technique") ||
      userInput.toLowerCase().includes("finger")
    ) {
      return "To improve finger technique, practice Hanon exercises, scales, and arpeggios daily. Start slowly with a metronome and gradually increase the tempo as you gain confidence and accuracy.";
    }

    // Return a random response if no keywords match
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-start max-w-[80%] gap-2">
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mt-1 bg-purple-100">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </Avatar>
              )}
              <div
                className={`rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div
                  className={`text-xs mt-1 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                    alt="User"
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start max-w-[80%] gap-2">
              <Avatar className="h-8 w-8 mt-1 bg-purple-100">
                <Sparkles className="h-4 w-4 text-purple-500" />
              </Avatar>
              <div className="rounded-lg p-4 bg-muted">
                <div className="flex space-x-2 items-center">
                  <div
                    className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Textarea
            placeholder="Ask about practice techniques, get feedback, or request exercises..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[60px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-[60px] w-[60px] rounded-full bg-primary"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
