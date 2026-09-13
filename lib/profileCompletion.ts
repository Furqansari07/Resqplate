export type ProfileField = {
  key: string;
  label: string;
};

const REQUIRED_FIELDS_BY_ROLE: Record<string, ProfileField[]> = {
  donor: [
    { key: 'profilePhotoUrl', label: 'Profile photo' },
    { key: 'organizationName', label: 'Business / restaurant name' },
    { key: 'address', label: 'Pickup address' },
  ],
  volunteer: [
    { key: 'profilePhotoUrl', label: 'Profile photo' },
    { key: 'address', label: 'Your address' },
    { key: 'vehicleType', label: 'Vehicle type' },
  ],
  shelter: [
    { key: 'profilePhotoUrl', label: 'Profile photo' },
    { key: 'organizationName', label: 'NGO / shelter name' },
    { key: 'address', label: 'Shelter address' },
    { key: 'shelterCapacity', label: 'Capacity' },
  ],
  admin: [],
};

type UserLike = Record<string, any>;

export function getProfileCompletion(user: UserLike, role: string) {
  const fields = REQUIRED_FIELDS_BY_ROLE[role] || [];

  if (fields.length === 0) {
    return { percent: 100, missing: [] as ProfileField[], total: 0, filled: 0 };
  }

  const missing = fields.filter((field) => {
    const value = user[field.key];
    return value === undefined || value === null || value === '';
  });

  const filled = fields.length - missing.length;
  const percent = Math.round((filled / fields.length) * 100);

  return { percent, missing, total: fields.length, filled };
}