import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircleIcon, Loader2, SparklesIcon, RotateCcw, BarChart3, Send, Bot, User, Star, Trophy, Target, PiggyBank, ShoppingCart, Gift, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getChatbotResponse } from '@/lib/gemini';
import { useAuth } from '@/context/auth-context';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
}

// Suggestions de questions rapides avec icônes
const quickQuestions = [
  { text: "Combien de points ai-je ?", icon: "⭐", color: "from-yellow-400 to-orange-400" },
  { text: "Quelles sont mes missions ?", icon: "🎯", color: "from-blue-400 to-indigo-400" },
  { text: "Que puis-je acheter ?", icon: "🛒", color: "from-green-400 to-emerald-400" },
  { text: "Comment va ma tirelire ?", icon: "🐷", color: "from-pink-400 to-rose-400" },
  { text: "Quelles récompenses puis-je avoir ?", icon: "🏆", color: "from-purple-400 to-violet-400" },
  { text: "Quelles règles dois-je respecter ?", icon: "📋", color: "from-red-400 to-pink-400" },
  { text: "Qu'ai-je acheté récemment ?", icon: "📦", color: "from-indigo-400 to-purple-400" },
  { text: "Donne-moi des conseils !", icon: "💡", color: "from-cyan-400 to-blue-400" }
];

// Nouveau composant FormattedMessage simple et compatible HTML
const FormattedMessage = ({ text }: { text: string }) => {
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // gras markdown
    .replace(/\n/g, '<br />')
    .replace(/(\d+) points?/gi, '<span style="background:#FEF3C7;color:#92400E;padding:2px 6px;border-radius:8px;font-weight:bold;">⭐ $1 points</span>')
    .replace(/récompense[s]?/gi, '<span style="background:#EDE9FE;color:#6D28D9;padding:2px 6px;border-radius:8px;font-weight:bold;">🏆 récompense</span>')
    .replace(/mission[s]?/gi, '<span style="background:#DBEAFE;color:#1D4ED8;padding:2px 6px;border-radius:8px;font-weight:bold;">🎯 mission</span>')
    .replace(/tirelire/gi, '<span style="background:#FCE7F3;color:#BE185D;padding:2px 6px;border-radius:8px;font-weight:bold;">🐷 tirelire</span>')
    .replace(/achat[s]?/gi, '<span style="background:#DCFCE7;color:#166534;padding:2px 6px;border-radius:8px;font-weight:bold;">🛒 achat</span>')
    .replace(/cadeau[x]?/gi, '<span style="background:#FFEDD5;color:#C2410C;padding:2px 6px;border-radius:8px;font-weight:bold;">🎁 cadeau</span>')
    .replace(/✅|terminé[e]?|complété[e]?/gi, '<span style="background:#D1FAE5;color:#065F46;padding:2px 6px;border-radius:8px;font-weight:bold;">✅ Terminé</span>')
    .replace(/⏳|en cours|en attente/gi, '<span style="background:#FEF9C3;color:#92400E;padding:2px 6px;border-radius:8px;font-weight:bold;">⏳ En cours</span>')
    .replace(/❌|erreur|problème/gi, '<span style="background:#FECACA;color:#991B1B;padding:2px 6px;border-radius:8px;font-weight:bold;">❌ Attention</span>')
    // liens
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#2563EB;text-decoration:underline;">$1</a>');

  // Listes à la main (optionnel)
  formatted = formatted.replace(/(?:^|\n)[-•*] (.+)/g, '<ul style="margin:8px 0 8px 16px;"><li>$1</li></ul>');

  return (
    <div
      className="prose prose-sm max-w-none"
      style={{ wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  );
};

export default function ChildChatbot({ open, onOpenChange }: ChatbotProps) {
  const { user } = useAuth();
  const { childName } = useParams();
  const storageKey = `chatbot_history_${childName || 'default'}`;
  const [messages, setMessages] = useState<ChatMessage[]>([{
    sender: 'bot',
    text: `Bonjour ${childName ? decodeURIComponent(childName) : ''} ! 👋 Je suis ton assistant familial intelligent. Je peux t'aider avec tes missions, tes points, tes récompenses et bien plus encore ! Que puis-je faire pour toi aujourd'hui ?`,
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger l'historique depuis le localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
        })));
      } catch {
        // Si erreur, on garde le message de bienvenue
      }
    }
    // eslint-disable-next-line
  }, [childName]);

  // Sauvegarder l'historique à chaque changement
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
    // eslint-disable-next-line
  }, [messages, childName]);

  const sendMessage = async (content?: string) => {
    const messageContent = content || input.trim();
    if (!messageContent) return;
    
    // Ajouter le message utilisateur à l'historique local
    setMessages(prev => [...prev, { 
      sender: 'user', 
      text: messageContent,
      timestamp: new Date()
    }]);
    if (!content) setInput('');
    setLoading(true);
    
    try {
      // Créer l'historique pour Gemini en excluant le message de bienvenue initial
      const conversationHistory = messages
        .slice(1)
        .concat({ sender: 'user', text: messageContent })
        .map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'model' as const,
          content: m.text
        }));
      
      const currentChildName = childName ? decodeURIComponent(childName) : '';
      const reply = await getChatbotResponse(conversationHistory, user?.id, currentChildName);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: reply,
        timestamp: new Date()
      }]);
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
    const welcome = [{
      sender: 'bot' as const,
      text: `Bonjour ${childName ? decodeURIComponent(childName) : ''} ! 👋 Je suis ton assistant personnel. Je peux t'aider avec tes missions, tes points, tes récompenses et bien plus encore ! Que puis-je faire pour toi aujourd'hui ?`,
      timestamp: new Date()
    }];
    setMessages(welcome);
    setInput('');
    localStorage.setItem(storageKey, JSON.stringify(welcome));
  };

  const askForStats = () => {
    sendMessage("Peux-tu me donner un résumé de mes statistiques et de ma progression ?");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col h-[80vh] p-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-0 shadow-2xl">
        {/* Header avec gradient */}
        <DialogHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <MessageCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Assistant Personnel
                </DialogTitle>
                <p className="text-sm text-white/80">
                  {childName ? decodeURIComponent(childName) : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={askForStats}
                disabled={loading}
                className="text-white hover:bg-white/20"
                title="Demander des statistiques"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetConversation}
                disabled={loading}
                className="text-white hover:bg-white/20"
                title="Nouvelle conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Zone de chat avec scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-3 max-w-[85%] ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    m.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}>
                    {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  {/* Message */}
                  <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    {m.sender === 'bot' ? (
                      <FormattedMessage text={m.text} />
                    ) : (
                      <p className="text-sm leading-relaxed">{m.text}</p>
                    )}
                    {m.timestamp && (
                      <p className={`text-xs mt-2 ${
                        m.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {formatTime(m.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Indicateur de chargement */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  <span className="text-sm text-gray-600">L'assistant réfléchit...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Suggestions de questions rapides */}
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 pb-4"
          >
            <p className="text-sm text-gray-600 mb-3 font-medium">💡 Questions rapides :</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleQuickQuestion(question.text)}
                  disabled={loading}
                  className={`p-3 rounded-xl text-left text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r ${question.color} text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{question.icon}</span>
                    <span>{question.text}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Zone de saisie */}
        <div className="p-6 pt-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Écris ton message..."
                className="pr-12 bg-white border-2 border-gray-200 focus:border-purple-400 rounded-2xl py-3 px-4 shadow-sm transition-all duration-200"
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full w-8 h-8 p-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Appuie sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
