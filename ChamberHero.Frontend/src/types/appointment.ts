import type { Patient } from "@/types/patient";

export type AppointmentStatus = "Waiting" | "InConsultation" | "Completed" | "Cancelled";

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  chamber_id: string;
  serialNo: number;
  appointment_date: string;
  status: AppointmentStatus;
  patient: Patient;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentCheckInPayload {
  patientId: string;
  chamberId: string;
}

export interface AppointmentStatusUpdatePayload {
  status: AppointmentStatus;
}
