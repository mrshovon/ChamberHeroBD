"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Doctor } from "@/types/doctor";
import type { Patient } from "@/types/patient";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { getToken } from "@/lib/auth";
import { useChamber } from "@/context/ChamberContext";
import ChamberDropdown from "@/components/ChamberDropdown";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5129";
const DOCTORS_API_URL = `${API_BASE_URL}/doctors`;
const PATIENTS_API_URL = `${API_BASE_URL}/patients`;
const APPOINTMENTS_API_URL = `${API_BASE_URL}/appointments`;

const genderOptions = ["Male", "Female", "Other"];
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DashboardPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);
  const { activeChamber, setActiveChamber } = useChamber();
  const [isLoading, setIsLoading] = useState(true);
  const [isPatientsLoading, setIsPatientsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState("Male");
  const [phoneNo, setPhoneNo] = useState("");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [address, setAddress] = useState("");

  async function fetchPatients(token: string, chamberId?: string | null) {
    setIsPatientsLoading(true);

    try {
      const url = chamberId ? `${PATIENTS_API_URL}?chamberId=${chamberId}` : PATIENTS_API_URL;
      const response = await fetch(url, {
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
        throw new Error(`Patient request failed with status ${response.status}`);
      }

      const data: Patient[] = await response.json();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPatientsLoading(false);
    }
  }

  async function fetchAppointments(token: string, chamberId?: string | null) {
    if (!chamberId) {
      setAppointments([]);
      return;
    }

    setIsAppointmentsLoading(true);
    try {
      const response = await fetch(`${APPOINTMENTS_API_URL}/live?chamberId=${chamberId}`, {
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
        throw new Error(`Appointments request failed with status ${response.status}`);
      }

      const data: Appointment[] = await response.json();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAppointmentsLoading(false);
    }
  }

  useEffect(() => {
    async function fetchDoctors() {
      setIsLoading(true);
      setError(null);

      try {
        const token = getToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(DOCTORS_API_URL, {
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

          throw new Error(`API request failed with status ${response.status}`);
        }

        const data: Doctor[] = await response.json();
        setDoctors(data);
        // Default active chamber to the first chamber from the doctor's profile
        const firstChamberId = data?.[0]?.chambers?.[0]?.id ?? null;
        if (firstChamberId) {
          setActiveChamber(data[0].chambers[0]);
          await fetchPatients(token, firstChamberId);
          await fetchAppointments(token, firstChamberId);
        } else {
          await fetchPatients(token);
          await fetchAppointments(token, null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load doctor profile data."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchDoctors();
  }, [router]);

  // Re-fetch patients when active chamber changes
  useEffect(() => {
    async function refetch() {
      const token = getToken();
      if (!token) return;

      await Promise.all([fetchPatients(token, activeChamber?.id ?? null), fetchAppointments(token, activeChamber?.id ?? null)]);
    }

    refetch();
  }, [activeChamber]);

  async function handleSubmitPatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setFormLoading(true);

    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const body: any = {
        name,
        age,
        gender,
        phoneNo,
        bloodGroup,
        address,
      };

      if (activeChamber?.id) body.chamberId = activeChamber.id;

      const response = await fetch(PATIENTS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const errorBody = await response.json();
        throw new Error(errorBody?.message ?? `Submission failed: ${response.status}`);
      }

      const patient: Patient = await response.json();
      setPatients((current) => [patient, ...current]);
      setFormSuccess("Patient added successfully.");
      setName("");
      setAge(0);
      setGender("Male");
      setPhoneNo("");
      setBloodGroup("A+");
      setAddress("");
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save patient.");
    } finally {
      setFormLoading(false);
    }
  }

  async function checkInPatient(patientId: string) {
    if (!activeChamber) {
      setError("Select a chamber to check in the patient.");
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${APPOINTMENTS_API_URL}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          chamberId: activeChamber.id,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const body = await response.json();
        throw new Error(body?.message ?? `Check-in failed: ${response.status}`);
      }

      await fetchAppointments(token, activeChamber.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check in patient.");
    }
  }

  async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${APPOINTMENTS_API_URL}/${appointmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const body = await response.json();
        throw new Error(body?.message ?? `Update failed: ${response.status}`);
      }

      if (activeChamber) {
        await fetchAppointments(token, activeChamber.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update appointment status.");
    }
  }

  const getNextStatus = (status: AppointmentStatus): AppointmentStatus | null => {
    if (status === "Waiting") return "InConsultation";
    if (status === "InConsultation") return "Completed";
    return null;
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">
                Doctor Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
                ChamberHero BD Patient Management
              </h1>
              <p className="mt-3 max-w-2xl text-slate-400 sm:text-lg">
                Manage patients securely with JWT-protected API access and live data from Supabase.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <ChamberDropdown chambers={doctors[0]?.chambers} />
                </div>
              <div className="rounded-3xl bg-slate-800/90 px-6 py-4 text-right text-slate-300 shadow-inner shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  API endpoint
                </p>
                <p className="mt-2 font-mono text-sm text-emerald-200">{PATIENTS_API_URL}</p>
              </div>
              <Link
                href="/dashboard/prescriptions/new"
                className="rounded-3xl bg-slate-700 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-600"
              >
                Create prescription
              </Link>
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="rounded-3xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
              >
                Add new patient
              </button>
            </div>
          </div>
        </header>

        {isLoading ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center text-slate-300 shadow-xl shadow-slate-950/20">
            <p className="text-xl font-medium text-white">Loading your dashboard…</p>
            <p className="mt-2 text-slate-500">Fetching doctor and patient data from the secured API.</p>
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-rose-700/40 bg-rose-950/50 p-10 text-center text-rose-100 shadow-xl shadow-rose-950/20">
            <p className="text-xl font-semibold">Unable to load dashboard</p>
            <p className="mt-3 text-slate-300">{error}</p>
          </section>
        ) : (
          <div className="grid gap-8">
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/85 p-8 shadow-2xl shadow-slate-950/20">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-300/80">
                    Primary doctor
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">{doctors[0]?.fullName}</h2>
                  <p className="mt-2 text-slate-400">{doctors[0]?.email}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-950/85 px-5 py-4 text-slate-200">
                    <p className="text-sm text-slate-400">Doctors</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{doctors.length}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/85 px-5 py-4 text-slate-200">
                    <p className="text-sm text-slate-400">Patients</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{patients.length}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/85 p-8 shadow-2xl shadow-slate-950/20">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Live queue</h2>
                  <p className="mt-2 text-slate-400">Current appointments for {activeChamber?.name ?? "the selected chamber"}.</p>
                </div>
                <div className="rounded-3xl bg-slate-950/85 px-5 py-4 text-slate-200">
                  <p className="text-sm text-slate-400">Queue count</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{appointments.length}</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {isAppointmentsLoading ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-6 py-8 text-center text-slate-300">
                    Loading queue…
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-6 py-8 text-center text-slate-300">
                    No active appointments for this chamber yet.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Serial No.</p>
                            <p className="mt-2 text-3xl font-semibold text-white">{appointment.serialNo}</p>
                            <p className="mt-3 text-slate-400">{appointment.patient.name} · Age {appointment.patient.age}</p>
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
                              appointment.status === "Waiting" ? "bg-amber-500/15 text-amber-300" :
                              appointment.status === "InConsultation" ? "bg-sky-500/15 text-sky-300" :
                              appointment.status === "Completed" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                            }`}>
                              {appointment.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = getNextStatus(appointment.status);
                                if (next) updateAppointmentStatus(appointment.id, next);
                              }}
                              disabled={appointment.status === "Completed" || appointment.status === "Cancelled"}
                              className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:opacity-50"
                            >
                              {appointment.status === "Waiting" ? "Start consultation" : appointment.status === "InConsultation" ? "Complete" : "No action"}
                            </button>
                            {appointment.status !== "Completed" && appointment.status !== "Cancelled" && (
                              <button
                                type="button"
                                onClick={() => updateAppointmentStatus(appointment.id, "Cancelled")}
                                className="rounded-2xl border border-rose-600 bg-rose-600/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-600/20"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/85 p-8 shadow-2xl shadow-slate-950/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Patient roster</h2>
                  <p className="mt-2 text-slate-400">All patients associated with the logged-in doctor.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
                >
                  Add patient
                </button>
              </div>

              <div className="mt-8 grid gap-4">
                {isPatientsLoading ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-6 py-8 text-center text-slate-300">
                    Loading patients…
                  </div>
                ) : patients.length === 0 ? (
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 px-6 py-8 text-center text-slate-300">
                    No patients added yet. Use the button above to start your patient registry.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {patients.map((patient) => (
                      <article key={patient.id} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-white">{patient.name}</h3>
                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs uppercase tracking-[0.24em] text-emerald-300">
                            {patient.gender}
                          </span>
                        </div>
                        <p className="mt-3 text-slate-400">{patient.address}</p>
                        <div className="mt-4 grid gap-2 text-sm text-slate-300">
                          <p><span className="font-semibold text-slate-200">Age:</span> {patient.age}</p>
                          <p><span className="font-semibold text-slate-200">Phone:</span> {patient.phoneNo}</p>
                          <p><span className="font-semibold text-slate-200">Blood group:</span> {patient.bloodGroup}</p>
                        </div>
                        {activeChamber && (
                          <div className="mt-6 flex justify-end">
                            <button
                              type="button"
                              onClick={() => checkInPatient(patient.id)}
                              className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400"
                            >
                              Check-In to Chamber Queue
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="absolute inset-0" onClick={() => setFormOpen(false)}></div>
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Add new patient</h2>
                <p className="mt-1 text-sm text-slate-400">Securely register a new patient for the logged-in doctor.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-full bg-slate-800 px-3 py-2 text-slate-300 transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmitPatient}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Patient name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Age
                  <input
                    type="number"
                    min={0}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Gender
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Blood group
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {bloodGroupOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-300">
                  Phone
                  <input
                    value={phoneNo}
                    onChange={(e) => setPhoneNo(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                  Address
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={3}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
              </div>

              {formError && <p className="text-sm text-rose-400">{formError}</p>}
              {formSuccess && <p className="text-sm text-emerald-300">{formSuccess}</p>}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {formLoading ? "Saving…" : "Save patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
