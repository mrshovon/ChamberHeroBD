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
  chambers: Chamber[];
}

export interface Chamber {
  id: string;
  doctor_id: string;
  name: string;
  address: string;
  phone_no?: string | null;
  custom_domain?: string | null;
  created_at?: string;
  updated_at?: string;
}
