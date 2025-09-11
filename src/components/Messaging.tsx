import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_name: string;
  message: string;
  created_at: string;
  isMe: boolean;
}

interface MessagingProps {
  recipientId: string;
  recipientName: string;
  recipientType: 'tutor' | 'student';
}

export function Messaging({ recipientId, recipientName, recipientType }: MessagingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    try {
      setSending(true);
      
      // Mock message sending for demo
      const mockMessage: Message = {
        id: Date.now().toString(),
        sender_name: user.user_metadata?.full_name || 'You',
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        isMe: true
      };

      setMessages(prev => [...prev, mockMessage]);
      setNewMessage('');
      
      // Mock email notification
      console.log(`📧 Email notification sent to ${recipientName}: New message from ${user.user_metadata?.full_name || 'Unknown'}`);
      
      // Auto-reply after 2 seconds for demo
      setTimeout(() => {
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          sender_name: recipientName,
          message: `Thanks for your message! I'll get back to you soon.`,
          created_at: new Date().toISOString(),
          isMe: false
        };
        setMessages(prev => [...prev, autoReply]);
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to send messages</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat with {recipientName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No messages yet. Start a conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isMe && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.sender_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.isMe
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
                {message.isMe && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.sender_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}