export type VolunteerDocDef = {
  key: 'addressProofUrl' | 'vehicleLicenseUrl' | 'vehicleDocumentUrl' | 'criminalRecordUrl' | 'aadharCardUrl';
  label: string;
  hint: string;
};

export const volunteerDocumentDefs: VolunteerDocDef[] = [
  {
    key: 'addressProofUrl',
    label: 'Address Proof',
    hint: 'PDF, JPG or PNG · Max 10MB',
  },
  {
    key: 'vehicleLicenseUrl',
    label: 'Driving License',
    hint: 'PDF, JPG or PNG · Max 10MB',
  },
  {
    key: 'vehicleDocumentUrl',
    label: 'Vehicle Registration Document',
    hint: 'PDF, JPG or PNG · Max 10MB',
  },
  {
    key: 'criminalRecordUrl',
    label: 'Police Clearance Certificate (Anti-Criminal Record)',
    hint: 'PDF, JPG or PNG · Max 10MB',
  },
  {
    key: 'aadharCardUrl',
    label: 'Aadhar Card',
    hint: 'PDF, JPG or PNG · Max 10MB',
  },
];