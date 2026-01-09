import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleMap } from '@/components/ui/google-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, DollarSign } from 'lucide-react';

interface Property {
  id: number;
  titulo: string;
  subTitulo?: string;
  descricaoCurta?: string;
  descricaoLonga?: string;
  fotos: string[];
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  valor?: string;
  codigo: string;
  tipo?: Array<{ tipo: { nome: string } }>;
  finalidade?: Array<{ finalidade: { nome: string } }>;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar dados do imóvel da API pública
    fetch(`https://admin.hajar.com.br/api/imoveis/id/${id}`)
      .then(res => res.json())
      .then(data => {
        setProperty(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erro ao buscar imóvel:', error);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto p-6">
        <p>Imóvel não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <div className="flex gap-2 mb-2">
          {property.tipo?.map((t, idx) => (
            <Badge key={idx} variant="secondary">
              <Home className="h-3 w-3 mr-1" />
              {t.tipo.nome}
            </Badge>
          ))}
          {property.finalidade?.map((f, idx) => (
            <Badge key={idx} variant="outline">
              {f.finalidade.nome}
            </Badge>
          ))}
        </div>
        <h1 className="text-4xl font-bold">{property.titulo}</h1>
        {property.subTitulo && (
          <p className="text-xl text-muted-foreground mt-2">{property.subTitulo}</p>
        )}
        {property.valor && (
          <div className="flex items-center gap-2 mt-4">
            <DollarSign className="h-6 w-6 text-green-600" />
            <span className="text-3xl font-bold text-green-600">
              R$ {parseFloat(property.valor).toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {/* Galeria de Fotos */}
      {property.fotos && property.fotos.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.fotos.map((foto, idx) => (
                <img
                  key={idx}
                  src={foto}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descrição */}
      {property.descricaoLonga && (
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              dangerouslySetInnerHTML={{ __html: property.descricaoLonga }}
              className="prose max-w-none"
            />
          </CardContent>
        </Card>
      )}

      {/* LOCALIZAÇÃO NO MAPA - A MÁGICA ACONTECE AQUI! 🗺️ */}
      {property.endereco && property.cidade && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Endereço em texto */}
              <div className="text-muted-foreground">
                <p>{property.endereco}</p>
                {property.bairro && <p>{property.bairro}</p>}
                <p>
                  {property.cidade} - {property.estado}
                </p>
                {property.cep && <p>CEP: {property.cep}</p>}
              </div>

              {/* Mapa do Google - Usa o endereço para buscar automaticamente! */}
              <GoogleMap
                address={property.endereco || ''}
                city={property.cidade}
                state={property.estado}
                cep={property.cep}
                // Não precisa do onLocationChange aqui, só queremos mostrar!
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


