export type CourierTier = 'tier1' | 'tier2' | 'tier3';

const BASE_FARE: Record<CourierTier, number> = {
  tier1: 10000,
  tier2: 10000,
  tier3: 8000,
};

export function calculateCourierPay(tier: CourierTier, weightKg: number, distanceKm: number): number {
  const weight = Math.max(0, Number(weightKg) || 0);
  const distance = Math.max(0.5, Number(distanceKm) || 0.5);
  return Math.max(10000, Math.round(BASE_FARE[tier] + distance * 2000 + weight * 500));
}

export function calculateSocialPrice(normalPrice: number): number {
  return Math.max(1000, Math.round((Number(normalPrice) || 0) * 0.3));
}
