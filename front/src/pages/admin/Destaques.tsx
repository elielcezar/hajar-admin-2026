import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { destaquesService } from '@/services/destaques.service';
import { Destaque } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Destaques() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar destaques
  const { data: destaques, isLoading } = useQuery({
    queryKey: ['destaques'],
    queryFn: () => destaquesService.getAll(),
  });

  // Mutation para deletar
  const deleteDestaque = useMutation({
    mutationFn: (id: number) => destaquesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destaques'] });
      toast({
        title: 'Destaque excluído',
        description: 'O destaque foi excluído com sucesso.',
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir destaque',
        description: error.message,
      });
      setDeleteId(null);
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteDestaque.mutate(deleteId);
    }
  };

  // Ordenar por ordem ASC (mesmo que virá do backend)
  const sortedDestaques = (destaques || []).sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Destaques</h1>
          <p className="text-muted-foreground">
            Gerencie os destaques exibidos no Hero Section do site
          </p>
        </div>
        <Button onClick={() => navigate('/admin/destaques/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Destaque
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Destaques</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Imagem</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Ordem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : sortedDestaques.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum destaque cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedDestaques.map((destaque) => (
                  <TableRow key={destaque.id}>
                    <TableCell>
                      <img
                        src={destaque.imagem}
                        alt={destaque.titulo}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{destaque.titulo}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {destaque.descricao}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {destaque.ativo ? (
                        <Badge variant="default" className="bg-green-600">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{destaque.ordem}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/destaques/${destaque.id}/editar`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(destaque.id)}
                          disabled={deleteDestaque.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este destaque? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
