import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { destaquesService } from '@/services/destaques.service';
import { DestaqueFormData } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';

export default function DestaqueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<DestaqueFormData>({
    titulo: '',
    descricao: '',
    textoBotao: '',
    link: '',
    ativo: true,
    ordem: 0,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Buscar destaque se estiver editando
  const { data: destaque, isLoading: isLoadingDestaque } = useQuery({
    queryKey: ['destaque', id],
    queryFn: () => destaquesService.getById(Number(id)),
    enabled: isEditMode,
  });

  // Preencher formulário ao carregar dados
  useEffect(() => {
    if (destaque) {
      setFormData({
        titulo: destaque.titulo,
        descricao: destaque.descricao,
        valor: destaque.valor || undefined,
        area: destaque.area || undefined,
        quartos: destaque.quartos || undefined,
        banheiros: destaque.banheiros || undefined,
        garagem: destaque.garagem || undefined,
        textoBotao: destaque.textoBotao,
        link: destaque.link,
        ativo: destaque.ativo,
        ordem: destaque.ordem,
        oldImage: destaque.imagem,
      });
      setImagePreview(destaque.imagem);
    }
  }, [destaque]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: DestaqueFormData) => destaquesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destaques'] });
      toast({
        title: 'Destaque criado',
        description: 'O destaque foi criado com sucesso.',
      });
      navigate('/admin/destaques');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar destaque',
        description: error.message,
      });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: DestaqueFormData) => destaquesService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destaques'] });
      queryClient.invalidateQueries({ queryKey: ['destaque', id] });
      toast({
        title: 'Destaque atualizado',
        description: 'O destaque foi atualizado com sucesso.',
      });
      navigate('/admin/destaques');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar destaque',
        description: error.message,
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (isEditMode) {
      setFormData({ ...formData, oldImage: undefined });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.titulo || !formData.descricao || !formData.textoBotao || !formData.link) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    if (!isEditMode && !imageFile) {
      toast({
        variant: 'destructive',
        title: 'Imagem obrigatória',
        description: 'Selecione uma imagem para o destaque.',
      });
      return;
    }

    const dataToSend: DestaqueFormData = {
      ...formData,
      imagem: imageFile || undefined,
    };

    if (isEditMode) {
      updateMutation.mutate(dataToSend);
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingDestaque) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/destaques')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Editar Destaque' : 'Novo Destaque'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Atualize as informações do destaque' : 'Adicione um novo destaque ao Hero Section'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Oportunidade de investimento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o destaque..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="textoBotao">Texto do Botão *</Label>
                <Input
                  id="textoBotao"
                  value={formData.textoBotao}
                  onChange={(e) => setFormData({ ...formData, textoBotao: e.target.value })}
                  placeholder="Ex: Ver Mais Informações"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link *</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagem do Destaque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Label
                  htmlFor="imagem"
                  className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                >
                  Clique para selecionar uma imagem
                </Label>
                <Input
                  id="imagem"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
            {!imagePreview && (
              <Input
                id="imagem-visible"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Imóvel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  value={formData.valor || ''}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="1000000"
                />
                <p className="text-xs text-muted-foreground">Digite apenas números</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area || ''}
                  onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) || undefined })}
                  placeholder="150"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quartos">Quartos</Label>
                <Input
                  id="quartos"
                  type="number"
                  value={formData.quartos || ''}
                  onChange={(e) => setFormData({ ...formData, quartos: Number(e.target.value) || undefined })}
                  placeholder="3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banheiros">Banheiros</Label>
                <Input
                  id="banheiros"
                  type="number"
                  value={formData.banheiros || ''}
                  onChange={(e) => setFormData({ ...formData, banheiros: Number(e.target.value) || undefined })}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="garagem">Vagas de Garagem</Label>
                <Input
                  id="garagem"
                  type="number"
                  value={formData.garagem || ''}
                  onChange={(e) => setFormData({ ...formData, garagem: Number(e.target.value) || undefined })}
                  placeholder="2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Status</Label>
                <p className="text-sm text-muted-foreground">
                  Ative ou desative a exibição deste destaque
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem de Exibição</Label>
              <Input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: Number(e.target.value) })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Destaques com menor ordem aparecem primeiro no carrossel
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/destaques')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Atualizar Destaque' : 'Criar Destaque'}
          </Button>
        </div>
      </form>
    </div>
  );
}
