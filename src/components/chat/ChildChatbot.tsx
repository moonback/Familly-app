import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircleIcon, Loader2, SparklesIcon, RotateCcw, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getChatbotResponse } from '@/lib/gemini';
import { useAuth } from '@/context/auth-context';
import { useParams } from 'react-router-dom';

interface ChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

// Suggestions de questions rapides
const quickQuestions = [
  "Combien de points ai-je ?",
  "Quelles sont mes missions ?",
  "Que puis-je acheter ?",
  "Comment va ma tirelire ?",
  "Quelles récompenses puis-je avoir ?",
  "Quelles règles dois-je respecter ?",
  "Qu'ai-je acheté récemment ?",
  "Donne-moi des conseils !"
];

export default function ChildChatbot({ open, onOpenChange }: ChatbotProps) {
  const { user } = useAuth();
  const { childName } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    sender: 'bot',
    text: `Bonjour ${childName ? decodeURIComponent(childName) : ''} ! Je suis ton assistant familial. Je peux t'aider avec tes missions, tes points, tes récompenses et bien plus encore ! Que puis-je faire pour toi aujourd'hui ?`
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content?: string) => {
    const messageContent = content || input.trim();
    if (!messageContent) return;
    
    // Ajouter le message utilisateur à l'historique local
    setMessages(prev => [...prev, { sender: 'user', text: messageContent }]);
    if (!content) setInput('');
    setLoading(true);
    
    try {
      // Créer l'historique pour Gemini en excluant le message de bienvenue initial
      // et en ne gardant que les messages réels de la conversation
      const conversationHistory = messages
        .slice(1) // Exclure le message de bienvenue initial
        .concat({ sender: 'user', text: messageContent })
        .map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'model' as const,
          content: m.text
        }));
      
      // Passer l'ID de l'utilisateur et le nom de l'enfant pour accéder aux données de la famille
      const currentChildName = childName ? decodeURIComponent(childName) : '';
      const reply = await getChatbotResponse(conversationHistory, user?.id, currentChildName);
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

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const resetConversation = () => {
    setMessages([{
      sender: 'bot',
      text: `Bonjour ${childName ? decodeURIComponent(childName) : ''} ! Je suis ton assistant familial. Je peux t'aider avec tes missions, tes points, tes récompenses et bien plus encore ! Que puis-je faire pour toi aujourd'hui ?`
    }]);
    setInput('');
  };

  const askForStats = () => {
    sendMessage("Peux-tu me donner un résumé de mes statistiques et de ma progression ?");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md flex flex-col h-[70vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircleIcon className="w-5 h-5" />
              Assistant Familial - {childName ? decodeURIComponent(childName) : ''}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={askForStats}
                disabled={loading}
                title="Demander des statistiques"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetConversation}
                disabled={loading}
                title="Nouvelle conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Suggestions de questions rapides */}
        {messages.length === 1 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">💡 Questions rapides :</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={loading}
                  className="text-xs bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}
        
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
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              L'assistant réfléchit...
            </div>
          )}
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
            disabled={loading}
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
