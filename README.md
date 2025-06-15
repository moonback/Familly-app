# 🏰 Family Dashboard - Application de Gestion Familiale

Une application moderne et interactive pour aider les parents à gérer les tâches, règles et récompenses de leurs enfants de manière ludique et motivante.

## ✨ Fonctionnalités

### 🎯 Pour les Parents
- **Gestion des enfants** : Ajout, modification et suppression des profils enfants avec avatars personnalisés
- **Système de tâches** : Création de tâches adaptées à l'âge avec catégories (quotidien, scolaire, maison, personnel)
- **Règles de comportement** : Définition des règles avec système de pénalités
- **Récompenses** : Création d'un catalogue de récompenses échangeables contre des points
- **Devinettes quotidiennes** : Système de devinettes pour gagner des points bonus
- **Tableau de bord analytique** : Statistiques détaillées, graphiques de progression, historique des activités
- **Suivi des performances** : Streaks, dernières activités, progression par enfant

### 🌟 Pour les Enfants
- **Interface ludique** : Design coloré et interactif avec animations
- **Système de points** : Gain de points pour les tâches accomplies
- **Progression visuelle** : Barres de progression, badges, animations de célébration
- **Récompenses** : Échange de points contre des récompenses
- **Devinettes** : Défis quotidiens pour gagner des points bonus
- **Personnalisation** : Couleurs et avatars personnalisés
- **Système de streaks** : Motivation par les séries de jours consécutifs

### 🛒 Boutique et achats
Gestion d'une boutique interne où les parents ajoutent des articles dans `shop_items`. Les enfants peuvent dépenser leurs points pour les acheter. Chaque opération est enregistrée dans la table `purchases`.

### 🐷 Tirelire
Les enfants disposent d'une tirelire virtuelle pour épargner ou dépenser leurs points. La conversion est fixée à **100 points = 1 €** fictif et toutes les opérations sont historisées dans `piggy_bank_transactions`.

### 📘 Manuel pour enfants
Un manuel simplifié est intégré à l'interface afin d'aider les plus jeunes à comprendre le fonctionnement de l'application. Il est disponible dans le fichier `public/manuel.md` et consultable depuis le tableau de bord.

### 🤖 Suggestions automatiques
L'application propose des idées de tâches, de règles et de récompenses grâce à l'API Google Gemini pour simplifier la configuration par les parents.

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
- `missions` : Missions éducatives à étapes
- `badges` : Badges à collectionner
- `shop_items` : Articles disponibles dans la boutique
- `purchases` : Achats effectués par les enfants
- `piggy_bank_transactions` : Mouvements de points de la tirelire

### Tables de liaison
- `child_tasks` : Tâches assignées aux enfants
- `child_rules_violations` : Violations des règles
- `child_rewards_claimed` : Récompenses réclamées
- `mission_steps` : Étapes d'une mission
- `child_missions` : Progression des missions par enfant
- `child_badges` : Badges obtenus par enfant
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
   La clé `VITE_GEMINI_API_KEY` est utilisée pour contacter l'API Google Gemini afin de générer automatiquement des suggestions de tâches, règles ou récompenses.

4. Exécuter les migrations Supabase :
   - `create_initial_schema.sql`
   - `add_updated_at_columns.sql`
   - `20250613104538_shrill_snow.sql`
   - `20250613110000_add_shop_items.sql`
   - `20250613113000_add_piggy_bank_transactions.sql`
   - `20250615120000_add_missions_badges.sql`
   
   Ces migrations ajoutent les contraintes d'âge, les devinettes, les articles de boutique, la table de transactions de la tirelire ainsi que les missions et badges.

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