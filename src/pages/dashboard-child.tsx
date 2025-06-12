import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GiftIcon, TrophyIcon, ListChecksIcon } from 'lucide-react';

export default function DashboardChild() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <p>Chargement du tableau de bord enfant...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Redirection gérée par useEffect
  }

  // Données fictives pour l'exemple
  const child = {
    name: 'Léa',
    age: 8,
    points: 120,
    avatar_url: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    custom_color: 'bg-pink-100 text-pink-800',
  };

  const tasks = [
    { id: '1', label: 'Faire son lit', points: 10, done: true },
    { id: '2', label: 'Brosser ses dents', points: 5, done: false },
    { id: '3', label: 'Ranger ses jouets', points: 15, done: false },
    { id: '4', label: 'Faire ses devoirs', points: 20, done: false },
    { id: '5', label: 'Aider à mettre la table', points: 10, done: true },
  ];

  const rewards = [
    { id: 'r1', label: '1h d’écran', cost: 50 },
    { id: 'r2', label: 'Dessert spécial', cost: 30 },
    { id: 'r3', label: 'Choisir le film du soir', cost: 75 },
    { id: 'r4', label: 'Une nouvelle BD', cost: 200 },
  ];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Mon Tableau de Bord</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil de l'enfant */}
        <Card className={`lg:col-span-1 p-6 flex flex-col items-center ${child.custom_color}`}>
          <Avatar className="h-24 w-24 mb-4 border-4 border-white shadow-lg">
            <AvatarImage src={child.avatar_url} alt={child.name} />
            <AvatarFallback>{child.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-extrabold mb-2">{child.name}</CardTitle>
          <p className="text-lg mb-4">Âge: {child.age} ans</p>
          <div className="flex items-center text-2xl font-semibold">
            <TrophyIcon className="h-6 w-6 mr-2 text-yellow-500" />
            Points: {child.points}
          </div>
        </Card>

        {/* Tâches du jour */}
        <Card className="lg:col-span-2 p-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <ListChecksIcon className="mr-2 h-6 w-6" /> Mes Tâches du Jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Progression des tâches ({completedTasks}/{totalTasks})</p>
              <Progress value={progressPercentage} className="w-full" />
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 border rounded-md bg-card">
                  <Checkbox id={`task-${task.id}`} checked={task.done} />
                  <Label htmlFor={`task-${task.id}`} className="flex-1 text-lg font-medium">
                    {task.label}
                  </Label>
                  <span className="text-primary font-semibold">+{task.points} points</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Récompenses disponibles */}
        <Card className="lg:col-span-3 p-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <GiftIcon className="mr-2 h-6 w-6" /> Récompenses Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <Card key={reward.id} className="p-4 flex flex-col items-center text-center">
                  <h3 className="text-xl font-semibold mb-2">{reward.label}</h3>
                  <p className="text-muted-foreground mb-3">Coût: <span className="font-bold text-primary">{reward.cost} points</span></p>
                  <Button
                    className="w-full"
                    disabled={child.points < reward.cost}
                  >
                    Échanger ({reward.cost} pts)
                  </Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
