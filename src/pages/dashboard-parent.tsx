import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Users, 
  CheckSquare, 
  Shield, 
  Gift,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { ChildrenManager } from '@/components/children/children-manager';
import { TasksManager } from '@/components/tasks/tasks-manager';
import { RulesManager } from '@/components/rules/rules-manager';
import { RewardsManager } from '@/components/rewards/rewards-manager';

type View = 'children' | 'tasks' | 'rules' | 'rewards' | null;

export default function DashboardParent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-indigo-700 font-medium">Chargement du tableau de bord parent...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const dashboardCards = [
    {
      id: 'children',
      title: 'Gérer les Enfants',
      description: 'Ajoutez, modifiez ou supprimez les profils de vos enfants.',
      icon: Users,
      color: 'from-pink-500 to-rose-600',
      hoverColor: 'hover:from-pink-600 hover:to-rose-700',
      bgGradient: 'bg-gradient-to-br from-pink-50 to-rose-100',
      borderColor: 'border-pink-200',
      buttonText: 'Gérer les Enfants'
    },
    {
      id: 'tasks',
      title: 'Gérer les Tâches',
      description: 'Définissez les tâches quotidiennes et leurs points de récompense.',
      icon: CheckSquare,
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700',
      bgGradient: 'bg-gradient-to-br from-green-50 to-emerald-100',
      borderColor: 'border-green-200',
      buttonText: 'Gérer les Tâches'
    },
    {
      id: 'rules',
      title: 'Gérer les Règles',
      description: 'Établissez les règles de comportement et les pénalités de points.',
      icon: Shield,
      color: 'from-orange-500 to-amber-600',
      hoverColor: 'hover:from-orange-600 hover:to-amber-700',
      bgGradient: 'bg-gradient-to-br from-orange-50 to-amber-100',
      borderColor: 'border-orange-200',
      buttonText: 'Gérer les Règles'
    },
    {
      id: 'rewards',
      title: 'Gérer les Récompenses',
      description: 'Créez des récompenses que vos enfants pourront échanger avec leurs points.',
      icon: Gift,
      color: 'from-purple-500 to-violet-600',
      hoverColor: 'hover:from-purple-600 hover:to-violet-700',
      bgGradient: 'bg-gradient-to-br from-purple-50 to-violet-100',
      borderColor: 'border-purple-200',
      buttonText: 'Gérer les Récompenses'
    }
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'children':
        return <ChildrenManager />;
      case 'tasks':
        return <TasksManager />;
      case 'rules':
        return <RulesManager />;
      case 'rewards':
        return <RewardsManager />;
      default:
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-12 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl text-white shadow-2xl">
              <div className="flex justify-center mb-4">
                <Sparkles className="h-12 w-12 text-yellow-300 animate-pulse" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Bienvenue dans votre espace parent
              </h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Gérez facilement les activités, règles et récompenses de vos enfants
              </p>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {dashboardCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <Card 
                    key={card.id}
                    className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${card.borderColor} ${card.bgGradient} overflow-hidden relative`}
                    onClick={() => setCurrentView(card.id as View)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <CardHeader className="text-center pb-4 relative z-10">
                      <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${card.color} ${card.hoverColor} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="text-center relative z-10">
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {card.description}
                      </p>
                      <Button 
                        className={`w-full bg-gradient-to-r ${card.color} ${card.hoverColor} text-white border-0 shadow-lg font-semibold py-2.5 transition-all duration-300 group-hover:shadow-xl`}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {card.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            {currentView && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentView(null)}
                className="flex items-center gap-2 hover:bg-white/80 transition-colors border-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {currentView ? 
                  dashboardCards.find(card => card.id === currentView)?.title || 'Tableau de bord Parent' :
                  'Tableau de bord Parent'
                }
              </h1>
              {!currentView && (
                <p className="text-gray-600 mt-2 text-lg">
                  Gérez votre famille avec style et simplicité
                </p>
              )}
            </div>
          </div>
          
          {!currentView && (
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">En ligne</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}