'use client';

import { useState, useEffect, useCallback } from 'react';
import { checkUserSubscription } from '@/app/admin/subscriptions/actions';
import { UserSubscription, SubscriptionPlan } from '@/lib/subscription-manager';

interface UseSubscriptionReturn {
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  isLoading: boolean;
  error: string | null;
  checkSubscription: () => Promise<void>;
  logout: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserId = useCallback(() => {
    // Tentar obter ID do usuário do localStorage
    return localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'anonymous';
  }, []);

  const checkSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar autenticação básica (Face ID, etc.)
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const hasPaidStatus = localStorage.getItem('hasPaid') === 'true';
      const hasSubscriptionStatus = localStorage.getItem('hasSubscription') === 'true';
      
      const basicAuth = authStatus || hasPaidStatus || hasSubscriptionStatus;
      setIsAuthenticated(basicAuth);

      if (basicAuth) {
        // Verificar assinatura no servidor se tiver userId
        const userId = getUserId();
        if (userId && userId !== 'anonymous') {
          const result = await checkUserSubscription(userId);
          
          if (result.success) {
            setHasActiveSubscription(result.isActive || false);
            setSubscription(result.subscription || null);
            setPlan(result.plan || null);
            
            // Sincronizar com localStorage
            localStorage.setItem('hasActiveSubscription', (result.isActive || false).toString());
            if (result.subscription) {
              localStorage.setItem('subscriptionData', JSON.stringify(result.subscription));
            }
          } else {
            // Se falhar na verificação do servidor, usar dados locais como fallback
            setHasActiveSubscription(hasSubscriptionStatus);
            setError('Não foi possível verificar assinatura no servidor');
          }
        } else {
          // Sem userId, usar apenas dados locais
          setHasActiveSubscription(hasSubscriptionStatus);
        }
      } else {
        setHasActiveSubscription(false);
        setSubscription(null);
        setPlan(null);
      }
    } catch (err) {
      console.error('Erro ao verificar assinatura:', err);
      setError('Erro ao verificar status da assinatura');
      
      // Fallback para dados locais
      const hasSubscriptionStatus = localStorage.getItem('hasSubscription') === 'true';
      setHasActiveSubscription(hasSubscriptionStatus);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId]);

  const logout = useCallback(() => {
    // Limpar todos os dados de autenticação e assinatura
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('hasPaid');
    localStorage.removeItem('hasSubscription');
    localStorage.removeItem('hasActiveSubscription');
    localStorage.removeItem('subscriptionData');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('customerEmail');
    
    setIsAuthenticated(false);
    setHasActiveSubscription(false);
    setSubscription(null);
    setPlan(null);
    setError(null);
  }, []);

  // Verificar status na montagem do componente
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Verificar periodicamente se a assinatura ainda está ativa
  useEffect(() => {
    if (!hasActiveSubscription) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos

    return () => clearInterval(interval);
  }, [hasActiveSubscription, checkSubscription]);

  return {
    isAuthenticated,
    hasActiveSubscription,
    subscription,
    plan,
    isLoading,
    error,
    checkSubscription,
    logout
  };
}

// Hook simplificado para verificar apenas se tem acesso
export function useAccess() {
  const { isAuthenticated, hasActiveSubscription, isLoading } = useSubscription();
  
  return {
    hasAccess: isAuthenticated || hasActiveSubscription,
    isLoading
  };
}
