import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '@/services/blog.service';
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
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BlogCategories() {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar categorias
  const { data: categories, isLoading } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => blogService.getAllCategories(),
  });

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (nome: string) => blogService.createCategory(nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      setIsAdding(false);
      setNewCategoryName('');
      toast({ title: 'Categoria criada', description: 'A categoria foi criada com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao criar categoria', description: error.message });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, nome }: { id: number; nome: string }) => blogService.updateCategory(id, nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      setEditingId(null);
      toast({ title: 'Categoria atualizada', description: 'A categoria foi atualizada com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar categoria', description: error.message });
    },
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: number) => blogService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
      toast({ title: 'Categoria excluída', description: 'A categoria foi excluída com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao excluir categoria', description: error.message });
    },
  });

  const handleCreate = () => {
    if (!newCategoryName.trim()) return;
    createMutation.mutate(newCategoryName);
  };

  const handleUpdate = (id: number) => {
    if (!editingName.trim()) return;
    updateMutation.mutate({ id, nome: editingName });
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteMutation.mutate(id);
    }
  };

  const startEditing = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias do Blog</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias dos posts do blog
          </p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Nova Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !categories || categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    Nenhuma categoria encontrada
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {editingId === category.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          className="max-w-[300px]"
                        />
                      ) : (
                        category.nome
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === category.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUpdate(category.id)}
                              disabled={updateMutation.isPending}
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(category.id, category.nome)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(category.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
