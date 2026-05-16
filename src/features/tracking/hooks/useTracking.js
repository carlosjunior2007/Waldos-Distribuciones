import { useCallback, useState } from 'react';
import { getPublicOrderByTracking } from '../services/tracking.service';
import { normalizeTracking } from '../tracking.helpers';

export function useTracking() {
  const [tracking, setTracking] = useState('');
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const searchTracking = useCallback(async (value) => {
    const cleanTracking = normalizeTracking(value);

    if (!cleanTracking) {
      setError('Ingresa un número de tracking.');
      setOrder(null);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const data = await getPublicOrderByTracking(cleanTracking);

      if (!data) {
        setOrder(null);
        setStatus('not_found');
        return;
      }

      setOrder(data);
      setStatus('success');
    } catch (requestError) {
      console.error(requestError);
      setOrder(null);
      setError('No se pudo consultar el pedido. Intenta de nuevo.');
      setStatus('error');
    }
  }, []);

  function resetTracking() {
    setTracking('');
    setOrder(null);
    setStatus('idle');
    setError('');
  }

  return {
    tracking,
    setTracking,
    order,
    status,
    error,
    searchTracking,
    resetTracking,
  };
}
