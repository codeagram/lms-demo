export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function hasRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    admin: 2,
    staff: 1,
  };
  
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
}

export function canApproveLoans(userRole: string): boolean {
  return userRole === 'admin';
}

export function canAccessReports(userRole: string): boolean {
  return hasRole(userRole, 'staff');
}

export function canManageAccounting(userRole: string): boolean {
  return hasRole(userRole, 'staff');
}

export function canDeleteRecords(userRole: string): boolean {
  return userRole === 'admin';
}
