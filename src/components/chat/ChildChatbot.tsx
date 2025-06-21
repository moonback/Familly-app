import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircleIcon, Loader2, SparklesIcon, RotateCcw, BarChart3, Send, Bot, User, Star, Trophy, Target, PiggyBank, ShoppingCart, Gift, AlertCircle, CheckCircle, Clock, Edit3, LocateIcon, Volume2, Zap, Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getChatbotResponse } from '@/lib/gemini';
import { useAuth } from '@/context/auth-context';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeather, getDailyForecast } from '@/lib/utils';

interface ChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
}

// Suggestions améliorées avec animations et couleurs
const quickQuestions = [
  { text: "Comment dois-je m'habiller ?", icon: "🧥", color: "from-amber-400 via-orange-400 to-red-400", glow: "shadow-amber-200" },
  { text: "Quelles sont mes missions ?", icon: "🎯", color: "from-blue-400 via-indigo-400 to-purple-400", glow: "shadow-blue-200" },
  { text: "Que puis-je acheter ?", icon: "🛒", color: "from-emerald-400 via-green-400 to-teal-400", glow: "shadow-emerald-200" },
  { text: "Quelles récompenses puis-je avoir ?", icon: "🏆", color: "from-purple-400 via-violet-400 to-pink-400", glow: "shadow-purple-200" },
  { text: "Suggère une activité !", icon: "🎲", color: "from-teal-400 via-cyan-400 to-sky-400", glow: "shadow-teal-200" },
  { text: "Donne-moi des conseils !", icon: "💡", color: "from-cyan-400 via-sky-400 to-blue-400", glow: "shadow-cyan-200" },
  { text: "Quelle est la météo ?", icon: "☀️", color: "from-yellow-300 via-yellow-400 to-orange-400", glow: "shadow-yellow-200" },
  { text: "Combien de points ai-je ?", icon: "⭐", color: "from-yellow-400 via-amber-400 to-orange-400", glow: "shadow-yellow-200" },
];

// Messages d'encouragement animés
const encouragementMessages = [
  "Tu es formidable ! 🌟",
  "Continue comme ça ! 🚀",
  "Tu fais du super travail ! ✨",
  "Je suis fier de toi ! 🎉"
];

// Nouveau composant FormattedMessage avec animations
const FormattedMessage = ({ text }: { text: string }) => {
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-600">$1</strong>')
    .replace(/\n/g, '<br />')
    .replace(/(\d+) points?/gi, '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold border border-amber-200 shadow-sm animate-pulse">⭐ $1 points</span>')
    .replace(/récompense[s]?/gi, '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold border border-purple-200 shadow-sm">🏆 récompense</span>')
    .replace(/mission[s]?/gi, '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold border border-blue-200 shadow-sm">🎯 mission</span>')
    .replace(/tirelire/gi, '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 px-3 py-1 rounded-full text-sm font-bold border border-pink-200 shadow-sm">🐷 tirelire</span>')
    .replace(/achat[s]?/gi, '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-200 shadow-sm">🛒 achat</span>')
    .replace(/cadeau[x]?/gi, '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold border border-orange-200 shadow-sm">🎁 cadeau</span>')
    .replace(/✅|terminé[e]?|complété[e]?/gi, '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-200 shadow-sm animate-bounce">✅ Terminé</span>')
    .replace(/⏳|en cours|en attente/gi, '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200 shadow-sm">⏳ En cours</span>')
    .replace(/❌|erreur|problème/gi, '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold border border-red-200 shadow-sm">❌ Attention</span>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-600 hover:text-blue-800 underline font-medium transition-colors">$1</a>');

  return (
    <div
      className="prose prose-sm max-w-none leading-relaxed"
      style={{ wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  );
};

// Composant d'avatar animé
const AnimatedAvatar = ({ sender, isTyping = false }: { sender: 'user' | 'bot', isTyping?: boolean }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${
        sender === 'user' 
          ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500' 
          : 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500'
      }`}
    >
      {sender === 'user' ? (
        <User className="w-5 h-5" />
      ) : (
        <motion.div
          animate={isTyping ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 0.5, repeat: isTyping ? Infinity : 0 }}
        >
          <Bot className="w-5 h-5" />
        </motion.div>
      )}
      
      {/* Effet de halo */}
      <div className={`absolute inset-0 rounded-full animate-pulse ${
        sender === 'user' 
          ? 'bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400' 
          : 'bg-gradient-to-br from-purple-400 via-pink-400 to-red-400'
      } opacity-20 scale-110`} />
    </motion.div>
  );
};

export default function ChildChatbot({ open, onOpenChange }: ChatbotProps) {
  const { user } = useAuth();
  const { childName } = useParams();
  const storageKey = `chatbot_history_${childName || 'default'}`;
  const chatbotNameKey = `chatbot_name_${childName || 'default'}`;
  
  // État pour le nom du chatbot
  const [chatbotName, setChatbotName] = useState<string>('Assistant Magique');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newChatbotName, setNewChatbotName] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([{
    sender: 'bot',
    text: `Salut ${childName ? decodeURIComponent(childName) : 'champion'} ! 👋✨ Je suis ton assistant magique ! Que puis-je faire pour toi aujourd'hui ?`,
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // États existants
  const [pendingActivity, setPendingActivity] = useState<null | { weather: any; age: number | null }>(null);
  const [pendingActivitySuggestion, setPendingActivitySuggestion] = useState<null | { step: 'players' | 'location', players?: 'seul' | 'plusieurs' }>(null);
  const [city, setCity] = useState<string>(() => {
    return localStorage.getItem('user_city') || 'Paris';
  });
  const [cityLoading, setCityLoading] = useState(false);

  // Charger l'historique et le nom du chatbot depuis le localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const savedName = localStorage.getItem(chatbotNameKey);
    
    if (savedName) {
      setChatbotName(savedName);
    }
    
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
  }, [childName]);

  // Sauvegarder l'historique à chaque changement
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, childName]);

  // Détection automatique de la ville au montage
  useEffect(() => {
    if (city && city !== 'Paris') return;
    setCityLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`);
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.address?.county || 'Paris';
          setCity(detectedCity);
          localStorage.setItem('user_city', detectedCity);
        } catch {
          setCity('Paris');
        } finally {
          setCityLoading(false);
        }
      }, () => {
        setCity('Paris');
        setCityLoading(false);
      }, { timeout: 8000 });
    } else {
      setCity('Paris');
      setCityLoading(false);
    }
  }, []);

  // Fonction pour afficher des encouragements aléatoirement
  useEffect(() => {
    if (messages.length > 3 && Math.random() < 0.3) {
      setShowEncouragement(true);
      const timeout = setTimeout(() => setShowEncouragement(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [messages.length]);

  // Fonction pour changer le nom du chatbot
  const handleNameChange = () => {
    if (newChatbotName.trim()) {
      setChatbotName(newChatbotName.trim());
      localStorage.setItem(chatbotNameKey, newChatbotName.trim());
      setIsEditingName(false);
      setNewChatbotName('');
      
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `Parfait ! Tu peux maintenant m'appeler "${newChatbotName.trim()}" ! 😊✨`,
        timestamp: new Date()
      }]);
    }
  };

  const cancelNameChange = () => {
    setIsEditingName(false);
    setNewChatbotName('');
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || input.trim();
    if (!messageContent) return;
    
    setMessages(prev => [...prev, { 
      sender: 'user', 
      text: messageContent,
      timestamp: new Date()
    }]);
    if (!content) setInput('');
    setLoading(true);

    // --- GESTION SUGGESTION ACTIVITÉ (MULTI-ÉTAPES) ---
    if (pendingActivitySuggestion) {
      if (pendingActivitySuggestion.step === 'players') {
        const players = messageContent.toLowerCase().includes('seul') ? 'seul' : 'plusieurs';
        setPendingActivitySuggestion({ step: 'location', players });
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: "Parfait ! Et tu préfères une activité à l'intérieur 🏠 ou à l'extérieur 🌳 ?",
          timestamp: new Date()
        }]);
        setLoading(false);
      } else if (pendingActivitySuggestion.step === 'location') {
        const location = messageContent.toLowerCase().includes('intérieur') ? 'à l\'intérieur' : 'à l\'extérieur';
        const { players } = pendingActivitySuggestion;

        try {
          const weather = await getWeather(city);
          const prompt = `L'enfant, ${childName ? decodeURIComponent(childName) : ''}, cherche une activité. Contraintes: ${players}, ${location}. Météo à ${city}: ${weather.description}, ${weather.temp}°C. Suggère 3 activités originales et amusantes. Pour chaque, donne: nom avec emoji, courte description, matériel. La réponse doit être en Markdown, engageante et créative.`;

          const conversationHistory = messages
            .slice(1).map(m => ({ role: m.sender === 'user' ? 'user' as const : 'model' as const, content: m.text }));
          
          conversationHistory.push({ role: 'user', content: prompt });

          const currentChildName = childName ? decodeURIComponent(childName) : '';
          const reply = await getChatbotResponse(conversationHistory, user?.id, currentChildName, chatbotName);
          
          setMessages(prev => [...prev, { sender: 'bot', text: reply, timestamp: new Date() }]);
        } catch (e) {
          setMessages(prev => [...prev, {
            sender: 'bot',
            text: `Oups, je n'arrive pas à trouver d'idée pour le moment. Réessaie un peu plus tard ! 😕`,
            timestamp: new Date()
          }]);
        } finally {
          setPendingActivitySuggestion(null);
          setLoading(false);
        }
      }
      return;
    }

    // Gestion des activités en attente (pour la tenue)
    if (pendingActivity) {
      try {
        const activity = messageContent;
        const { weather, age } = pendingActivity;
        const prompt = `Voici la météo à ${city} aujourd'hui : ${weather.temp}°C, ${weather.description}. L'enfant a ${age ? age + ' ans' : 'un âge inconnu'}. Il/elle va faire l'activité suivante : ${activity}. Quelle tenue conseilles-tu ? Sois bref, donne une suggestion concrète et adaptée à la météo, à l'âge et à l'activité.`;
        const conversationHistory = messages
          .slice(1)
          .concat({ sender: 'user', text: prompt })
          .map(m => ({
            role: m.sender === 'user' ? 'user' as const : 'model' as const,
            content: m.text
          }));
        const currentChildName = childName ? decodeURIComponent(childName) : '';
        const reply = await getChatbotResponse(conversationHistory, user?.id, currentChildName, chatbotName);
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: reply,
          timestamp: new Date()
        }]);
      } catch (e) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `Désolé, je n'arrive pas à générer une suggestion de tenue en ce moment. 😕`,
          timestamp: new Date()
        }]);
      } finally {
        setPendingActivity(null);
        setLoading(false);
      }
      return;
    }

    // --- INTERCEPTION DES QUESTIONS ---

    // Déclenchement de la suggestion d'activité
    const regexActivite = /(activité|jouer|faire quoi|s'occuper|m'ennuie)/i;
    if (regexActivite.test(messageContent)) {
      setPendingActivitySuggestion({ step: 'players' });
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "Super idée ! 🎲 Tu veux une activité à faire seul(e) ou avec des ami(e)s ?",
        timestamp: new Date()
      }]);
      setLoading(false);
      return;
    }

    // Interception météo
    const regexMeteo = /(météo|temps|température|fait-il chaud|froid|quel temps|quelle température)/i;
    if (regexMeteo.test(messageContent)) {
      try {
        const forecast = await getDailyForecast(city);
        let emoji = '🌤️';
        const desc = forecast.description.toLowerCase();
        if (desc.includes('pluie')) emoji = '🌧️';
        else if (desc.includes('orage')) emoji = '⛈️';
        else if (desc.includes('neige')) emoji = '❄️';
        else if (desc.includes('nuage')) emoji = '☁️';
        else if (desc.includes('soleil') || desc.includes('dégagé')) emoji = '☀️';
        else if (desc.includes('brume') || desc.includes('brouillard')) emoji = '🌫️';

        let conseil = '';
        if (forecast.temp_max >= 28) conseil = "Pense à bien t'hydrater et mets une casquette si tu sors ! 💧";
        else if (forecast.temp_min <= 5) conseil = "Couvre-toi bien, il fait frais aujourd'hui ! 🧥";
        else if (desc.includes('pluie')) conseil = "N'oublie pas ton parapluie ou un imperméable ! ☂️";
        else if (desc.includes('vent')) conseil = "Attention au vent, prends une veste ! 🌬️";
        else conseil = "Passe une super journée ! 🌟";

        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `${emoji} Voici la météo prévue aujourd'hui à ${city} :\n\n**🌅 Matin** : ${forecast.morning !== null ? forecast.morning + '°C' : 'N/A'}\n**☀️ Après-midi** : ${forecast.afternoon !== null ? forecast.afternoon + '°C' : 'N/A'}\n**🌙 Soir** : ${forecast.evening !== null ? forecast.evening + '°C' : 'N/A'}\n\n🌡️ Températures : de **${forecast.temp_min}°C** à **${forecast.temp_max}°C**\n🌤️ Temps : **${forecast.description}**\n\n${conseil}`,
          timestamp: new Date()
        }]);
      } catch (e) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `Désolé, je n'arrive pas à récupérer la météo en ce moment. 😕`,
          timestamp: new Date()
        }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Interception tenue
    const regexTenue = /(tenue|vêtements?|habiller|porter|comment m'habiller|comment dois-je m'habiller|comment dois-je m\s?habiller|comment s'habiller|comment s\s?habiller|que dois-je porter|quelle tenue)/i;
    if (regexTenue.test(messageContent)) {
      try {
        const weather = await getWeather(city);
        let age: number | null = null;
        const activities = ['école', 'sport', 'maison', 'sortie', 'plage', 'piscine', 'parc', 'anniversaire', 'balade', 'randonnée', 'vacances', 'voyage', 'fête', 'dormir', 'pyjama', 'jeux', 'dehors', 'extérieur', 'intérieur'];
        const foundActivity = activities.find(act => messageContent.toLowerCase().includes(act));
        if (foundActivity) {
          const prompt = `Voici la météo à ${city} aujourd'hui : ${weather.temp}°C, ${weather.description}. L'enfant a ${age ? age + ' ans' : 'un âge inconnu'}. Il/elle va faire l'activité suivante : ${foundActivity}. Quelle tenue conseilles-tu ? Sois bref, donne une suggestion concrète et adaptée à la météo, à l'âge et à l'activité.`;
          const conversationHistory = messages
            .slice(1)
            .concat({ sender: 'user', text: prompt })
            .map(m => ({
              role: m.sender === 'user' ? 'user' as const : 'model' as const,
              content: m.text
            }));
          const currentChildName = childName ? decodeURIComponent(childName) : '';
          const reply = await getChatbotResponse(conversationHistory, user?.id, currentChildName, chatbotName);
          setMessages(prev => [...prev, {
            sender: 'bot',
            text: reply,
            timestamp: new Date()
          }]);
        } else {
          setMessages(prev => [...prev, {
            sender: 'bot',
            text: `Pour quelle activité veux-tu une suggestion de tenue ? (école, sport, sortie, maison…) 🤔`,
            timestamp: new Date()
          }]);
          setPendingActivity({ weather, age });
        }
      } catch (e) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `Désolé, je n'arrive pas à récupérer la météo ou à générer une suggestion de tenue en ce moment. 😕`,
          timestamp: new Date()
        }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const conversationHistory = messages
        .slice(1)
        .concat({ sender: 'user', text: messageContent })
        .map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'model' as const,
          content: m.text
        }));
      
      const currentChildName = childName ? decodeURIComponent(childName) : '';
      const reply = await getChatbotResponse(conversationHistory, user?.id, currentChildName, chatbotName);
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
      text: `Salut ${childName ? decodeURIComponent(childName) : 'champion'} ! 👋✨ Je suis ${chatbotName}. Je peux t'aider avec tes missions, tes points, tes récompenses et bien plus encore ! Que puis-je faire pour toi aujourd'hui ?`,
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

  const handleLocate = async () => {
    setCityLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`);
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.address?.county || 'Paris';
          setCity(detectedCity);
          localStorage.setItem('user_city', detectedCity);
        } catch {
          setCity('Paris');
        } finally {
          setCityLoading(false);
        }
      }, () => {
        setCity('Paris');
        setCityLoading(false);
      }, { timeout: 8000 });
    } else {
      setCity('Paris');
      setCityLoading(false);
    }
  };

  // Scroll automatique
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95%] max-h-[90vh] flex flex-col p-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-0 shadow-2xl overflow-hidden">
        
        {/* Message d'encouragement flottant */}
        <AnimatePresence>
          {showEncouragement && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm flex items-center gap-2"
            >
              <Heart className="w-4 h-4 animate-pulse" />
              {encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header amélioré */}
        <DialogHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white p-6 relative overflow-hidden">
          {/* Effet de particules en arrière-plan */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                initial={{ 
                  x: Math.random() * 400, 
                  y: Math.random() * 100,
                  opacity: 0 
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [null, -20, -40]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 bg-white/20 rounded-full backdrop-blur-sm"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircleIcon className="w-7 h-7" />
              </motion.div>
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newChatbotName}
                      onChange={(e) => setNewChatbotName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleNameChange();
                        } else if (e.key === 'Escape') {
                          cancelNameChange();
                        }
                      }}
                      placeholder="Nouveau nom..."
                      className="bg-white/20 text-white placeholder-white/70 border-white/30 focus:border-white/50 backdrop-blur-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleNameChange}
                      className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      onClick={cancelNameChange}
                      className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                      {chatbotName}
                      <SparklesIcon className="w-6 h-6 animate-pulse" />
                    </DialogTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingName(true);
                        setNewChatbotName(chatbotName);
                      }}
                      className="text-white hover:bg-white/20 p-2 backdrop-blur-sm"
                      title="Changer le nom du chatbot"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-lg text-white/90 font-medium">
                  Bonjour {childName ? decodeURIComponent(childName) : 'champion'} ! 🌟
                </p>
                
                {/* Ville avec design amélioré */}
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLocate}
                    className="text-white hover:bg-white/20 px-3 py-2 backdrop-blur-sm rounded-full"
                    title="Localiser ma ville"
                    disabled={cityLoading}
                  >
                    <LocateIcon className="w-4 h-4 mr-2" />
                    {cityLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> 
                        Localisation...
                      </span>
                    ) : (
                      <span>Localiser</span>
                    )}
                  </Button>
                  <span className="text-sm text-white/90 bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
                    {cityLoading ? '...' : city}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={askForStats}
                disabled={loading}
                className="text-white hover:bg-white/20 p-2 backdrop-blur-sm"
                title="Demander des statistiques"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetConversation}
                disabled={loading}
                className="text-white hover:bg-white/20 p-2 backdrop-blur-sm"
                title="Nouvelle conversation"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Zone de chat améliorée */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -25, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className={`flex items-end gap-3 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}
              >
                <AnimatedAvatar sender={m.sender} />
                <div className={`rounded-3xl px-5 py-3 shadow-lg ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white rounded-br-lg'
                    : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-800 rounded-bl-lg'
                }`}>
                  {m.sender === 'bot' ? (
                    <FormattedMessage text={m.text} />
                  ) : (
                    <p className="text-base leading-relaxed">{m.text}</p>
                  )}
                  {m.timestamp && (
                    <p className={`text-xs mt-2 text-right ${
                      m.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {formatTime(m.timestamp)}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Indicateur de chargement animé */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-end gap-3"
            >
              <AnimatedAvatar sender="bot" isTyping={true} />
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl rounded-bl-lg px-5 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 bg-purple-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1], y: [0, -2, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-purple-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1], y: [0, -2, 0] }}
                    transition={{ duration: 0.8, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-purple-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1], y: [0, -2, 0] }}
                    transition={{ duration: 0.8, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions de questions rapides améliorées */}
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="px-6 pb-4"
          >
            <h4 className="text-sm font-semibold text-purple-800/80 mb-3 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-500" />
              Suggestions Magiques
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickQuestions.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickQuestion(q.text)}
                  disabled={loading}
                  className={`flex flex-col items-center justify-center w-full p-3 rounded-2xl font-semibold text-xs text-center text-white bg-gradient-to-br ${q.color} shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${q.glow} hover:${q.glow}`}
                >
                  <span className="text-2xl mb-1">{q.icon}</span>
                  <span className="leading-tight">{q.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Zone de saisie améliorée */}
        <div className="p-6 pt-2 border-t border-purple-200/50 bg-white/30 backdrop-blur-sm">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Écris ton message magique..."
              className="w-full pr-14 pl-5 py-3 bg-white/80 border-2 border-purple-200/50 focus:border-purple-400 focus:ring-4 focus:ring-purple-200/50 rounded-full shadow-inner transition-all duration-300"
              disabled={loading}
            />
            <motion.button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Appuie sur Entrée pour envoyer, Maj+Entrée pour sauter une ligne
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
