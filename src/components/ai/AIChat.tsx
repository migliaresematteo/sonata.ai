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
      // First, check if user has a DeepSeek API key in settings
      const checkApiKey = async () => {
        try {
          const { data: settingsData, error: settingsError } = await supabase
            .from("user_settings")
            .select("deepseek_api_key")
            .eq("user_id", user?.id)
            .single();

          if (settingsError && settingsError.code !== "PGRST116") {
            console.error("Error fetching user settings:", settingsError);
          }

          const deepseekApiKey = settingsData?.deepseek_api_key;

          if (deepseekApiKey) {
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content:
                  "Hello! I'm your AI music assistant. I can help you with practice techniques, provide feedback on your progress, and suggest exercises tailored to your skill level. What would you like help with today?",
                timestamp: new Date(),
              },
            ]);
          } else {
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content:
                  "Welcome to the AI music assistant! To use this feature, please add your DeepSeek API key in the Settings page. This will unlock personalized practice recommendations and feedback tailored to your needs.",
                timestamp: new Date(),
              },
            ]);
          }
        } catch (error) {
          console.error("Error checking API key:", error);
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content:
                "Welcome to the AI music assistant! There was an issue checking your settings. Please make sure you have added your DeepSeek API key in the Settings page to use this feature.",
              timestamp: new Date(),
            },
          ]);
        }
      };

      checkApiKey();
    }
  }, [messages.length, user?.id]);

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

      // If user doesn't have a DeepSeek API key, show a message to add one
      if (!deepseekApiKey) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "To use the AI assistant features, please add your DeepSeek API key in the Settings page. This allows you to get personalized practice recommendations and feedback.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setLoading(false);
        return;
      }

      // User has a DeepSeek API key, use it
      try {
        // Call Supabase Edge Function with the API key
        const { data, error } = await supabase.functions.invoke("ai-teacher", {
          body: {
            message: input,
            userId: user?.id,
            userEmail: user?.email,
            apiKey: deepseekApiKey,
          },
        });

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
        console.log("DeepSeek API error:", functionError);

        // Show error message about API key
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "There was an issue with your DeepSeek API key. Please check that it's valid in the Settings page.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
        setLoading(false);
        return;
      }
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
