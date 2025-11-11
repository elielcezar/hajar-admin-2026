import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from './card';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './alert';

interface GoogleMapProps {
  address: string;
  city?: string;
  state?: string;
  cep?: string;
  className?: string;
  onLocationChange?: (lat: number, lng: number) => void;
}

export function GoogleMap({ 
  address, 
  city, 
  state, 
  cep,
  className = '',
  onLocationChange 
}: GoogleMapProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const isGeocodingRef = useRef(false); // Controle para evitar múltiplas chamadas
  const lastAddressRef = useRef<string>(''); // Guardar último endereço pesquisado
  const lastMapCoordinatesRef = useRef<{ lat: number; lng: number } | null>(null); // Últimas coordenadas aplicadas ao mapa

  // Construir endereço completo para geocoding
  const getFullAddress = useCallback(() => {
    const parts = [address, city, state, 'Brasil'].filter(Boolean);
    return parts.join(', ');
  }, [address, city, state]);

  // Fazer geocoding do endereço
  const geocodeAddress = useCallback(async () => {
    const fullAddress = getFullAddress();
    
    if (!fullAddress || fullAddress === 'Brasil') {
      setError('Preencha o endereço para visualizar o mapa');
      setCoordinates(null);
      return;
    }

    // Evitar múltiplas chamadas para o mesmo endereço
    if (isGeocodingRef.current) {
      console.log('⏳ Aguardando requisição anterior terminar...');
      return;
    }

    // Evitar buscar o mesmo endereço novamente
    if (lastAddressRef.current === fullAddress) {
      console.log('ℹ️ Endereço já foi pesquisado:', fullAddress);
      return;
    }

    console.log('🔍 Buscando coordenadas para:', fullAddress);
    isGeocodingRef.current = true;
    lastAddressRef.current = fullAddress;
    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
      
      console.log('📡 Fazendo requisição para Geocoding API...');
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📥 Resposta da API:', data.status);

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('✅ Coordenadas encontradas:', location);
        setCoordinates({ lat: location.lat, lng: location.lng });
        
        // Notificar componente pai sobre as coordenadas
        if (onLocationChange) {
          onLocationChange(location.lat, location.lng);
        }
        
        setError(null);
      } else if (data.status === 'ZERO_RESULTS') {
        console.warn('⚠️ Nenhum resultado encontrado');
        setError('Endereço não encontrado. Verifique os dados informados.');
        setCoordinates(null);
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('❌ REQUEST_DENIED - Verifique:', data);
        setError(`API Key inválida ou APIs não ativadas. ${data.error_message || 'Ative Maps JavaScript API e Geocoding API no Google Cloud Console.'}`);
        setCoordinates(null);
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        console.error('❌ OVER_QUERY_LIMIT - Muitas requisições');
        setError('Muitas requisições. Aguarde alguns segundos e tente novamente.');
        setCoordinates(null);
      } else {
        console.error('❌ Erro desconhecido:', data.status, data);
        setError(`Erro: ${data.status}. ${data.error_message || 'Não foi possível localizar o endereço.'}`);
        setCoordinates(null);
      }
    } catch (err) {
      console.error('❌ Erro ao fazer geocoding:', err);
      setError('Erro ao buscar localização. Verifique sua conexão.');
      setCoordinates(null);
    } finally {
      setLoading(false);
      isGeocodingRef.current = false;
    }
  }, [getFullAddress, onLocationChange]);

  // Inicializar o Google Maps
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !coordinates) {
      console.log('⚠️ Mapa não pode ser inicializado:', { 
        mapRefExists: !!mapRef.current, 
        coordinatesExist: !!coordinates 
      });
      return;
    }

    // Verificar se as coordenadas realmente mudaram (evitar atualizações desnecessárias)
    if (lastMapCoordinatesRef.current && 
        lastMapCoordinatesRef.current.lat === coordinates.lat && 
        lastMapCoordinatesRef.current.lng === coordinates.lng) {
      console.log('ℹ️ Coordenadas não mudaram, ignorando atualização');
      return;
    }

    console.log('🗺️ Atualizando mapa para novas coordenadas:', coordinates);
    lastMapCoordinatesRef.current = { ...coordinates };

    try {
      // Verificar se o mapa existe E se o elemento DOM ainda é válido
      const needsRecreate = !googleMapRef.current || 
                            !googleMapRef.current.getDiv() || 
                            !googleMapRef.current.getDiv().parentElement;

      if (needsRecreate) {
        console.log('✨ Criando novo mapa...');
        
        // Limpar mapa antigo se existir
        if (googleMapRef.current) {
          try {
            googleMapRef.current.unbindAll();
          } catch (e) {
            console.warn('Erro ao limpar mapa antigo:', e);
          }
        }

        // Limpar marcador antigo
        if (markerRef.current) {
          try {
            markerRef.current.setMap(null);
            markerRef.current = null;
          } catch (e) {
            console.warn('Erro ao limpar marcador antigo:', e);
          }
        }

        // Criar novo mapa
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: coordinates,
          zoom: 16,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        // Criar marcador
        markerRef.current = new google.maps.Marker({
          position: coordinates,
          map: googleMapRef.current,
          title: getFullAddress(),
          animation: google.maps.Animation.DROP,
        });

        console.log('✅ Mapa e marcador criados com sucesso!');
      } else {
        console.log('🔄 Atualizando posição no mapa existente...');
        
        // Atualizar centro do mapa com animação suave (panTo ao invés de setCenter)
        googleMapRef.current.panTo(coordinates);
        
        // Atualizar marcador existente ou criar novo
        if (markerRef.current) {
          console.log('📍 Movendo marcador existente...');
          markerRef.current.setPosition(coordinates);
          markerRef.current.setTitle(getFullAddress());
        } else {
          console.log('📍 Criando novo marcador...');
          markerRef.current = new google.maps.Marker({
            position: coordinates,
            map: googleMapRef.current,
            title: getFullAddress(),
            animation: google.maps.Animation.DROP,
          });
        }

        console.log('✅ Mapa e marcador atualizados!');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar/atualizar mapa:', error);
      // Forçar recriação na próxima tentativa
      googleMapRef.current = null;
      markerRef.current = null;
      lastMapCoordinatesRef.current = null;
    }
  }, [coordinates, getFullAddress]);

  // Carregar script do Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    console.log('🔑 Verificando API Key:', apiKey ? 'Configurada ✅' : 'NÃO configurada ❌');
    
    if (!apiKey) {
      setError('Google Maps API Key não configurada. Adicione VITE_GOOGLE_MAPS_API_KEY no arquivo .env e reinicie o servidor');
      return;
    }

    // Verificar se o script já foi carregado
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps já carregado');
      return;
    }

    // Verificar se já existe um script sendo carregado
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('⏳ Google Maps sendo carregado...');
      return;
    }

    console.log('📦 Carregando Google Maps...');
    
    // Carregar script do Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps carregado com sucesso!');
    };
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar Google Maps');
      setError('Erro ao carregar Google Maps. Verifique sua conexão e API Key.');
    };
    
    document.head.appendChild(script);

    return () => {
      // Não remover o script para evitar recarregamentos
    };
  }, []);

  // Atualizar mapa quando o endereço mudar
  useEffect(() => {
    // Resetar o cache quando o endereço mudar para permitir nova busca
    const fullAddress = [address, city, state, 'Brasil'].filter(Boolean).join(', ');
    if (lastAddressRef.current !== fullAddress) {
      lastAddressRef.current = ''; // Limpar cache para permitir nova busca
    }

    const timer = setTimeout(() => {
      geocodeAddress();
    }, 2000); // Debounce de 3 segundos - aguarda o usuário parar de digitar

    return () => clearTimeout(timer);
  }, [address, city, state, cep, geocodeAddress]); // Adicionado geocodeAddress de volta

  // Inicializar/atualizar mapa quando as coordenadas mudarem
  useEffect(() => {
    if (coordinates && window.google && window.google.maps) {
      initializeMap();
    }
  }, [coordinates, initializeMap]); // initializeMap é estável por causa do useCallback

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Localização no Mapa</span>
      </div>
      
      <Card className="overflow-hidden">
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center h-[400px] bg-muted/50">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Localizando endereço...</p>
            </div>
          </div>
        )}

        {!loading && !error && !coordinates && (
          <div className="flex items-center justify-center h-[400px] bg-muted/50">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Preencha o endereço para visualizar o mapa
              </p>
            </div>
          </div>
        )}

        {!loading && !error && coordinates && (
          <div 
            ref={mapRef} 
            className="w-full h-[400px]"
          />
        )}
      </Card>

      {coordinates && (
        <p className="text-xs text-muted-foreground">
          📍 Coordenadas: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}

