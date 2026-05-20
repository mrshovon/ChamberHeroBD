/**
 * TypeScript Type Definitions for API Contracts
 * Matches backend ApiResponse<T> schema for strict type safety
 */

/**
 * Uniform API Response Contract - Mirrors backend ApiResponse<T>
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  statusCode: number;
  traceId?: string;
}

export type PlanTier = 'Lite' | 'Pro' | 'Elite' | 'Pay_As_You_Grow';
export type SubscriptionStatus = 'Trial' | 'Active' | 'Past_Due' | 'Suspended';
export type BillingModel = 'Subscription_Fixed' | 'Pay_Per_Rx';

export interface DoctorRegisterDto {
  email: string;
  password: string;
  fullName: string;
  bmdcRegistrationNo?: string;
  phoneNo?: string;
  qualificationRaw?: string;
  billingModel: BillingModel;
  planTier: PlanTier;
  chamberName: string;
  chamberAddress: string;
  chamberPhoneNo?: string;
  chamberCustomDomain?: string;
}

export interface DoctorLoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  fullName: string;
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
}

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Error detail object returned in DEBUG mode
 */
export interface ErrorDetail {
  message: string;
  stackTrace?: string;
  innerException?: string;
}

/**
 * JWT Token Claims - Extracted from Bearer token
 */
export interface JwtTokenClaims {
  sub: string; // Subject (doctor_id)
  system_role: 'Doctor' | 'SuperAdmin';
  billing_model: 'Subscription_Fixed' | 'Pay_Per_Rx';
  plan_tier: 'Lite' | 'Pro' | 'Elite' | 'Pay_As_You_Grow';
  max_chambers: number;
  exp: number;
  iat: number;
  iss: string;
  aud: string;
}

/**
 * Doctor Entity (Representing logged-in user)
 */
export interface Doctor {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  system_role: 'Doctor' | 'SuperAdmin';
  billing_model: 'Subscription_Fixed' | 'Pay_Per_Rx';
  plan_tier: 'Lite' | 'Pro' | 'Elite' | 'Pay_As_You_Grow';
  max_chambers: number;
  trial_started_at?: string;
  trial_ends_at?: string;
  subscription_status: 'Trial' | 'Active' | 'Past_Due' | 'Suspended';
  discount_percentage: number;
  discount_ends_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Chamber Entity - Multi-chamber practice support
 */
export interface Chamber {
  id: string;
  doctor_id: string;
  chamber_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  phone: string;
  registration_number?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Staff Member - Weak entity tied to chamber
 */
export interface Staff {
  id: string;
  chamber_id: string;
  username: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

/**
 * Patient Entity - Long-term clinical visit tracking
 */
export interface Patient {
  id: string;
  chamber_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  medical_history?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Visit Vitals - JSONB data structure for visits.vitals
 */
export interface VisitVitals {
  bp_systolic: number;
  bp_diastolic: number;
  weight_kg: number;
  pulse_bpm: number;
  temperature_f: number;
  additional?: string;
}

/**
 * Visit Entity - Junction transactional sync
 */
export interface Visit {
  id: string;
  chamber_id: string;
  patient_id: string;
  visit_date: string;
  vitals: VisitVitals;
  chief_complaint?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Medicine Item (within prescription medication_json array)
 */
export interface MedicineItem {
  medicine_id: string;
  brand_name: string;
  generic_name: string;
  form: string;
  strength: string;
  dosage_frequency: string;
  dosage_duration: string;
  instructions: string;
}

/**
 * Prescription Entity - 1-to-1 mapping to visit
 */
export interface Prescription {
  id: string;
  visit_id: string;
  medication_json: MedicineItem[];
  additional_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Medicine Master - Autonomous reference matrix
 */
export interface MedicineMaster {
  id: string;
  generic_name: string;
  brand_names: string[];
  form: string;
  strength: string;
  manufacturer?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Billing Ledger Entry - Revenue tracking
 */
export interface BillingLedger {
  id: string;
  doctor_id: string;
  transaction_type: 'SubscriptionCharge' | 'PerRxCharge' | 'Refund' | 'Adjustment';
  amount: number;
  currency: string;
  description: string;
  prescription_id?: string;
  billing_period?: string;
  created_at: string;
}

/**
 * Promotion Master - Platform-wide campaign codes
 */
export interface PromotionMaster {
  id: string;
  coupon_code: string;
  discount_type: 'Percentage' | 'Fixed';
  value_amount: number;
  duration_days: number;
  applicable_plans: string[];
  max_usages: number;
  current_usages: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
