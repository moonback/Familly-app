import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpenIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const manualContent = `
# 📘 Manuel d'utilisation pour les enfants

Bienvenue sur **Family Dashboard** !  
Cette application t'aide à accomplir tes missions à la maison tout en gagnant des points pour obtenir des **récompenses amusantes**. Voici comment t'en servir :

---

## 1. 🎯 Ton espace personnel

Quand tes parents auront créé ton profil, tu auras :
- Un **avatar**,
- Une **couleur** rien qu'à toi.

Sur ta page, tu verras :
- ✅ Tes **missions du jour** à cocher une fois terminées.
- 🌟 Ton **nombre de points magiques**.
- 🎁 Tes **récompenses disponibles**.
- ❓ Ta **devinette du jour** pour gagner des points bonus.

💡 *Chaque fois que tu effectues une mission, clique sur la case correspondante. Tes points augmenteront et une petite animation te félicitera !*

---

## 2. 💰 Gagne et dépense tes points

- Les **missions** (comme ranger ta chambre ou finir tes devoirs) donnent des points quand tu les termines.
- Plus tu en fais, plus tu progresses !

Tu peux ensuite :
- 🛒 « Acheter » des **récompenses** dans la boutique.  
  *(Demande à tes parents d'ajouter des cadeaux que tu aimerais : sortie, jouet, etc.)*

- 🐷 Déposer des points dans ta **tirelire**.  
  📏 **100 points = 1 €** fictif.  
  Cela t'aide à **comprendre la valeur de tes efforts**.

---

## 3. 🧠 Devinettes et bonus

- Chaque jour, une **devinette** apparaît.
- ✍️ Écris ta réponse et valide.

🎉 Si c'est juste : tu remportes des **points bonus**.  
🤔 Sinon : réessaie plus tard ou demande un **indice** à tes parents.

---

## 4. 🔥 Streaks et historique

- En réalisant tes missions **tous les jours**, tu construis un **streak** (une série de réussites).
- Plus il est long, plus ta progression est **impressionnante** !

📊 Ton tableau de bord affiche aussi :
- L'**historique de tes achats**.
- Les **pénalités** éventuelles.

---

## 5. 📝 Conseils d'utilisation

- Ouvre ton tableau de bord **tous les jours** pour voir tes missions.
- ✅ Valide-les **juste après** les avoir faites.
- Consulte ta **boutique** pour voir quelles récompenses tu peux obtenir.
- Utilise la **tirelire** pour suivre tes économies et tes dépenses.
- Relis ta **devinette du jour** pour avancer plus vite grâce aux points bonus.

---

## 🎉 En résumé

En suivant ces étapes simples, tu t'amuseras à :
- Accomplir tes missions
- Gagner des points
- Et obtenir des récompenses !

**Bonne chance, et profite bien de ton Family Dashboard !**
`;

export function ManualDialog({ open, onOpenChange }: ManualDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            Manuel d'utilisation
          </DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-4xl font-bold text-center mb-8 text-[var(--child-color)] tracking-tight" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-semibold mt-10 mb-6 text-[var(--child-color)] tracking-tight border-b border-gray-200 dark:border-gray-700 pb-2" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-base leading-relaxed mb-6 text-gray-600 dark:text-gray-400" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-8 mb-6 space-y-3" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-base text-gray-600 dark:text-gray-400" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-[var(--child-color)] dark:text-[var(--child-color)]" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-gray-500 dark:text-gray-400" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-12 border-t-2 border-gray-200 dark:border-gray-700" {...props} />
                ),
              }}
            >
              {manualContent}
            </ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManualButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2"
    >
      <BookOpenIcon className="h-4 w-4" />
      Manuel d'utilisation
    </Button>
  );
} 