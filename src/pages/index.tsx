import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { motion } from 'framer-motion';

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Ne rediriger que si l'utilisateur est chargé et authentifié
    if (!loading && user) {
      navigate('/dashboard/parent');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: "🎯",
      title: "Gestion des tâches",
      description: "Créez et suivez les tâches quotidiennes de vos enfants avec un système de récompenses motivant. Organisez les tâches par catégorie, priorité et date d'échéance."
    },
    {
      icon: "⭐",
      title: "Système de récompenses",
      description: "Motivez vos enfants avec un système de points et de récompenses personnalisables. Définissez des objectifs et des récompenses adaptés à chaque enfant."
    },
    {
      icon: "📊",
      title: "Suivi des progrès",
      description: "Visualisez les progrès de vos enfants dans leurs différentes activités et responsabilités. Accédez à des statistiques détaillées et des rapports hebdomadaires."
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Interface adaptée",
      description: "Une interface simple et ludique pour les enfants, complète et intuitive pour les parents. Navigation fluide et design adapté à tous les âges."
    },
    {
      icon: "📱",
      title: "Application mobile",
      description: "Accédez à Family App depuis n'importe quel appareil, partout et à tout moment. Synchronisation automatique entre tous vos appareils."
    },
    {
      icon: "🔔",
      title: "Notifications",
      description: "Restez informé des activités et des progrès de vos enfants en temps réel. Recevez des alertes personnalisables pour les tâches importantes."
    }
  ];

  const benefits = [
    {
      title: "Pour les Parents",
      items: [
        "Organisation simplifiée des tâches familiales",
        "Suivi en temps réel des progrès",
        "Communication facilitée avec les enfants",
        "Gestion personnalisée des récompenses",
        "Tableau de bord intuitif",
        "Rapports hebdomadaires détaillés",
        "Gestion de plusieurs enfants",
        "Personnalisation complète des tâches"
      ]
    },
    {
      title: "Pour les Enfants",
      items: [
        "Interface ludique et colorée",
        "Système de points motivant",
        "Suivi visuel des progrès",
        "Récompenses personnalisées",
        "Badges et trophées à collectionner",
        "Challenges hebdomadaires",
        "Animations et effets visuels",
        "Tableau de récompenses personnalisé"
      ]
    }
  ];

  const testimonials = [
    {
      text: "Family App a transformé notre quotidien ! Les enfants sont plus motivés et autonomes. L'interface est intuitive et les fonctionnalités sont parfaitement adaptées à nos besoins.",
      author: "Sophie, maman de 3 enfants",
      rating: 5
    },
    {
      text: "Une application intuitive qui rend la gestion familiale plus agréable et efficace. Les enfants adorent gagner des points et nous apprécions le suivi des tâches.",
      author: "Thomas, papa de 2 enfants",
      rating: 5
    },
    {
      text: "Les enfants adorent gagner des points et les parents apprécient le suivi des tâches. Une vraie aide au quotidien pour toute la famille !",
      author: "Marie, maman de 4 enfants",
      rating: 5
    }
  ];

  const stats = [
    { number: "10K+", label: "Familles utilisatrices" },
    { number: "50K+", label: "Tâches complétées" },
    { number: "95%", label: "Satisfaction" },
    { number: "24/7", label: "Support disponible" }
  ];

  const faqs = [
    {
      question: "Comment fonctionne le système de récompenses ?",
      answer: "Les parents peuvent définir des points pour chaque tâche accomplie. Les enfants accumulent ces points et peuvent les échanger contre des récompenses définies par les parents. Le système est entièrement personnalisable selon vos besoins."
    },
    {
      question: "Est-ce que l'application est gratuite ?",
      answer: "Family App propose une version gratuite avec les fonctionnalités de base. Une version premium est disponible avec des fonctionnalités avancées comme les rapports détaillés, les récompenses personnalisées et le support prioritaire."
    },
    {
      question: "Comment protéger la vie privée de ma famille ?",
      answer: "Nous prenons la sécurité très au sérieux. Toutes les données sont cryptées et nous respectons strictement le RGPD. Vous gardez le contrôle total sur les informations partagées et pouvez supprimer vos données à tout moment."
    },
    {
      question: "Puis-je utiliser l'application sur plusieurs appareils ?",
      answer: "Oui, Family App est disponible sur tous les appareils (ordinateur, tablette, smartphone) et synchronise automatiquement les données. Vous pouvez accéder à votre compte depuis n'importe quel appareil connecté à internet."
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
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto"
          >
              Simplifiez la gestion de votre famille au quotidien avec notre application intuitive et ludique
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
              className="flex flex-col md:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
                Commencer maintenant
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition-all duration-300"
              >
                Voir la démo
              </button>
            </motion.div>
          </motion.div>

          {/* Statistiques */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-20"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white p-6 rounded-2xl shadow-lg text-center hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-3xl font-bold text-purple-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Fonctionnalités */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Nos Fonctionnalités</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 * index }}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600 text-lg">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Avantages */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Pourquoi Choisir Family App ?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 * index }}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="text-2xl font-semibold mb-6 text-gray-800">{benefit.title}</h3>
                  <ul className="space-y-4">
                    {benefit.items.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-center text-gray-600"
                      >
                        <span className="text-purple-600 mr-2">✓</span>
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Témoignages */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Ce qu'en disent les parents</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * index }}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400">⭐</span>
                    ))}
                  </div>
                  <p className="text-gray-600 text-lg mb-4 italic">"{testimonial.text}"</p>
                  <p className="text-purple-600 font-semibold">{testimonial.author}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* FAQ */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Questions Fréquentes</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * index }}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Appel à l'action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="text-center bg-white p-12 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <h2 className="text-4xl font-bold mb-6 text-gray-800">Prêt à transformer votre quotidien ?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Rejoignez dès maintenant Family App et découvrez une nouvelle façon de gérer votre famille
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Créer un compte
            </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-3 border-2 border-purple-600 text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition-all duration-300"
              >
                Se connecter
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
