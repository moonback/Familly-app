# 🏰 Family Dashboard - Application de Gestion Familiale

Une application moderne et interactive pour aider les parents à gérer les tâches, règles et récompenses de leurs enfants de manière ludique et motivante.

## ✨ Fonctionnalités

### 🎯 Pour les Parents
- **Gestion des enfants** : Ajout, modification et suppression des profils enfants avec avatars et couleurs personnalisés
- **Système de tâches** : Création de tâches adaptées à l'âge avec catégories (quotidien, scolaire, maison, personnel)
- **Règles de comportement** : Définition des règles avec système de pénalités
- **Récompenses** : Création d'un catalogue de récompenses échangeables contre des points
- **Devinettes quotidiennes** : Système de devinettes pour gagner des points bonus
- **Boutique** : Ajout et gestion d'articles dans la boutique interne, visualisation de l'historique des achats
- **Validation des récompenses** : Les parents confirment les récompenses réclamées par les enfants
- **Tableau de bord analytique** : Statistiques détaillées, graphiques de progression, historique des activités et des points
- **Suivi des performances** : Streaks, dernières activités, progression par enfant
- **Code parental sécurisé** : Protection du dashboard et validation des actions sensibles via un code à 4 chiffres
- **Journal d'accès** : Enregistrement des tentatives de connexion et modifications de code parental
- **Suggestions automatiques** : Idées de tâches, règles et récompenses générées par l'IA (Google Gemini)

### 🌟 Pour les Enfants
- **Interface ludique** : Design coloré et interactif avec animations, badges, micro-interactions et confettis
- **Système de points** : Gain de points pour les tâches accomplies, visualisation de la progression
- **Progression visuelle** : Barres de progression, badges, animations de célébration
- **Récompenses** : Échange de points contre des récompenses, suivi des récompenses réclamées et validées
- **Devinettes** : Défis quotidiens pour gagner des points bonus, achat d'indices
- **Boutique** : Achat d'articles avec points, historique des achats, répartition automatique entre points disponibles et points épargnés
- **Tirelire** : Épargne et retrait de points, conversion points/€ (100 pts = 1 € fictif), historique détaillé, boutons rapides (10, 20, 50, 100, Tout)
- **Historique** : Visualisation de toutes les transactions de points et achats
- **Personnalisation** : Couleurs, avatars, surnoms, thèmes personnalisés
- **Système de streaks** : Motivation par les séries de jours consécutifs
- **Chatbot d'aide** : Assistant interactif pour répondre aux questions et guider l'enfant
- **Analyse IA des progrès** : Résumé automatique et suggestions personnalisées grâce à Gemini
- **Manuel enfant intégré** : Guide simplifié accessible depuis le dashboard

### 🛒 Boutique et achats
- Gestion d'une boutique interne où les parents ajoutent des articles dans `shop_items`
- Les enfants peuvent acheter des articles avec leurs points (points disponibles et/ou points épargnés)
- Historique détaillé des achats, statistiques mensuelles, visualisation des dépenses

### 🐷 Tirelire
- Tirelire virtuelle pour épargner ou retirer des points
- Conversion automatique points/€ (100 pts = 1 € )
- Historique complet des transactions (épargne, retrait, dépenses)
- Boutons rapides pour faciliter les dépôts/retraits (10, 20, 50, 100, Tout)
- Visualisation du solde actuel, total épargné, total dépensé

### 📘 Manuel pour enfants
- Manuel simplifié intégré à l'interface pour aider les plus jeunes à comprendre le fonctionnement
- Disponible dans le fichier `public/manuel.md` et consultable depuis le tableau de bord

### 🤖 Suggestions automatiques
- Propositions d'idées de tâches, règles et récompenses grâce à l'API Google Gemini

### 💬 Chatbot d'aide
- Assistant conversationnel intégré pour guider les enfants dans l'utilisation de l'application

### 👤 Profil et personnalisation
- Affichage détaillé du profil enfant : avatar, âge, points, missions, série de jours, points épargnés
- Personnalisation avancée (avatar, couleur, surnom)

### 🏆 Streaks, badges et micro-interactions
- Système de streaks (séries de jours), badges, animations de succès et feedback immédiat

### 📱 Responsive & Accessibilité
- Interface adaptée à tous les écrans (mobile, tablette, desktop)
- Contraste élevé, navigation clavier, accessibilité renforcée

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le bundling et le développement
- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants UI
- **Framer Motion** pour les animations
- **React Router DOM** pour la navigation
- **Lucide React** pour les icônes
- **Recharts** pour les graphiques
- **date-fns** pour la gestion des dates

### Backend & Base de données
- **Supabase** (PostgreSQL + Auth + RLS)
- **Row Level Security (RLS)** pour la sécurité des données
- **Authentification par email/mot de passe**

### Outils de développement
- **ESLint** pour la qualité du code
- **TypeScript** pour le typage statique
- **PostCSS** et **Autoprefixer**

## 🏗️ Architecture de la Base de Données

### Tables principales
- `children` : Profils des enfants
- `tasks` : Tâches avec contraintes d'âge et catégories
- `rules` : Règles de comportement
- `rewards` : Catalogue de récompenses
- `riddles` : Devinettes créées par les parents
- `shop_items` : Articles disponibles dans la boutique
- `purchases` : Achats effectués par les enfants
- `piggy_bank_transactions` : Mouvements de points de la tirelire

### Tables de liaison
- `child_tasks` : Tâches assignées aux enfants
- `child_rules_violations` : Violations des règles
- `child_rewards_claimed` : Récompenses réclamées
- `daily_riddles` : Devinettes quotidiennes par enfant
- `points_history` : Historique des points pour analytics

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase

### Configuration
1. Cloner le repository
2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement dans `.env` :
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_google_generative_ai_key
   ```
   La clé `VITE_GEMINI_API_KEY` est utilisée pour contacter l'API Google Gemini afin de générer automatiquement des suggestions de tâches, règles ou récompenses et pour l'analyse IA du tableau de bord enfant.

4. Exécuter les migrations Supabase :
   - `create_initial_schema.sql`
   - `add_updated_at_columns.sql`
   - `20250613104538_shrill_snow.sql`
   - `20250613110000_add_shop_items.sql`
   - `20250613113000_add_piggy_bank_transactions.sql`
   
   Ces migrations ajoutent les contraintes d'âge, les devinettes, les articles de boutique et la table de transactions de la tirelire.

5. Démarrer l'application :
   ```bash
   npm run dev
   ```

## 📱 Utilisation

### Pour commencer
1. **Inscription/Connexion** : Créez un compte parent
2. **Ajout d'enfants** : Ajoutez les profils de vos enfants avec âge et avatar
3. **Configuration des tâches** : Créez des tâches adaptées à chaque tranche d'âge
4. **Définition des récompenses** : Créez un catalogue de récompenses motivantes
5. **Création de devinettes** : Ajoutez des devinettes pour stimuler l'apprentissage

### Fonctionnalités avancées
- **Tâches par âge** : Les tâches sont automatiquement assignées selon l'âge
- **Catégories de tâches** : Organisation par type (quotidien, scolaire, etc.)
- **Système de streaks** : Motivation par les séries de réussite
- **Analytics** : Suivi détaillé des performances et de la progression
- **Personnalisation** : Couleurs et thèmes personnalisés par enfant

## 👪 Parcours Parent & Enfant

### Côté parent
1. **Création du compte** et configuration du **code parental**.
2. **Ajout des enfants** avec avatar et couleur personnalisée.
3. **Définition des tâches**, règles et récompenses adaptées à chaque âge.
4. **Suivi quotidien** via le tableau de bord (statistiques, journal des points, validation des récompenses).

### Côté enfant
1. Connexion au **dashboard enfant** pour voir les missions du jour.
2. Marquage des tâches accomplies et gain de points.
3. Consultation des **récompenses**, de la boutique et de la tirelire.
4. Participation à la **devinette du jour** pour gagner des points bonus.

## 🎨 Design et UX

### Principes de design
- **Design System cohérent** avec couleurs personnalisables
- **Animations fluides** avec Framer Motion
- **Responsive design** pour tous les appareils
- **Accessibilité** avec contraste et navigation clavier
- **Micro-interactions** pour un feedback immédiat

### Thématique
- **Interface enfant** : Colorée, ludique avec animations et récompenses visuelles
- **Interface parent** : Professionnelle avec analytics et outils de gestion
- **Cohérence** : Design unifié mais adapté à chaque utilisateur

## 🔒 Sécurité

### Authentification
- **Supabase Auth** avec email/mot de passe
- **Sessions sécurisées** avec tokens JWT
- **Déconnexion automatique** après inactivité

### Autorisation
- **Row Level Security (RLS)** sur toutes les tables
- **Isolation des données** par famille
- **Validation côté serveur** pour toutes les opérations

### Protection des données
- **Chiffrement** des données sensibles
- **Validation des entrées** pour prévenir les injections
- **Audit trail** avec historique des actions

## 📊 Analytics et Suivi

### Métriques disponibles
- **Taux de completion** des tâches par enfant
- **Évolution des points** dans le temps
- **Streaks et régularité** des activités
- **Récompenses les plus populaires**
- **Performance par catégorie** de tâches

### Visualisations
- **Graphiques temporels** avec Recharts
- **Barres de progression** animées
- **Tableaux de bord** interactifs
- **Comparaisons** entre enfants

## 🔄 Roadmap

### Version actuelle (v1.0)
- ✅ Gestion complète des enfants, tâches, règles, récompenses
- ✅ Système de points et devinettes
- ✅ Analytics de base
- ✅ Interface responsive

### Prochaines versions
- 🔄 Notifications push
- 🔄 Mode hors ligne
- 🔄 Intégration calendrier
- 🔄 Rapports PDF
- 🔄 API publique
- 🔄 Application mobile native

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche feature
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- **Supabase** pour la plateforme backend
- **shadcn/ui** pour les composants UI
- **Framer Motion** pour les animations
- **Lucide** pour les icônes
- **Pexels** pour les images de stock

---

Développé avec ❤️ pour aider les familles à s'organiser et motiver les enfants dans leurs activités quotidiennes.