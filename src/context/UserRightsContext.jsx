import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from './useAuth';
import { UserRightsContext } from './rightsContext';

export const UserRightsProvider = ({ children }) => {
  const { user } = useAuth();
  const [rights, setRights] = useState({
    CUST_VIEW: 0, CUST_ADD: 0, CUST_EDIT: 0, CUST_DEL: 0,
    SALES_VIEW: 0, SD_VIEW: 0, PROD_VIEW: 0, PRICE_VIEW: 0, ADM_USER: 0,
  });
  const [userType, setUserType] = useState(null);
  const [rightsLoading, setRightsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
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
      try {
        // 1. Fetches user metadata (Uses 'userId' to match your Auth table)
        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('userId, user_type')
          .eq('email', user.email)
          .single();

        if (userError || !userData) {
          setRightsLoading(false);
          return;
        }

        setUserType(userData.user_type);

        // 2. Fetches rights (Uses the specific table name that worked for you)
        const { data: rightsData } = await supabase
          .from('usermodule_rights')
          .select('right_id, is_allowed')
          .eq('userId', userData.userId);

        if (rightsData) {
          const rightsMap = {};
          rightsData.forEach(row => {
            rightsMap[row.right_id] = row.is_allowed;
          });
          setRights(prev => ({ ...prev, ...rightsMap }));
        }
      } catch {
        // Errors are caught silently for a cleaner production UI
      } finally {
        setRightsLoading(false);
      }
    };

    fetchRights();
  }, [user]);

  return (
    <UserRightsContext.Provider value={{ rights, userType, rightsLoading }}>
      {children}
    </UserRightsContext.Provider>
  );
};
