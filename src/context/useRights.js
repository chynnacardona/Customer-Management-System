import { useContext } from 'react';
import { UserRightsContext } from './rightsContext';

export const useRights = () => useContext(UserRightsContext);
