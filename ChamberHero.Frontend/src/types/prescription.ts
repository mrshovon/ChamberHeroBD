export interface PrescriptionItemPayload {
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export interface PrescriptionCreatePayload {
  patientId: string;
  chamberId: string;
  chiefComplaints: string;
  medicalHistory: string;
  diagnosis: string;
  advice: string;
  items: PrescriptionItemPayload[];
}
