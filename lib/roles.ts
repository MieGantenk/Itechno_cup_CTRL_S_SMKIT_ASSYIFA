export type AppRole =
  | 'admin'
  | 'merchant'
  | 'konsumen_panti'
  | 'konsumen_umum'
  | 'kurir'
  | 'pengolah_energi';

export type DatabaseRole =
  | 'admin'
  | 'merchant'
  | 'organization'
  | 'customer'
  | 'courier'
  | 'waste_processor';

const ROLE_TO_DATABASE: Record<AppRole, DatabaseRole> = {
  admin: 'admin',
  merchant: 'merchant',
  konsumen_panti: 'organization',
  konsumen_umum: 'customer',
  kurir: 'courier',
  pengolah_energi: 'waste_processor',
};

const DATABASE_TO_ROLE: Record<DatabaseRole, AppRole> = {
  admin: 'admin',
  merchant: 'merchant',
  organization: 'konsumen_panti',
  customer: 'konsumen_umum',
  courier: 'kurir',
  waste_processor: 'pengolah_energi',
};

export function toDatabaseRole(role?: string | null): DatabaseRole | string {
  if (!role) return '';
  return ROLE_TO_DATABASE[role as AppRole] || role;
}

export function toAppRole(role?: string | null): string {
  const normalized = role?.toLowerCase().trim();
  if (!normalized) return '';

  if (normalized === 'admin') return 'admin';
  if (normalized === 'merchant') return 'merchant';
  if (normalized === 'courier' || normalized === 'kurir') return 'kurir';
  if (normalized === 'customer' || normalized === 'konsumen_umum') return 'konsumen_umum';
  if (normalized === 'waste_processor' || normalized === 'pengolah_energi') return 'pengolah_energi';
  if (normalized === 'organization' || normalized === 'beneficiary' || normalized === 'konsumen_panti') return 'konsumen_panti';

  return normalized;
}

export function isCourierRole(role?: string | null): boolean {
  const normalized = role?.toLowerCase().trim();
  return normalized === 'courier' || normalized === 'kurir';
}

export function resolveUserRole(
  profileRole?: string | null,
  metadataRole?: string | null,
  metadataAppRole?: string | null
): string | undefined {
  const profileCandidate = profileRole?.trim();
  if (profileCandidate) {
    return toAppRole(profileCandidate) || profileCandidate;
  }

  const appRoleCandidate = metadataAppRole?.trim();
  if (appRoleCandidate) {
    return toAppRole(appRoleCandidate) || appRoleCandidate;
  }

  const metadataCandidate = metadataRole?.trim();
  if (metadataCandidate) {
    return toAppRole(metadataCandidate) || metadataCandidate;
  }

  return undefined;
}