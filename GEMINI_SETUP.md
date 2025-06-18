# Configuration des Suggestions IA avec Gemini

## 🚀 Vue d'ensemble

Cette application utilise l'API Google Gemini pour générer automatiquement des suggestions de tâches intelligentes pour votre système de récompenses familial.

## 📋 Prérequis

1. **Compte Google Cloud** avec accès à l'API Gemini
2. **Clé API Gemini** valide
3. **Base de données Supabase** configurée

## 🔧 Configuration

### 1. Obtenir une clé API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé générée

### 2. Configurer la clé API

1. Créez un fichier `.env` à la racine du projet (s'il n'existe pas)
2. Ajoutez votre clé API :

```env
VITE_GEMINI_API_KEY=votre_clé_api_ici
```

### 3. Redémarrer l'application

```bash
npm run dev
```

## 🧪 Test de la Configuration

### Via l'interface d'administration

1. Allez sur `/admin` dans votre application
2. Utilisez le composant "Test API Gemini"
3. Cliquez sur "Tester l'API Gemini"

### Via la console

Ouvrez la console du navigateur et testez :

```javascript
// Vérifier que la clé est chargée
console.log('Clé API:', import.meta.env.VITE_GEMINI_API_KEY);

// Tester la génération de suggestions
import { generateTaskSuggestions } from '@/lib/gemini';
generateTaskSuggestions().then(console.log);
```

## 🎯 Utilisation des Suggestions IA

### Dans le gestionnaire de tâches

1. Allez dans la section "Tâches" de votre application
2. Cliquez sur "Suggestions IA"
3. Attendez que les suggestions se chargent
4. Cliquez sur le bouton "+" à côté des suggestions que vous voulez ajouter

### Fonctionnalités

- **12 suggestions** générées automatiquement
- **3 suggestions par catégorie** (quotidien, scolaire, maison, personnel)
- **Validation automatique** des données
- **Points équilibrés** (5-50 points par tâche)
- **Âges appropriés** (3-18 ans)

### Analyse IA des progrès

1. Ouvrez le tableau de bord d'un enfant
2. Appuyez sur le bouton avec l'icône graphique
3. Patientez quelques secondes pour recevoir un résumé et des suggestions

## 🔍 Diagnostic des Problèmes

### Erreur : "Clé API Gemini manquante"

**Solution :**
1. Vérifiez que le fichier `.env` existe
2. Vérifiez que la variable `VITE_GEMINI_API_KEY` est définie
3. Redémarrez l'application

### Erreur : "Gemini API error"

**Solutions possibles :**
1. Vérifiez que votre clé API est valide
2. Vérifiez votre quota d'API
3. Vérifiez votre connexion internet

### Erreur : "Format de réponse invalide"

**Solutions possibles :**
1. L'API a retourné un format inattendu
2. Réessayez la génération
3. Vérifiez les logs dans la console

## 📊 Logs et Debugging

### Logs dans la console

L'application génère des logs détaillés pour le debugging :

```javascript
// Exemples de logs
🤖 Chargement des suggestions IA...
📡 Envoi de la requête à l'API Gemini...
📥 Réponse reçue de l'API Gemini
✅ Suggestions validées: 12
```

### Vérification des données

Les suggestions générées sont validées automatiquement :

- ✅ Label non vide
- ✅ Points entre 5 et 50
- ✅ Catégorie valide
- ✅ Âges entre 3 et 18 ans
- ✅ Type boolean pour is_daily

## 🛠️ Personnalisation

### Modifier le prompt

Pour personnaliser les suggestions, modifiez le prompt dans `src/lib/gemini.ts` :

```typescript
const prompt = `Votre prompt personnalisé ici...`;
```

### Ajouter de nouvelles catégories

1. Modifiez l'interface `TaskSuggestion`
2. Mettez à jour les validations
3. Ajoutez les nouvelles catégories dans le prompt

## 🔒 Sécurité

### Protection de la clé API

- La clé API est stockée côté client (nécessaire pour Vite)
- Utilisez des restrictions d'origine dans Google Cloud Console
- Surveillez l'utilisation de votre quota

### Recommandations

1. Limitez l'accès à l'API par domaine
2. Surveillez les coûts d'API
3. Utilisez des quotas appropriés

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans la console
2. Testez avec le composant "Test API Gemini"
3. Vérifiez la documentation Google Gemini
4. Consultez les issues GitHub du projet

## 🎉 Exemples de Suggestions

Voici quelques exemples de suggestions générées :

```json
[
  {
    "label": "Faire mon lit tout seul",
    "points_reward": 15,
    "category": "quotidien",
    "age_min": 4,
    "age_max": 12,
    "is_daily": true
  },
  {
    "label": "Lire un chapitre de livre",
    "points_reward": 25,
    "category": "scolaire",
    "age_min": 6,
    "age_max": 18,
    "is_daily": true
  }
]
```

---

**Note :** Les suggestions sont générées dynamiquement et peuvent varier à chaque appel de l'API. 