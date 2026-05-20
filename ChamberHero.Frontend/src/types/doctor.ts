export interface Doctor {
  id: string;
  email: string;
  fullName: string;
  bmdcRegistrationNo: string;
  phoneNo: string;
  qualificationRaw: string;
  systemRole: 'Doctor' | 'SuperAdmin';
  billingModel: 'Subscription_Fixed' | 'Pay_Per_Rx';
  plan_tier: 'Lite' | 'Pro' | 'Elite' | 'Pay_As_You_Grow';
  isActive: boolean;
}
