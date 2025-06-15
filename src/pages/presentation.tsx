import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { motion } from 'framer-motion';

const PresentationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard/parent');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: "🎯",
      title: "Gestion des tâches",
      description: "Créez et suivez les corvées et activités quotidiennes"
    },
    {
      icon: "⚖️",
      title: "Règles de comportement",
      description: "Définissez des règles claires avec système de pénalités"
    },
    {
      icon: "🛍️",
      title: "Récompenses & Boutique",
      description: "Échangez les points gagnés contre des cadeaux personnalisés"
    },
    {
      icon: "🐷",
      title: "Tirelire virtuelle",
      description: "Épargnez des points pour de futurs achats plus importants"
    },
    {
      icon: "❓",
      title: "Devinettes quotidiennes",
      description: "Répondez à une énigme journalière pour gagner des bonus"
    },
    {
      icon: "📈",
      title: "Analytics & progression",
      description: "Suivez l'évolution des points et des réussites de chaque enfant"
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Interface adaptée",
      description: "Un mode enfant ludique et un espace parent complet"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <motion.h1
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Family App
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-600 mb-8"
            >
              Simplifiez la gestion de votre famille au quotidien
            </motion.p>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={() => navigate('/auth')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Commencer maintenant
            </motion.button>
          </motion.div>

          {/* Fonctionnalités */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 * index }}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Appel à l'action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center bg-white p-8 rounded-2xl shadow-lg"
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Prêt à commencer ?</h2>
            <p className="text-gray-600 mb-6">
              Rejoignez dès maintenant Family App et transformez la gestion de votre famille
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Créer un compte
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PresentationPage; 