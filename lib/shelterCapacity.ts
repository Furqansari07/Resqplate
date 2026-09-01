import DonationListing from '@/models/DonationListing';

// Donations still "in the pipeline" count against a shelter's capacity.
// Once a donation is received, it's been checked in/distributed, so it
// no longer occupies incoming capacity.
const PIPELINE_STATUSES = ['claimed', 'in-transit', 'delivered'];

export type ShelterCapacityInfo = {
  capacity: number | null;
  capacityUnit: 'meals' | 'kg' | null;
  currentLoad: number;
  isFull: boolean;
};

/**
 * Sums quantityAmount across a shelter's in-pipeline donations that
 * share the shelter's capacity unit. Donations without a numeric
 * amount, or in a different unit, aren't counted — capacity is only
 * enforceable when both sides have matching numeric data.
 */
export async function getShelterCapacityInfo(
  shelterId: string,
  capacity: number | null | undefined,
  capacityUnit: 'meals' | 'kg' | null | undefined
): Promise<ShelterCapacityInfo> {
  if (!capacity || !capacityUnit) {
    return {
      capacity: capacity ?? null,
      capacityUnit: capacityUnit ?? null,
      currentLoad: 0,
      isFull: false,
    };
  }

  const activeDonations = await DonationListing.find({
    targetShelterId: shelterId,
    status: { $in: PIPELINE_STATUSES },
    quantityUnit: capacityUnit,
  })
    .select('quantityAmount')
    .lean();

  const currentLoad = activeDonations.reduce(
    (sum, donation) => sum + (donation.quantityAmount || 0),
    0
  );

  return {
    capacity,
    capacityUnit,
    currentLoad,
    isFull: currentLoad >= capacity,
  };
}