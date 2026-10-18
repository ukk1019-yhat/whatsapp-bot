import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Business } from '../types';
import { useAuth } from './AuthContext';

interface BrandContextType {
  businesses: Business[];
  selectedBrandId: string; // 'all' or specific business.id
  selectedBusiness: Business | null;
  setSelectedBrandId: (id: string) => void;
  isLoading: boolean;
  refreshBusinesses: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType>({
  businesses: [],
  selectedBrandId: 'all',
  selectedBusiness: null,
  setSelectedBrandId: () => {},
  isLoading: true,
  refreshBusinesses: async () => {},
});

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchBusinesses = async () => {
    if (!user) {
      setBusinesses([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getBusinesses();
      setBusinesses(data);

      if (user.role !== 'super_admin' && user.businessId) {
        setSelectedBrandId(user.businessId);
      } else if (data.length > 0 && selectedBrandId === 'all') {
        // keep 'all' or default
      }
    } catch (err) {
      console.error('Failed to load businesses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  const selectedBusiness = businesses.find((b) => b.id === selectedBrandId) || null;

  return (
    <BrandContext.Provider
      value={{
        businesses,
        selectedBrandId,
        selectedBusiness,
        setSelectedBrandId,
        isLoading,
        refreshBusinesses: fetchBusinesses,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);
