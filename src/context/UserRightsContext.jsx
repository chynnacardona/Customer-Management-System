import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from './useAuth';
import { UserRightsContext } from './rightsContext';
import { DEFAULT_RIGHTS, REQUIRED_RIGHTS } from '../utils/accessRules';

const normalizeRightValue = (value) => (value === 1 || value === true || value === '1' ? 1 : 0);

const buildRightsMap = (rows = []) => {
  const rightsMap = { ...DEFAULT_RIGHTS };

  rows.forEach((row) => {
    if (REQUIRED_RIGHTS.includes(row.right_id)) {
      rightsMap[row.right_id] = normalizeRightValue(row.is_allowed);
    }
  });

  return rightsMap;
};

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
      setRights(DEFAULT_RIGHTS);
      setUserType(user.user_type ?? null);

      try {
        const authUserId = user.userId ?? user.id;

        if (!authUserId) {
          setRightsLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('userId, user_type')
          .eq('userId', authUserId)
          .maybeSingle();

        if (userError || !userData) {
          setRightsLoading(false);
          return;
        }

        setUserType(userData.user_type ?? user.user_type ?? 'USER');

        const { data: rightsData, error: rightsError } = await supabase
          .from('usermodule_rights')
          .select('right_id, is_allowed')
          .eq('userId', userData.userId);

        if (rightsError) throw rightsError;

        setRights(buildRightsMap(rightsData));
      } catch {
        setRights(DEFAULT_RIGHTS);
        setUserType(user.user_type ?? null);
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
