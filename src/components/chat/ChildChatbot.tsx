import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircleIcon, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getChatbotResponse } from '@/lib/gemini';

interface ChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export default function ChildChatbot({ open, onOpenChange }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    sender: 'bot',
    text: "Bonjour ! Je suis ton assistant. Comment puis-je t'aider aujourd'hui ?"
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    
    // Ajouter le message utilisateur à l'historique local
    setMessages(prev => [...prev, { sender: 'user', text: content }]);
    setInput('');
    setLoading(true);
    
    try {
      // Créer l'historique pour Gemini en excluant le message de bienvenue initial
      // et en ne gardant que les messages réels de la conversation
      const conversationHistory = messages
        .slice(1) // Exclure le message de bienvenue initial
        .concat({ sender: 'user', text: content })
        .map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'model' as const,
          content: m.text
        }));
      
      const reply = await getChatbotResponse(conversationHistory);
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      console.error('Erreur chatbot:', error);
      toast({
        title: 'Erreur',
        description: "Le chatbot n'a pas pu répondre",
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircleIcon className="w-5 h-5" />
            Assistant
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 pb-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                m.sender === 'user'
                  ? 'bg-blue-100 ml-auto'
                  : 'bg-gray-100'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Écris ton message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
