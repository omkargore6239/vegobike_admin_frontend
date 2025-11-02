// utils/tokenUtils.js
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

export const getUserFromToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return {
    userId: decoded?.sub || decoded?.userId,
    roleId: decoded?.roleId,
    email: decoded?.email,
    storeId: decoded?.storeId
  };
};

export const hasRole = (roleId) => {
  const user = getUserFromToken();
  return user && user.roleId === roleId;
};

export const isStoreManager = () => {
  return hasRole(2);
};

export const isAdmin = () => {
  return hasRole(1);
};

export const hasAnyRole = (roleIds) => {
  const user = getUserFromToken();
  return user && roleIds.includes(user.roleId);
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  
  try {
    const decoded = decodeToken(token);
    const expiryTime = decoded.exp * 1000;
    return expiryTime > Date.now();
  } catch {
    return false;
  }
};
