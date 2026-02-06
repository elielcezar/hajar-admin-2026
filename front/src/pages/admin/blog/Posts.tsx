import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '@/services/blog.service';
import { Post } from '@/types/admin';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Newspaper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BlogPosts() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => blogService.getAllPosts(),
  });

  // Mutation para deletar
  const deleteMutation = useMutation({
    mutationFn: (id: number) => blogService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({
        title: 'Post excluído',
        description: 'O post foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir post',
        description: error.message,
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este post?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredPosts = (posts || []).filter((post) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      post.titulo.toLowerCase().includes(searchLower) ||
      post.categoria.nome.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts do Blog</h1>
          <p className="text-muted-foreground">
            Gerencie as publicações de conteúdo
          </p>
        </div>
        <Button onClick={() => navigate('/admin/blog/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Post
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <Input
            placeholder="Buscar por título ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Capa</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Pub.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    {searchTerm ? 'Nenhum post encontrado' : 'Nenhum post cadastrado'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      {post.imagemCapa ? (
                        <img
                          src={post.imagemCapa}
                          alt={post.titulo}
                          className="w-16 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                          <Newspaper className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {post.titulo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.categoria.nome}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'PUBLICADO' ? 'default' : 'secondary'}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {post.dataPublicacao 
                        ? new Date(post.dataPublicacao).toLocaleDateString('pt-BR')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/blog/${post.id}/editar`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post.id)}
                          disabled={deleteMutation.isPending}
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
    </div>
  );
}
