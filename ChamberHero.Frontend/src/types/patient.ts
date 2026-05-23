export interface Patient {
  id: string;
  doctor_id: string;
  name: string;
  age: number;
  gender: string;
  phoneNo: string;
  bloodGroup: string;
  address: string;
  chamberId?: string | null;
  created_at: string;
  updated_at: string;
}
