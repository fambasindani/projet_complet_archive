// @ts-nocheck
import React, { createContext, useState, useContext, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  // Données initiales mockées
  const initialUsers = [
    {
      id: '1',
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@email.com',
      password: 'password123',
      statut: 'active',
      role_ids: ['1'],
      datecreation: new Date('2023-01-15').toISOString(),
      dernierconnection: new Date('2023-10-01').toISOString()
    },
    {
      id: '2',
      nom: 'Martin',
      prenom: 'Marie',
      email: 'marie.martin@email.com',
      password: 'password123',
      statut: 'active',
      role_ids: ['2'],
      datecreation: new Date('2023-02-20').toISOString(),
      dernierconnection: new Date('2023-10-02').toISOString()
    },
    {
      id: '3',
      nom: 'Bernard',
      prenom: 'Pierre',
      email: 'pierre.bernard@email.com',
      password: 'password123',
      statut: 'inactive',
      role_ids: ['3'],
      datecreation: new Date('2023-03-10').toISOString(),
      dernierconnection: new Date('2023-09-15').toISOString()
    },
    {
      id: '4',
      nom: 'Dubois',
      prenom: 'Sophie',
      email: 'sophie.dubois@email.com',
      password: 'password123',
      statut: 'bloqué',
      role_ids: ['1', '2'],
      datecreation: new Date('2023-04-05').toISOString(),
      dernierconnection: new Date('2023-08-30').toISOString()
    }
  ];

  const initialRoles = [
    {
      id: '1',
      nom: 'Admin',
      description: 'Administrateur système avec tous les droits',
      permissions: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      users_count: 2
    },
    {
      id: '2',
      nom: 'Modérateur',
      description: 'Modérateur avec des droits limités',
      permissions: ['2', '5', '6', '7'],
      users_count: 2
    },
    {
      id: '3',
      nom: 'Utilisateur',
      description: 'Utilisateur standard avec accès basique',
      permissions: ['6'],
      users_count: 1
    }
  ];

  const initialPermissions = [
    { id: '1', code: 'user_create', description: 'Créer des utilisateurs' },
    { id: '2', code: 'user_read', description: 'Voir les utilisateurs' },
    { id: '3', code: 'user_update', description: 'Modifier des utilisateurs' },
    { id: '4', code: 'user_delete', description: 'Supprimer des utilisateurs' },
    { id: '5', code: 'content_create', description: 'Créer du contenu' },
    { id: '6', code: 'content_read', description: 'Voir le contenu' },
    { id: '7', code: 'content_update', description: 'Modifier le contenu' },
    { id: '8', code: 'content_delete', description: 'Supprimer du contenu' },
    { id: '9', code: 'role_manage', description: 'Gérer les rôles' },
    { id: '10', code: 'permission_manage', description: 'Gérer les permissions' },
    { id: '11', code: 'settings_manage', description: 'Gérer les paramètres système' },
    { id: '12', code: 'dashboard_view', description: 'Voir le tableau de bord' }
  ];

  // NOUVELLES DONNÉES INITIALES POUR DIRECTIONS
  const initialDirections = [
    {
      id: '1',
      sigle: 'DRH',
      nom: 'Direction des Ressources Humaines',
      datecreation: new Date('2023-01-01').toISOString()
    },
    {
      id: '2',
      sigle: 'DF',
      nom: 'Direction Financière',
      datecreation: new Date('2023-01-01').toISOString()
    },
    {
      id: '3',
      sigle: 'DTI',
      nom: 'Direction des Technologies de l\'Information',
      datecreation: new Date('2023-01-01').toISOString()
    },
    {
      id: '4',
      sigle: 'DCOM',
      nom: 'Direction Commerciale',
      datecreation: new Date('2023-01-01').toISOString()
    }
  ];

  const initialDirectionUsers = [
    { id: '1', id_user: '1', id_direction: '1' },
    { id: '2', id_user: '1', id_direction: '3' },
    { id: '3', id_user: '2', id_direction: '2' },
    { id: '4', id_user: '3', id_direction: '4' }
  ];

  // États initiaux
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem('gestion_users');
    return savedUsers ? JSON.parse(savedUsers) : initialUsers;
  });

  const [roles, setRoles] = useState(() => {
    const savedRoles = localStorage.getItem('gestion_roles');
    return savedRoles ? JSON.parse(savedRoles) : initialRoles;
  });

  const [permissions, setPermissions] = useState(() => {
    const savedPermissions = localStorage.getItem('gestion_permissions');
    return savedPermissions ? JSON.parse(savedPermissions) : initialPermissions;
  });

  // NOUVEAUX ÉTATS POUR DIRECTIONS
  const [directions, setDirections] = useState(() => {
    const savedDirections = localStorage.getItem('gestion_directions');
    return savedDirections ? JSON.parse(savedDirections) : initialDirections;
  });

  const [directionUsers, setDirectionUsers] = useState(() => {
    const savedDirectionUsers = localStorage.getItem('gestion_direction_users');
    return savedDirectionUsers ? JSON.parse(savedDirectionUsers) : initialDirectionUsers;
  });

  // Sauvegarde dans localStorage
  useEffect(() => {
    localStorage.setItem('gestion_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('gestion_roles', JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem('gestion_permissions', JSON.stringify(permissions));
  }, [permissions]);

  // NOUVEAUX USEEFFECT POUR DIRECTIONS
  useEffect(() => {
    localStorage.setItem('gestion_directions', JSON.stringify(directions));
  }, [directions]);

  useEffect(() => {
    localStorage.setItem('gestion_direction_users', JSON.stringify(directionUsers));
  }, [directionUsers]);

  // Fonctions pour les utilisateurs
  const addUser = (userData) => {
    const newUser = {
      id: uuidv4(),
      ...userData,
      datecreation: new Date().toISOString(),
      dernierconnection: null
    };
    setUsers([...users, newUser]);
    
    // Mettre à jour le compteur d'utilisateurs pour les rôles
    updateRoleUserCount();
    
    toast.success('Utilisateur créé avec succès');
  };

  const updateUser = (id, userData) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, ...userData } : user
    ));
    
    // Mettre à jour le compteur d'utilisateurs pour les rôles
    updateRoleUserCount();
    
    toast.success('Utilisateur mis à jour avec succès');
  };

  const deleteUser = (id) => {
    // NOUVEAU : Supprimer aussi les assignations de direction
    deleteAllDirectionUsersForUser(id);
    setUsers(users.filter(user => user.id !== id));
    
    // Mettre à jour le compteur d'utilisateurs pour les rôles
    updateRoleUserCount();
    
    toast.success('Utilisateur supprimé avec succès');
  };

  // Fonctions pour les rôles
  const addRole = (roleData) => {
    const newRole = {
      id: uuidv4(),
      ...roleData,
      permissions: roleData.permissions || [],
      users_count: 0
    };
    setRoles([...roles, newRole]);
    toast.success('Rôle créé avec succès');
  };

  const updateRole = (id, roleData) => {
    setRoles(roles.map(role => 
      role.id === id ? { ...role, ...roleData } : role
    ));
    toast.success('Rôle mis à jour avec succès');
  };

  const deleteRole = (id) => {
    if (id === '1') {
      toast.error('Impossible de supprimer le rôle Admin');
      return;
    }
    
    // Mettre à jour les utilisateurs qui ont ce rôle
    setUsers(users.map(user => ({
      ...user,
      role_ids: user.role_ids.filter(roleId => roleId !== id)
    })));
    
    setRoles(roles.filter(role => role.id !== id));
    toast.success('Rôle supprimé avec succès');
  };

  // Fonctions pour les permissions
  const addPermission = (permissionData) => {
    const newPermission = {
      id: uuidv4(),
      ...permissionData
    };
    setPermissions([...permissions, newPermission]);
    toast.success('Permission créée avec succès');
  };

  const updatePermission = (id, permissionData) => {
    setPermissions(permissions.map(permission => 
      permission.id === id ? { ...permission, ...permissionData } : permission
    ));
    toast.success('Permission mise à jour avec succès');
  };

  const deletePermission = (id) => {
    // Vérifier si la permission est utilisée par des rôles
    const isUsed = roles.some(role => role.permissions.includes(id));
    
    if (isUsed) {
      toast.error('Impossible de supprimer cette permission car elle est utilisée par des rôles');
      return;
    }
    
    setPermissions(permissions.filter(permission => permission.id !== id));
    toast.success('Permission supprimée avec succès');
  };

  // NOUVELLES FONCTIONS POUR DIRECTIONS
  const addDirection = (directionData) => {
    const newDirection = {
      id: uuidv4(),
      ...directionData,
      datecreation: new Date().toISOString()
    };
    setDirections([...directions, newDirection]);
    toast.success('Direction créée avec succès');
    return newDirection;
  };

  const updateDirection = (id, directionData) => {
    setDirections(directions.map(direction => 
      direction.id === id ? { ...direction, ...directionData } : direction
    ));
    toast.success('Direction mise à jour avec succès');
  };

  const deleteDirection = (id) => {
    // Vérifier si la direction est utilisée
    const isUsed = directionUsers.some(du => du.id_direction === id);
    if (isUsed) {
      toast.error('Impossible de supprimer cette direction car elle est assignée à des utilisateurs');
      throw new Error('Cette direction est assignée à des utilisateurs');
    }
    
    setDirections(directions.filter(direction => direction.id !== id));
    toast.success('Direction supprimée avec succès');
  };

  // NOUVELLES FONCTIONS POUR DIRECTIONUSER
  const addDirectionUser = (directionUserData) => {
    // Vérifier si l'assignation existe déjà
    const exists = directionUsers.some(du => 
      du.id_user === directionUserData.id_user && 
      du.id_direction === directionUserData.id_direction
    );
    
    if (exists) {
      toast.info('Cet utilisateur est déjà assigné à cette direction');
      return;
    }
    
    const newDirectionUser = {
      id: uuidv4(),
      ...directionUserData
    };
    setDirectionUsers([...directionUsers, newDirectionUser]);
    toast.success('Assignation créée avec succès');
    return newDirectionUser;
  };

  const updateDirectionUser = (id, directionUserData) => {
    setDirectionUsers(directionUsers.map(du => 
      du.id === id ? { ...du, ...directionUserData } : du
    ));
    toast.success('Assignation mise à jour avec succès');
  };

  const deleteDirectionUser = (id) => {
    setDirectionUsers(directionUsers.filter(du => du.id !== id));
    toast.success('Assignation supprimée avec succès');
  };

  // Supprimer toutes les assignations pour un utilisateur
  const deleteAllDirectionUsersForUser = (userId) => {
    setDirectionUsers(directionUsers.filter(du => du.id_user !== userId));
  };

  // Supprimer toutes les assignations pour une direction
  const deleteAllDirectionUsersForDirection = (directionId) => {
    setDirectionUsers(directionUsers.filter(du => du.id_direction !== directionId));
  };

  // Mettre à jour le compteur d'utilisateurs par rôle
  const updateRoleUserCount = () => {
    setRoles(roles.map(role => ({
      ...role,
      users_count: users.filter(user => user.role_ids.includes(role.id)).length
    })));
  };

  // Récupérer les informations détaillées
  const getUserWithDetails = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    const userRoles = user.role_ids.map(roleId => 
      roles.find(r => r.id === roleId)
    ).filter(Boolean);
    
    // NOUVEAU : Ajouter les directions de l'utilisateur
    const userDirections = getUserDirections(userId);
    
    return {
      ...user,
      roles: userRoles,
      directions: userDirections
    };
  };

  const getRoleWithDetails = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return null;
    
    return {
      ...role,
      permissions: role.permissions.map(permId =>
        permissions.find(p => p.id === permId)
      ).filter(Boolean),
      users: users.filter(u => u.role_ids.includes(roleId))
    };
  };

  // NOUVELLE FONCTION : Obtenir les détails d'une direction
const getDirectionWithDetails = (directionId) => {
  console.log('🔍 DEBUG getDirectionWithDetails - directionId:', directionId);
  console.log('🔍 DEBUG - Type de directionId:', typeof directionId);
  console.log('🔍 DEBUG - Toutes les directions:', directions);
  
  // Essayez avec toString() pour éviter les problèmes de type
  const direction = directions.find(dir => {
    console.log('🔍 DEBUG - Comparaison direction:', dir.id, '===', directionId, '?', dir.id == directionId);
    return dir.id == directionId; // Utilisez == au lieu de === pour la conversion de type
  });
  
  console.log('🔍 DEBUG - Direction trouvée:', direction);
  
  if (!direction) {
    console.log('❌ DEBUG - Aucune direction trouvée pour id:', directionId);
    return null;
  }
  
  const directionUsersList = getDirectionUsers(directionId);
  console.log('🔍 DEBUG - Utilisateurs associés:', directionUsersList);
  
  return {
    ...direction,
    users: directionUsersList
  };
};



  // NOUVELLE FONCTION : Obtenir les directions d'un utilisateur
  const getUserDirections = (userId) => {
    const userDirectionIds = directionUsers
      .filter(du => du.id_user === userId)
      .map(du => du.id_direction);
    
    return directions.filter(dir => userDirectionIds.includes(dir.id));
  };

  // NOUVELLE FONCTION : Obtenir les utilisateurs d'une direction
/*   const getDirectionUsers = (directionId) => {
    const userIds = directionUsers
      .filter(du => du.id_direction === directionId)
      .map(du => du.id_user);
    
    return users.filter(user => userIds.includes(user.id));
  }; */

  const getDirectionUsers = (directionId) => {
  console.log('🔍 DEBUG getDirectionUsers - directionId:', directionId);
  console.log('🔍 DEBUG - Tous les directionUsers:', directionUsers);
  console.log('🔍 DEBUG - Tous les utilisateurs:', users);
  
  const userIds = directionUsers
    .filter(du => {
      console.log('🔍 DEBUG - Comparaison:', du.id_direction, '===', directionId, '?', du.id_direction === directionId);
      return du.id_direction === directionId;
    })
    .map(du => du.id_user);
  
  console.log('🔍 DEBUG - userIds trouvés:', userIds);
  
  const usersFound = users.filter(user => userIds.includes(user.id));
  console.log('🔍 DEBUG - Utilisateurs trouvés:', usersFound);
  
  return usersFound;
};

  // NOUVELLE FONCTION : Obtenir les statistiques des directions
  const getDirectionStats = () => {
    const stats = {};
    directionUsers.forEach(du => {
      stats[du.id_direction] = (stats[du.id_direction] || 0) + 1;
    });
    return stats;
  };

  // NOUVELLE FONCTION : Obtenir les utilisateurs disponibles pour une direction
  const getAvailableUsersForDirection = (directionId) => {
    const assignedUserIds = directionUsers
      .filter(du => du.id_direction === directionId)
      .map(du => du.id_user);
    
    return users.filter(user => !assignedUserIds.includes(user.id));
  };

  // NOUVELLE FONCTION : Obtenir les directions disponibles pour un utilisateur
  const getAvailableDirectionsForUser = (userId) => {
    const assignedDirectionIds = directionUsers
      .filter(du => du.id_user === userId)
      .map(du => du.id_direction);
    
    return directions.filter(direction => !assignedDirectionIds.includes(direction.id));
  };

  // Fonctions d'assignation de rôles
  const assignRoleToUser = (userId, roleId) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        if (!user.role_ids.includes(roleId)) {
          return {
            ...user,
            role_ids: [...user.role_ids, roleId]
          };
        }
      }
      return user;
    }));
    
    // Mettre à jour le compteur
    updateRoleUserCount();
    
    toast.success('Rôle assigné avec succès');
  };

  const removeRoleFromUser = (userId, roleId) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          role_ids: user.role_ids.filter(id => id !== roleId)
        };
      }
      return user;
    }));
    
    // Mettre à jour le compteur
    updateRoleUserCount();
    
    toast.success('Rôle retiré avec succès');
  };

  // Statistiques - MODIFIÉE POUR INCLURE LES DIRECTIONS
  const getStats = () => {
    const directionStats = getDirectionStats();
    const directionsWithUsers = Object.keys(directionStats).length;
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.statut === 'active').length,
      inactiveUsers: users.filter(u => u.statut === 'inactive').length,
      blockedUsers: users.filter(u => u.statut === 'bloqué').length,
      totalRoles: roles.length,
      totalDirections: directions.length, // NOUVEAU
      directionsWithUsers, // NOUVEAU
      recentUsers: users
        .sort((a, b) => new Date(b.datecreation) - new Date(a.datecreation))
        .slice(0, 5)
    };
  };

  // Utilitaires
  const getPermissionsByRole = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return [];
    return role.permissions.map(permId => 
      permissions.find(p => p.id === permId)
    ).filter(Boolean);
  };

  const getUsersByRole = (roleId) => {
    return users.filter(u => u.role_ids.includes(roleId));
  };

  return (
    <UserContext.Provider value={{
      // Données
      users,
      roles,
      permissions,
      directions, // NOUVEAU
      directionUsers, // NOUVEAU
      
      // Fonctions utilisateurs
      addUser,
      updateUser,
      deleteUser,
      getUserWithDetails,
      assignRoleToUser,
      removeRoleFromUser,
      
      // Fonctions rôles
      addRole,
      updateRole,
      deleteRole,
      getRoleWithDetails,
      
      // Fonctions permissions
      addPermission,
      updatePermission,
      deletePermission,
      
      // NOUVELLES Fonctions directions
      addDirection,
      updateDirection,
      deleteDirection,
      getDirectionWithDetails,
      getUserDirections,
      getDirectionUsers,
      getDirectionStats,
      getAvailableUsersForDirection,
      getAvailableDirectionsForUser,
      
      // NOUVELLES Fonctions DirectionUser
      addDirectionUser,
      updateDirectionUser,
      deleteDirectionUser,
      deleteAllDirectionUsersForUser,
      deleteAllDirectionUsersForDirection,
      
      // Statistiques
      getStats,
      
      // Utilitaires
      getPermissionsByRole,
      getUsersByRole
    }}>
      {children}
    </UserContext.Provider>
  );
};