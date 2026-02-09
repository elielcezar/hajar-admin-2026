import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '@/services/blog.service';
import { propertiesService } from '@/services/properties.service';
import { PostFormData, PostStatus } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, X, Upload } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<PostFormData>({
    titulo: '',
    slug: '',
    chamada: '',
    conteudo: '',
    dataPublicacao: new Date().toISOString().split('T')[0],
    status: 'RASCUNHO' as PostStatus,
    categoriaId: '',
    imovelId: '',
    imagemCapa: undefined,
    oldImagemCapa: '',
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  // Buscar categorias
  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => blogService.getAllCategories(),
  });

  // Buscar imóveis para seleção
  const { data: properties } = useQuery({
    queryKey: ['properties-simple'],
    queryFn: () => propertiesService.getAll(),
  });

  // Buscar post se for edição
  const { data: post, isLoading: isLoadingPost } = useQuery({
    queryKey: ['blog-post', id],
    queryFn: () => blogService.getPostById(parseInt(id!)),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    const fetchPost = async () => {
      if (isEdit && id) {
        try {
          const p = await blogService.getPostById(parseInt(id));
          setFormData({
            titulo: p.titulo,
            slug: p.slug,
            chamada: p.chamada || '',
            conteudo: p.conteudo,
            dataPublicacao: p.dataPublicacao ? p.dataPublicacao.split('T')[0] : '',
            status: p.status,
            categoriaId: p.categoriaId.toString(),
            imovelId: p.imovelId?.toString() || '',
            oldImagemCapa: p.imagemCapa || '',
          });
          setPreviewImage(p.imagemCapa || null);
          setSlugManual(true);
        } catch (error) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'Erro ao carregar post',
            description: 'Não foi possível carregar os dados do post.',
          });
        }
      }
    };
    fetchPost();
  }, [id, isEdit, toast]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, titulo: title };
      if (!slugManual) {
        newData.slug = generateSlug(title);
      }
      return newData;
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManual(true);
    setFormData(prev => ({ ...prev, slug: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'O limite é 5MB.' });
      return;
    }

    setFormData(prev => ({ ...prev, imagemCapa: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const createMutation = useMutation({
    mutationFn: (data: PostFormData) => blogService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: 'Post criado', description: 'O post foi criado com sucesso.' });
      navigate('/admin/blog');
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao criar post', description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PostFormData>) => blogService.updatePost(parseInt(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: 'Post atualizado', description: 'O post foi atualizado com sucesso.' });
      navigate('/admin/blog');
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar post', description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blog')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Post' : 'Novo Post'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Edite o conteúdo da publicação' : 'Crie uma nova publicação para o blog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo Principal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={handleTitleChange}
                    required
                    disabled={isLoading}
                    placeholder="Título chamativo para o post"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={handleSlugChange}
                    required
                    disabled={isLoading}
                    placeholder="ex: dicas-de-decoracao"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chamada">Chamada (Resumo)</Label>
                  <Textarea
                    id="chamada"
                    value={formData.chamada}
                    onChange={(e) => setFormData(prev => ({ ...prev, chamada: e.target.value }))}
                    disabled={isLoading}
                    rows={3}
                    placeholder="Um pequeno resumo que aparece na listagem..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo Completo *</Label>
                  <RichTextEditor
                    content={formData.conteudo}
                    onChange={(html) => setFormData(prev => ({ ...prev, conteudo: html }))}
                    className={isLoading ? 'opacity-50 pointer-events-none' : ''}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: PostStatus) => setFormData(prev => ({ ...prev, status: value }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                      <SelectItem value="PUBLICADO">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoriaId">Categoria *</Label>
                  <Select
                    value={formData.categoriaId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoriaId: value }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataPublicacao">Data de Publicação</Label>
                  <Input
                    id="dataPublicacao"
                    type="date"
                    value={formData.dataPublicacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataPublicacao: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imovelId">Imóvel Relacionado</Label>
                  <Select
                    value={formData.imovelId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, imovelId: value }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a um imóvel..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Nenhum</SelectItem>
                      {properties?.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id.toString()}>
                          [{prop.codigo}] {prop.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Imagem de Capa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewImage ? (
                  <div className="relative group">
                    <img
                      src={previewImage}
                      alt="Capa"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setPreviewImage(null);
                        setFormData(prev => ({ ...prev, imagemCapa: undefined, oldImagemCapa: '' }));
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => document.getElementById('imagemCapa')?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Clique para upload</span>
                    <span className="text-xs text-muted-foreground mt-1">Recomendado: 1200x630px</span>
                  </div>
                )}
                <Input
                  id="imagemCapa"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar Alterações' : 'Publicar Post'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate('/admin/blog')}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
