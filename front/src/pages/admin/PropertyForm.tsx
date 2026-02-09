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
import { ArrowLeft, Loader2, X, Upload, Search } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { GoogleMap } from '@/components/ui/google-map';
import CurrencyInput from 'react-currency-input-field';

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<PropertyFormData>({
    titulo: '',
    codigo: '',
    descricaoCurta: '',
    descricaoLonga: '',
    tipo: '',
    finalidade: '',
    valor: '',
    valorPromo: '',
    cep: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    latitude: undefined,
    longitude: undefined,
    suites: undefined,
    dormitorios: undefined,
    banheiros: undefined,
    garagem: false,
    geminada: false,
    terrenoMedidas: '',
    terrenoM2: undefined,
    areaConstruida: undefined,
    fotos: [],
    oldPhotos: [],
    imagemCapa: undefined,
    oldImagemCapa: '',
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewCapa, setPreviewCapa] = useState<string | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  // Callback para atualizar coordenadas quando o mapa fizer geocoding
  const handleLocationChange = (lat: number, lng: number) => {
    console.log('🗺️ GoogleMap retornou coordenadas:', { lat, lng });
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

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
        descricaoCurta: property.descricaoCurta || '',
        descricaoLonga: property.descricaoLonga || '',
        tipo: property.tipo?.[0]?.tipo.id.toString() || '',
        finalidade: property.finalidade?.[0]?.finalidade.id.toString() || '',
        valor: property.valor || '',
        valorPromo: property.valorPromo || '',
        cep: property.cep || '',
        endereco: property.endereco || '',
        bairro: property.bairro || '',
        cidade: property.cidade || '',
        estado: property.estado || '',
        latitude: property.latitude,
        longitude: property.longitude,
        suites: property.suites,
        dormitorios: property.dormitorios,
        banheiros: property.banheiros,
        garagem: property.garagem || false,
        geminada: property.geminada || false,
        terrenoMedidas: property.terrenoMedidas || '',
        terrenoM2: property.terrenoM2,
        areaConstruida: property.areaConstruida,
        fotos: [],
        oldPhotos: property.fotos || [],
        oldImagemCapa: property.imagemCapa || '',
      });
      setPreviewImages(property.fotos || []);
      setPreviewCapa(property.imagemCapa || null);
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

    console.log('📤 Enviando formulário com dados:', {
      ...formData,
      fotos: formData.fotos?.length || 0,
      oldPhotos: formData.oldPhotos?.length || 0
    });
    console.log('📍 Coordenadas no momento do envio:', {
      latitude: formData.latitude,
      longitude: formData.longitude
    });

    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof PropertyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Formatar CEP (XXXXX-XXX)
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  // Buscar endereço pelo CEP
  const handleCepChange = async (value: string) => {
    const formattedCep = formatCep(value);
    handleChange('cep', formattedCep);

    const numbersOnly = value.replace(/\D/g, '');

    // Só busca quando tiver 8 dígitos
    if (numbersOnly.length === 8) {
      setLoadingCep(true);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${numbersOnly}/json/`);
        const data = await response.json();

        console.log('📍 Dados do ViaCEP:', data);

        if (data.erro) {
          toast({
            variant: 'destructive',
            title: 'CEP não encontrado',
            description: 'O CEP informado não foi encontrado na base de dados.',
          });
          return;
        }

        // Preencher os campos automaticamente
        setFormData((prev) => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        }));

        // Mostrar quais campos foram preenchidos
        const camposPreenchidos = [];
        if (data.logradouro) camposPreenchidos.push('Rua');
        if (data.bairro) camposPreenchidos.push('Bairro');
        if (data.localidade) camposPreenchidos.push('Cidade');
        if (data.uf) camposPreenchidos.push('Estado');

        toast({
          title: 'CEP encontrado!',
          description: camposPreenchidos.length > 0
            ? `Preenchido: ${camposPreenchidos.join(', ')}`
            : 'CEP encontrado, mas sem dados de endereço disponíveis.',
        });
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar CEP',
          description: 'Não foi possível buscar o endereço. Tente novamente.',
        });
      } finally {
        setLoadingCep(false);
      }
    }
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

  // Handler para upload de imagem de capa
  const handleCapaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O limite é 10MB.'
      });
      return;
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Tipo inválido',
        description: 'Apenas JPEG, JPG, PNG e WEBP são permitidos.'
      });
      return;
    }

    setFormData(prev => ({ ...prev, imagemCapa: file, oldImagemCapa: '' }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviewCapa(reader.result as string);
    reader.readAsDataURL(file);
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
              <RichTextEditor
                content={formData.descricaoLonga}
                onChange={(html) => handleChange('descricaoLonga', html)}
                className={isLoading ? 'opacity-50 pointer-events-none' : ''}
              />
              <p className="text-sm text-muted-foreground">
                Use o editor para formatar o texto com negrito, itálico, listas e mais.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
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
                <CurrencyInput
                  id="valor"
                  name="valor"
                  placeholder=""
                  value={formData.valor}
                  onValueChange={(value) => handleChange('valor', value || '')}
                  prefix="R$ "
                  decimalSeparator=","
                  groupSeparator="."
                  decimalsLimit={2}
                  allowNegativeValue={false}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorPromo">Valor Promocional (R$)</Label>
                <CurrencyInput
                  id="valorPromo"
                  name="valorPromo"
                  placeholder=""
                  value={formData.valorPromo}
                  onValueChange={(value) => handleChange('valorPromo', value || '')}
                  prefix="R$ "
                  decimalSeparator=","
                  groupSeparator="."
                  decimalsLimit={2}
                  allowNegativeValue={false}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Seção de Características */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Características do Imóvel</h3>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="dormitorios">Dormitórios</Label>
                  <Input
                    id="dormitorios"
                    type="number"
                    min="0"
                    value={formData.dormitorios ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dormitorios: e.target.value ? parseInt(e.target.value) : undefined }))}
                    disabled={isLoading}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suites">Suítes</Label>
                  <Input
                    id="suites"
                    type="number"
                    min="0"
                    value={formData.suites ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, suites: e.target.value ? parseInt(e.target.value) : undefined }))}
                    disabled={isLoading}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banheiros">Banheiros</Label>
                  <Input
                    id="banheiros"
                    type="number"
                    min="0"
                    value={formData.banheiros ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, banheiros: e.target.value ? parseInt(e.target.value) : undefined }))}
                    disabled={isLoading}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="garagem">Garagem</Label>
                  <Select
                    value={formData.garagem ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, garagem: value === 'sim' }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Possui garagem?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="geminada">Casa Geminada</Label>
                  <Select
                    value={formData.geminada ? 'sim' : 'nao'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, geminada: value === 'sim' }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Casa geminada?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaConstruida">Área Construída (m²)</Label>
                  <Input
                    id="areaConstruida"
                    type="number"
                    min="0"
                    value={formData.areaConstruida ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, areaConstruida: e.target.value ? parseInt(e.target.value) : undefined }))}
                    disabled={isLoading}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terrenoM2">Terreno (m²)</Label>
                  <Input
                    id="terrenoM2"
                    type="number"
                    min="0"
                    value={formData.terrenoM2 ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, terrenoM2: e.target.value ? parseInt(e.target.value) : undefined }))}
                    disabled={isLoading}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terrenoMedidas">Medidas do Terreno</Label>
                  <Input
                    id="terrenoMedidas"
                    value={formData.terrenoMedidas}
                    onChange={(e) => handleChange('terrenoMedidas', e.target.value)}
                    disabled={isLoading}
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            {/* Seção de Endereço com CEP */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Localização</h3>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      disabled={isLoading || loadingCep}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {loadingCep && (
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Preenche automaticamente o endereço
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleChange('endereco', e.target.value)}
                    disabled={isLoading}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => handleChange('bairro', e.target.value)}
                    disabled={isLoading}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleChange('cidade', e.target.value)}
                    disabled={isLoading}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    disabled={isLoading}
                    placeholder=""
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Mapa do Google Maps */}
              <GoogleMap
                address={formData.endereco || ''}
                city={formData.cidade}
                state={formData.estado}
                cep={formData.cep}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* Upload de Imagem de Capa */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Imagem de Capa</h3>
              <p className="text-sm text-muted-foreground">
                Imagem principal que será exibida em destaque. Recomendado: 1200x630px
              </p>
              <div className="space-y-4">
                {previewCapa ? (
                  <div className="relative group max-w-md">
                    <img
                      src={previewCapa}
                      alt="Capa"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setPreviewCapa(null);
                        setFormData(prev => ({ ...prev, imagemCapa: undefined, oldImagemCapa: '' }));
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg aspect-video max-w-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
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
                  onChange={handleCapaChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
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
