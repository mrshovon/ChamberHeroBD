"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Patient } from "@/types/patient";
import type { PrescriptionCreatePayload, PrescriptionItemPayload } from "@/types/prescription";
import { getToken } from "@/lib/auth";
import { useChamber } from "@/context/ChamberContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5129";
const PATIENTS_API_URL = `${API_BASE_URL}/patients`;
const PRESCRIPTIONS_API_URL = `${API_BASE_URL}/prescriptions`;

const emptyMedicineRow = (): PrescriptionItemPayload => ({
  medicineName: "",
  dosage: "",
  duration: "",
  instructions: "",
});

export default function NewPrescriptionPage() {
  const router = useRouter();
  const { activeChamber } = useChamber();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [chiefComplaints, setChiefComplaints] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [medicines, setMedicines] = useState<PrescriptionItemPayload[]>([emptyMedicineRow()]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatients() {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(PATIENTS_API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(`Unable to load patients (${response.status})`);
        }

        const data: Patient[] = await response.json();
        setPatients(data);
        setSelectedPatientId(data[0]?.id ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load patients.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPatients();
  }, [router]);

  const updateMedicineRow = (index: number, field: keyof PrescriptionItemPayload, value: string) => {
    setMedicines((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  };

  const addMedicineRow = () => {
    setMedicines((current) => [...current, emptyMedicineRow()]);
  };

  const removeMedicineRow = (index: number) => {
    setMedicines((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!activeChamber) {
      setError("Please select an active chamber before creating a prescription.");
      setIsSubmitting(false);
      return;
    }

    if (!selectedPatientId) {
      setError("Please select a patient for this prescription.");
      setIsSubmitting(false);
      return;
    }

    const payload: PrescriptionCreatePayload = {
      patientId: selectedPatientId,
      chamberId: activeChamber.id,
      chiefComplaints,
      medicalHistory,
      diagnosis,
      advice,
      items: medicines.filter((item) => item.medicineName.trim().length > 0),
    };

    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(PRESCRIPTIONS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const body = await response.json();
        throw new Error(body?.message ?? `Submission failed: ${response.status}`);
      }

      setSuccess("Prescription saved successfully. Preparing print preview...");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.print();
        }
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save prescription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/85 p-8 shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">Prescription Workbench</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Create a new prescription</h1>
              <p className="mt-2 text-slate-400">
                Choose a patient, add complaints and medicines, then save and print the prescription.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-800/90 px-5 py-4 text-slate-300 shadow-inner shadow-slate-950/20">
              <p className="text-sm text-slate-400">Active chamber</p>
              <p className="mt-2 text-lg font-semibold text-white">{activeChamber?.name ?? "No chamber selected"}</p>
            </div>
          </div>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="rounded-3xl border border-slate-800 bg-slate-900/85 p-8 shadow-xl shadow-slate-950/20">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                Select patient
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="" disabled>
                    Choose a patient
                  </option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} — {patient.phoneNo}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                Chamber
                <input
                  type="text"
                  value={activeChamber?.name ?? "Select a chamber in the dashboard"}
                  disabled
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-400 outline-none"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/85 p-8 shadow-xl shadow-slate-950/20">
            <h2 className="text-xl font-semibold text-white">Clinical details</h2>
            <div className="mt-6 grid gap-6">
              <label className="space-y-2 text-sm text-slate-300">
                Chief complaints
                <textarea
                  value={chiefComplaints}
                  onChange={(e) => setChiefComplaints(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                Medical history
                <textarea
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                Diagnosis
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                Advice
                <textarea
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/85 p-8 shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Medicine items</h2>
                <p className="mt-1 text-sm text-slate-400">Add one or more medications for this prescription.</p>
              </div>
              <button
                type="button"
                onClick={addMedicineRow}
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Add row
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {medicines.map((medicine, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-inner shadow-slate-950/20">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <label className="flex-1 space-y-2 text-sm text-slate-300">
                      Medicine name
                      <input
                        value={medicine.medicineName}
                        onChange={(e) => updateMedicineRow(index, "medicineName", e.target.value)}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="Paracetamol"
                      />
                    </label>

                    <label className="w-full flex-1 space-y-2 text-sm text-slate-300">
                      Dosage
                      <input
                        value={medicine.dosage}
                        onChange={(e) => updateMedicineRow(index, "dosage", e.target.value)}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="500mg"
                      />
                    </label>

                    <label className="w-full flex-1 space-y-2 text-sm text-slate-300">
                      Duration
                      <input
                        value={medicine.duration}
                        onChange={(e) => updateMedicineRow(index, "duration", e.target.value)}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="5 days"
                      />
                    </label>
                  </div>

                  <label className="space-y-2 text-sm text-slate-300">
                    Instructions
                    <input
                      value={medicine.instructions}
                      onChange={(e) => updateMedicineRow(index, "instructions", e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="After food"
                    />
                  </label>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeMedicineRow(index)}
                      className="rounded-2xl border border-rose-700 bg-rose-700/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-700/20"
                    >
                      Remove row
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && <p className="rounded-3xl border border-rose-700/40 bg-rose-950/50 p-4 text-sm text-rose-200">{error}</p>}
          {success && <p className="rounded-3xl border border-emerald-700/40 bg-emerald-950/50 p-4 text-sm text-emerald-200">{success}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600"
            >
              Back to dashboard
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save & Print"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
