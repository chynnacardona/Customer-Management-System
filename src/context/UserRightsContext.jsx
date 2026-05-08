import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const UserRightsContext = createContext({});

export const UserRightsProvider = ({ children }) => {
  const { user } = useAuth();
  const [rights, setRights] = useState({
    CUST_VIEW: 0,
    CUST_ADD: 0,
    CUST_EDIT: 0,
    CUST_DEL: 0,
    SALES_VIEW: 0,
    SD_VIEW: 0,
    PROD_VIEW: 0,
    PRICE_VIEW: 0,
    ADM_USER: 0,
  });
  const [userType, setUserType] = useState(null);
  const [rightsLoading, setRightsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Reset everything on logout
      setRights({
        CUST_VIEW: 0, CUST_ADD: 0, CUST_EDIT: 0, CUST_DEL: 0,
        SALES_VIEW: 0, SD_VIEW: 0, PROD_VIEW: 0, PRICE_VIEW: 0, ADM_USER: 0,
      });
      setUserType(null);
      setRightsLoading(false);
      return;
    }

    const fetchRights = async () => {
      setRightsLoading(true);

      // 1. Get user's role/type from public.user table
      const { data: userData } = await supabase
        .from('user')
        .select('user_id, role')
        .eq('email', user.email)
        .single();

      if (!userData) {
        setRightsLoading(false);
        return;
      }

      setUserType(userData.role); // 'SUPERADMIN', 'ADMIN', or 'USER'

      // 2. Get all 9 rights rows for this user
      const { data: rightsData } = await supabase
        .from('UserModule_Rights')
        .select('right_id, is_allowed')
        .eq('user_id', userData.user_id);

      if (rightsData) {
        // Convert array of rows into a flat object { CUST_VIEW: 1, CUST_ADD: 0, ... }
        const rightsMap = {};
        rightsData.forEach(row => {
          rightsMap[row.right_id] = row.is_allowed;
        });
        setRights(prev => ({ ...prev, ...rightsMap }));
      }

      setRightsLoading(false);
    };

    fetchRights();
  }, [user]);

  return (
    <UserRightsContext.Provider value={{ rights, userType, rightsLoading }}>
      {children}
    </UserRightsContext.Provider>
  );
};

export const useRights = () => useContext(UserRightsContext);