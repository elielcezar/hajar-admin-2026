import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertiesService } from '@/services/properties.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Home, MapPin, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    paraVenda: 0,
    paraLocacao: 0,
    casas: 0,
    terrenos: 0,
  });

  // Buscar imóveis
  const { data: properties, isError: propertiesError } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesService.getAll(),
  });

  useEffect(() => {
    if (properties) {
      // Contar imóveis por finalidade e tipo
      const paraVenda = properties.filter(p => 
        p.finalidade?.some(f => f.finalidade.nome.toLowerCase().includes('venda'))
      ).length;
      
      const paraLocacao = properties.filter(p => 
        p.finalidade?.some(f => 
          f.finalidade.nome.toLowerCase().includes('aluguel') || 
          f.finalidade.nome.toLowerCase().includes('locação') ||
          f.finalidade.nome.toLowerCase().includes('locacao')
        )
      ).length;
      
      const casas = properties.filter(p => 
        p.tipo?.some(t => t.tipo.nome.toLowerCase().includes('casa'))
      ).length;
      
      const terrenos = properties.filter(p => 
        p.tipo?.some(t => t.tipo.nome.toLowerCase().includes('terreno'))
      ).length;

      setStats({
        paraVenda,
        paraLocacao,
        casas,
        terrenos,
      });
    }
  }, [properties]);

  useEffect(() => {
    if (propertiesError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as estatísticas do dashboard.',
      });
    }
  }, [propertiesError, toast]);

  const statCards = [
    {
      title: 'Para Venda',
      value: stats.paraVenda,
      icon: Building2,
      description: 'Imóveis disponíveis para venda',
    },
    {
      title: 'Para Locação',
      value: stats.paraLocacao,
      icon: KeyRound,
      description: 'Imóveis disponíveis para locação',
    },
    {
      title: 'Casas',
      value: stats.casas,
      icon: Home,
      description: 'Casas cadastradas',
    },
    {
      title: 'Terrenos',
      value: stats.terrenos,
      icon: MapPin,
      description: 'Terrenos cadastrados',
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
              <CardTitle className="text-lg font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stat.value}</div>
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
