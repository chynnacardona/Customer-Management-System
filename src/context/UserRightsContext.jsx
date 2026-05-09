import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from './useAuth';
import { UserRightsContext } from './rightsContext';
import { DEFAULT_RIGHTS } from '../utils/accessRules';

export const UserRightsProvider = ({ children }) => {
  const { user } = useAuth();
  const [rights, setRights] = useState(DEFAULT_RIGHTS);
  const [userType, setUserType] = useState(null);
  const [rightsLoading, setRightsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRights(DEFAULT_RIGHTS);
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
