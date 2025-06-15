import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HowItWorksPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      title: "1. Création du compte",
      description: "Commencez par créer votre compte parent. Vous pourrez ensuite ajouter vos enfants et personnaliser leurs profils.",
      details: [
        "Inscription avec email et mot de passe",
        "Vérification de l'email",
        "Configuration du profil parent",
        "Création des profils enfants"
      ],
      icon: "👤"
    },
    {
      title: "2. Configuration des tâches",
      description: "Définissez les tâches quotidiennes et hebdomadaires pour chaque enfant. Personnalisez les points et les récompenses.",
      details: [
        "Création de tâches personnalisées",
        "Définition des points par tâche",
        "Configuration des récompenses",
        "Planification des tâches récurrentes"
      ],
      icon: "📝"
    },
    {
      title: "3. Interface enfant",
      description: "Les enfants accèdent à leur espace personnel avec une interface adaptée à leur âge.",
      details: [
        "Tableau de bord personnalisé",
        "Liste des tâches du jour",
        "Suivi des points gagnés",
        "Catalogue de récompenses"
      ],
      icon: "👶"
    },
    {
      title: "4. Suivi des progrès",
      description: "Suivez en temps réel les progrès de vos enfants et leur motivation.",
      details: [
        "Statistiques quotidiennes",
        "Rapports hebdomadaires",
        "Historique des tâches",
        "Suivi des récompenses"
      ],
      icon: "📊"
    }
  ];

  const features = [
    {
      title: "Système de points",
      description: "Chaque tâche accomplie rapporte des points que les enfants peuvent échanger contre des récompenses.",
      icon: "⭐"
    },
    {
      title: "Récompenses personnalisées",
      description: "Définissez des récompenses adaptées à chaque enfant : temps d'écran, sorties, jouets, etc.",
      icon: "🎁"
    },
    {
      title: "Notifications",
      description: "Recevez des alertes pour les tâches importantes et les accomplissements.",
      icon: "🔔"
    },
    {
      title: "Tableau de bord parent",
      description: "Visualisez l'ensemble des activités et progrès de vos enfants en un coup d'œil.",
      icon: "📱"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* En-tête */}
          <div className="text-center mb-16">
            <motion.h1
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Comment ça marche ?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600"
            >
              Découvrez comment Family App peut transformer votre quotidien familial
            </motion.p>
          </div>

          {/* Étapes principales */}
          <div className="space-y-12 mb-16">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-6">
                  <div className="text-5xl">{step.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">{step.title}</h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex items-center text-gray-600"
                        >
                          <span className="text-purple-600 mr-2">✓</span>
                          {detail}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Fonctionnalités clés */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Fonctionnalités clés
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Appel à l'action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center bg-white p-8 rounded-2xl shadow-lg"
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              Prêt à commencer ?
            </h2>
            <p className="text-gray-600 mb-8">
              Rejoignez Family App dès maintenant et transformez votre quotidien familial
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Créer un compte
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition-all duration-300"
              >
                Retour à l'accueil
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default HowItWorksPage; 