import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, X, ArrowRight, Minimize2, Maximize2, Power, Terminal, TerminalSquare, RefreshCw } from 'lucide-react';
import Anthropic from '@anthropic-ai/sdk';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RobotAssistantProps {
  activeWebsiteUrl?: string;
  websiteTitle?: string;
  onPerformAction?: (action: {type: string; data: any}) => void;
}

export default function RobotAssistant({ 
  activeWebsiteUrl,
  websiteTitle,
  onPerformAction
}: RobotAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'I am a helpful robot assistant. I can help you interact with websites and answer questions. Ask me anything!'
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hello! I\'m your robot assistant. How can I help you with your bookmarks today?'
    }
  ]);
  const [isActive, setIsActive] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to the most recent message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if ANTHROPIC_API_KEY is available in environment
  useEffect(() => {
    // This is a placeholder. The actual check would be handled by your backend
    const storedKey = localStorage.getItem('ANTHROPIC_API_KEY');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('ANTHROPIC_API_KEY', apiKey);
      setShowApiKeyInput(false);
      toast({
        title: 'API Key Saved',
        description: 'Your Anthropic API key has been saved.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Please enter a valid API key.',
        variant: 'destructive',
      });
    }
  };

  const generateSystemPrompt = () => {
    let prompt = 'You are a helpful robot assistant. ';
    
    if (activeWebsiteUrl) {
      prompt += `The user is currently viewing: ${websiteTitle || 'a website'} (${activeWebsiteUrl}). `;
    }
    
    prompt += 'Provide concise, helpful responses. If the user asks you to perform actions on the current website, recommend UI interactions they can try.';
    
    return prompt;
  };

  const handleSendMessage = async () => {
    if (userInput.trim() === '') return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);
    
    if (userInput.toLowerCase().includes('api key') || userInput.toLowerCase().includes('apikey')) {
      setShowApiKeyInput(true);
      setIsTyping(false);
      return;
    }
    
    try {
      // If we don't have an API key, use a mock response
      if (!apiKey) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let responseText = 'I need an Anthropic API key to provide intelligent responses. Please set your API key by typing "set API key" or click the settings button.';
        
        if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
          responseText = 'Hello! I\'m your robot assistant. How can I help you today?';
        } else if (userInput.toLowerCase().includes('help')) {
          responseText = 'I can help you with your bookmarks, answer questions, and assist with website interactions. What would you like to know?';
        }
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseText,
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        return;
      }
      
      // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      // Prepare conversation history
      const anthropic = new Anthropic({
        apiKey: apiKey,
      });
      
      const systemPrompt = generateSystemPrompt();
      
      // Convert messages to Anthropic format (exclude system messages)
      const messagesToSend = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      // Add user's new message
      messagesToSend.push({
        role: 'user',
        content: userInput
      });
      
      // Call Anthropic API
      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        max_tokens: 1000,
        messages: messagesToSend,
      });
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content[0].text,
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Check if the response contains actionable content
      handleRobotActions(response.content[0].text);
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again later or check your API key.',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleRobotActions = (responseText: string) => {
    // Simple pattern matching for actionable content
    // In a real implementation, this would be more sophisticated
    
    if (responseText.includes('refresh the page') && onPerformAction) {
      onPerformAction({ type: 'refresh', data: {} });
    } else if (responseText.includes('search for') && onPerformAction) {
      const searchMatch = responseText.match(/search for ["]([^"]+)["]/);
      if (searchMatch && searchMatch[1]) {
        onPerformAction({ 
          type: 'search', 
          data: { query: searchMatch[1] } 
        });
      }
    } else if (responseText.includes('click on') && onPerformAction) {
      const clickMatch = responseText.match(/click on ["]([^"]+)["]/);
      if (clickMatch && clickMatch[1]) {
        onPerformAction({ 
          type: 'click', 
          data: { elementText: clickMatch[1] } 
        });
      }
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'system',
        content: 'I am a helpful robot assistant. I can help you interact with websites and answer questions. Ask me anything!'
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Chat cleared. How can I help you?'
      }
    ]);
  };
  
  const togglePower = () => {
    setIsActive(!isActive);
    
    toast({
      title: isActive ? 'Assistant Deactivated' : 'Assistant Activated',
      description: isActive ? 'The robot assistant has been turned off.' : 'The robot assistant is now ready to help.',
    });
    
    if (!isActive) {
      // Reset assistant when powering back on
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I\'m back online! How can I help you?'
        }
      ]);
    }
  };

  const renderMessage = (message: Message) => {
    if (message.role === 'system') return null;
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-3 ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
      >
        <div
          className={`max-w-[80%] rounded-lg p-3 ${
            message.role === 'user'
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted mr-auto'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Robot icon button */}
      <motion.button
        className="fixed bottom-4 left-4 z-50 size-12 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-105 transition-transform"
        onClick={toggleChat}
        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
      >
        <Bot className="h-6 w-6" />
        {isOpen && <span className="sr-only">Close robot assistant</span>}
        {!isOpen && <span className="sr-only">Open robot assistant</span>}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '60px' : '500px' 
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-4 z-50 w-80 bg-background rounded-lg shadow-xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary text-primary-foreground p-3">
              <div className="flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                <h3 className="font-semibold text-sm">Robot Assistant</h3>
              </div>
              <div className="flex space-x-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/10" 
                  onClick={toggleMinimize}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/10" 
                  onClick={toggleChat}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body - only visible when not minimized */}
            {!isMinimized && (
              <>
                {/* Message container */}
                <div className="flex-1 h-[360px] overflow-y-auto p-3">
                  {messages.map(renderMessage)}
                  {isTyping && (
                    <div className="flex space-x-2 p-2 bg-muted rounded w-16 mr-auto">
                      <div className="size-2 bg-foreground/50 rounded-full animate-bounce"></div>
                      <div className="size-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="size-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* API Key Input Form (conditionally rendered) */}
                {showApiKeyInput && (
                  <div className="p-3 border-t border-border">
                    <label className="block text-sm font-medium mb-1">Enter Anthropic API Key</label>
                    <div className="flex space-x-2">
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className="flex-1"
                      />
                      <Button onClick={saveApiKey} size="sm">Save</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be stored locally in your browser.
                    </p>
                  </div>
                )}

                {/* Message input */}
                {!showApiKeyInput && isActive && (
                  <div className="p-3 border-t border-border">
                    <div className="flex space-x-2">
                      <Input
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask me anything..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} size="icon">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="p-2 border-t border-border flex justify-between items-center bg-muted/50">
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={togglePower}
                      title={isActive ? "Turn off assistant" : "Turn on assistant"}
                    >
                      <Power className={`h-4 w-4 ${isActive ? 'text-green-500' : 'text-red-500'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowApiKeyInput(true)}
                      title="Settings"
                    >
                      <Terminal className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={clearChat}
                      title="Clear chat"
                    >
                      <TerminalSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setMessages(prev => [
                          ...prev.filter(m => m.role === 'system'),
                          {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: "Hi! I'm your robot assistant. How can I help you today?"
                          }
                        ]);
                      }}
                      title="Reset assistant"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}