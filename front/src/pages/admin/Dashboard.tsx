import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertiesService } from '@/services/properties.service';
import { usersService } from '@/services/users.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Home, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    totalUsers: 0,
    activeUsers: 0,
  });

  // Buscar imóveis
  const { data: properties, isError: propertiesError } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesService.getAll(),
  });

  // Buscar usuários
  const { data: users, isError: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });

  useEffect(() => {
    if (properties && users) {
      setStats({
        totalProperties: properties.length,
        availableProperties: properties.length, // Backend não tem status disponivel
        totalUsers: users.length,
        activeUsers: users.length, // Backend não tem status ativo
      });
    }
  }, [properties, users]);

  useEffect(() => {
    if (propertiesError || usersError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as estatísticas do dashboard.',
      });
    }
  }, [propertiesError, usersError, toast]);

  const statCards = [
    {
      title: 'Total de Imóveis',
      value: stats.totalProperties,
      icon: Building2,
      description: 'Imóveis cadastrados',
    },
    {
      title: 'Imóveis Disponíveis',
      value: stats.availableProperties,
      icon: Home,
      description: 'Disponíveis para venda/aluguel',
    },
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      description: 'Usuários cadastrados',
    },
    {
      title: 'Usuários Ativos',
      value: stats.activeUsers,
      icon: TrendingUp,
      description: 'Usuários com status ativo',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
