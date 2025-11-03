import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesService } from '@/services/properties.service';
import { tiposService } from '@/services/tipos.service';
import { finalidadesService } from '@/services/finalidades.service';
import { PropertyFormData } from '@/types/admin';
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

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<PropertyFormData>({
    titulo: '',
    codigo: '',
    subTitulo: '',
    descricaoCurta: '',
    descricaoLonga: '',
    tipo: '',
    finalidade: '',
    valor: '',
    endereco: '',
    cidade: '',
    fotos: [],
    oldPhotos: [],
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Buscar tipos
  const { data: tipos } = useQuery({
    queryKey: ['tipos'],
    queryFn: () => tiposService.getAll(),
  });

  // Buscar finalidades
  const { data: finalidades } = useQuery({
    queryKey: ['finalidades'],
    queryFn: () => finalidadesService.getAll(),
  });

  // Buscar imóvel se for edição
  const { data: property } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesService.getById(Number(id)),
    enabled: isEdit && !!id,
  });

  useEffect(() => {
    if (property && isEdit) {
      setFormData({
        titulo: property.titulo,
        codigo: property.codigo,
        subTitulo: property.subTitulo || '',
        descricaoCurta: property.descricaoCurta || '',
        descricaoLonga: property.descricaoLonga || '',
        tipo: property.tipo?.[0]?.tipo.id.toString() || '',
        finalidade: property.finalidade?.[0]?.finalidade.id.toString() || '',
        valor: property.valor || '',
        endereco: property.endereco || '',
        cidade: property.cidade || '',
        fotos: [],
        oldPhotos: property.fotos || [],
      });
      setPreviewImages(property.fotos || []);
    }
  }, [property, isEdit]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: PropertyFormData) => propertiesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: 'Imóvel criado',
        description: 'O imóvel foi criado com sucesso.',
      });
      navigate('/admin/imoveis');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar imóvel',
        description: error.message,
      });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: Partial<PropertyFormData>) => 
      propertiesService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      toast({
        title: 'Imóvel atualizado',
        description: 'O imóvel foi atualizado com sucesso.',
      });
      navigate('/admin/imoveis');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar imóvel',
        description: error.message,
      });
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

  const handleChange = (field: keyof PropertyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handler para upload de imagens
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const currentTotal = (formData.fotos?.length || 0) + (formData.oldPhotos?.length || 0);
    
    if (currentTotal + newFiles.length > 18) {
      toast({
        variant: 'destructive',
        title: 'Limite de imagens',
        description: 'Você pode adicionar no máximo 18 imagens.',
      });
      return;
    }

    // Validar tamanho dos arquivos (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const filesTooLarge = newFiles.filter(file => file.size > maxSize);
    
    if (filesTooLarge.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: `${filesTooLarge.length} arquivo(s) excede(m) o limite de 10MB. ` +
          `Arquivo(s): ${filesTooLarge.map(f => f.name).join(', ')}`,
      });
      // Limpar input
      e.target.value = '';
      return;
    }

    // Validar tipos de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidTypes = newFiles.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidTypes.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: `Apenas JPEG, JPG, PNG e WEBP são permitidos. ` +
          `Arquivo(s) inválido(s): ${invalidTypes.map(f => f.name).join(', ')}`,
      });
      e.target.value = '';
      return;
    }

    // Adicionar novas fotos
    setFormData(prev => ({
      ...prev,
      fotos: [...(prev.fotos || []), ...newFiles],
    }));

    // Criar previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Limpar input para permitir selecionar o mesmo arquivo novamente se necessário
    e.target.value = '';
  };

  // Remover imagem
  const handleRemoveImage = (index: number) => {
    const totalOldPhotos = formData.oldPhotos?.length || 0;
    
    if (index < totalOldPhotos) {
      // Remover de oldPhotos
      setFormData(prev => ({
        ...prev,
        oldPhotos: prev.oldPhotos?.filter((_, i) => i !== index),
      }));
    } else {
      // Remover de novas fotos
      const newIndex = index - totalOldPhotos;
      setFormData(prev => ({
        ...prev,
        fotos: prev.fotos?.filter((_, i) => i !== newIndex),
      }));
    }

    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/imoveis')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Imóvel' : 'Novo Imóvel'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Edite as informações do imóvel' : 'Preencha os dados do novo imóvel'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Imóvel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => handleChange('codigo', e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Ex: IMO001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subTitulo">Subtítulo</Label>
              <Input
                id="subTitulo"
                value={formData.subTitulo}
                onChange={(e) => handleChange('subTitulo', e.target.value)}
                disabled={isLoading}
                placeholder="Ex: 3 quartos com suíte"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricaoCurta">Descrição Curta</Label>
              <Textarea
                id="descricaoCurta"
                value={formData.descricaoCurta}
                onChange={(e) => handleChange('descricaoCurta', e.target.value)}
                disabled={isLoading}
                rows={2}
                placeholder="Breve descrição do imóvel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricaoLonga">Descrição Completa</Label>
              <Textarea
                id="descricaoLonga"
                value={formData.descricaoLonga}
                onChange={(e) => handleChange('descricaoLonga', e.target.value)}
                disabled={isLoading}
                rows={5}
                placeholder="Descrição detalhada do imóvel"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleChange('tipo', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos?.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalidade">Finalidade *</Label>
                <Select
                  value={formData.finalidade}
                  onValueChange={(value) => handleChange('finalidade', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a finalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {finalidades?.map((finalidade) => (
                      <SelectItem key={finalidade.id} value={finalidade.id.toString()}>
                        {finalidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  value={formData.valor}
                  onChange={(e) => handleChange('valor', e.target.value)}
                  disabled={isLoading}
                  placeholder="450000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => handleChange('endereco', e.target.value)}
                disabled={isLoading}
                placeholder="Rua das Flores, 123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                disabled={isLoading}
                placeholder="São Paulo"
              />
            </div>

            {/* Upload de Imagens */}
            <div className="space-y-2">
              <Label>Imagens (máximo 18 arquivos, 10MB por arquivo)</Label>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: JPEG, JPG, PNG, WEBP
              </p>
              <div className="space-y-4">
                {/* Preview de imagens */}
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input de upload */}
                <div className="flex items-center gap-4">
                  <Input
                    id="fotos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={isLoading || previewImages.length >= 10}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('fotos')?.click()}
                    disabled={isLoading || previewImages.length >= 18}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar Imagens
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {previewImages.length} / 18 imagens
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Salvar Alterações' : 'Criar Imóvel'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/imoveis')}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
