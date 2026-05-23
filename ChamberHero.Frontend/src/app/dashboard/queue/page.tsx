"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { useChamber } from "@/context/ChamberContext";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Chamber } from "@/types/doctor";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5129";
const APPOINTMENTS_API_URL = `${API_BASE_URL}/appointments`;
const DOCTORS_API_URL = `${API_BASE_URL}/doctors`;

export default function QueuePage() {
  const router = useRouter();
  const { activeChamber, setActiveChamber } = useChamber();
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const activePatient = selected?.patient;
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingChambers, setIsFetchingChambers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPolling = true;

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => a.serialNo - b.serialNo),
    [appointments]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function initChambers() {
      setIsFetchingChambers(true);
      setError(null);

      try {
        const token = getToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(DOCTORS_API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Unable to load chambers: ${res.status}`);
        }

        const data = await res.json();
        const doctors = Array.isArray(data) ? data : [];
        const doctor = doctors.find((item) => Array.isArray(item?.chambers) && item.chambers.length > 0) ?? doctors[0] ?? null;
        const availableChambers = Array.isArray(doctor?.chambers) ? (doctor.chambers as Chamber[]) : [];

        setChambers(availableChambers);

        if (availableChambers.length > 0 && !activeChamber) {
          const savedChamberId = typeof window !== "undefined" ? localStorage.getItem("activeChamberId") : null;
          const persistedChamber = savedChamberId ? availableChambers.find((c) => c.id === savedChamberId) ?? null : null;
          const initialChamber = persistedChamber ?? availableChambers[0];

          setActiveChamber(initialChamber);
          if (typeof window !== "undefined") {
            localStorage.setItem("activeChamberId", initialChamber.id);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsFetchingChambers(false);
      }
    }

    initChambers();
  }, []);

  async function fetchLive(chamberId?: string | null, showLoading = false) {
    if (!chamberId) {
      setAppointments([]);
      if (showLoading) {
        setIsLoading(false);
      }
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${APPOINTMENTS_API_URL}/live?chamberId=${chamberId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to load queue: ${res.status}`);
      }

      const data: Appointment[] = await res.json();
      setAppointments(data);

      if (selected) {
        const matched = data.find((appointment) => appointment.id === selected.id) ?? null;
        setSelected(matched);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchLive(activeChamber?.id ?? null, appointments.length === 0);

    if (!activeChamber || !isPolling) return;

    const timer = setInterval(() => fetchLive(activeChamber?.id ?? null, false), 8000);
    return () => clearInterval(timer);
  }, [activeChamber]);

  async function patchStatus(appointmentId: string, status: AppointmentStatus) {
    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${APPOINTMENTS_API_URL}/${appointmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error(`Status update failed: ${res.status}`);
      }

      const updated: Appointment = await res.json();
      setAppointments((current) => current.map((appointment) => (appointment.id === updated.id ? updated : appointment)));
      if (selected?.id === updated.id) {
        setSelected(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function updateActiveChamber(chamberId: string) {
    const selectedChamber = chambers.find((chamber) => chamber.id === chamberId) ?? null;
    setActiveChamber(selectedChamber);
    setSelected(null);

    if (typeof window !== "undefined" && selectedChamber) {
      localStorage.setItem("activeChamberId", selectedChamber.id);
    }
  }

  function handleCardClick(appointment: Appointment) {
    if (appointment.status === "Completed" || appointment.status === "Cancelled") {
      return;
    }

    setSelected(appointment);
  }

  function startConsultation(appointment: Appointment) {
    patchStatus(appointment.id, "InConsultation");

    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPatientForPrescription", JSON.stringify(appointment.patient));
    }

    router.push(`/dashboard/prescriptions/new?patientId=${appointment.patient.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1800px] px-6 py-6">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.55)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Chamber Control Room</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Manage your active chamber queue</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Switch chambers and keep your live patient queue updated instantly. Your default chamber will load automatically when available.</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-[240px] rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-4 shadow-inner shadow-slate-950/20">
              <label htmlFor="chamber-select" className="mb-2 block text-sm font-medium text-slate-400">
                Active Chamber
              </label>
              <select
                id="chamber-select"
                value={activeChamber?.id ?? ""}
                onChange={(event) => updateActiveChamber(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              >
                <option value="" disabled>
                  {isFetchingChambers ? "Loading chambers..." : "Select a chamber"}
                </option>
                {chambers.map((chamber) => (
                  <option key={chamber.id} value={chamber.id}>
                    {chamber.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-3xl bg-slate-950/80 px-4 py-3 text-right text-sm text-slate-300 ring-1 ring-slate-800">
              <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Queued</span>
              <span className="mt-2 block text-3xl font-semibold text-white">{appointments.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-[calc(100vh-156px)] max-w-[1800px] overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-[0_40px_120px_rgba(15,23,42,0.75)]">
        <aside className="w-1/3 border-r border-slate-800 bg-slate-900/95 p-8 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Live queue</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">{activeChamber?.name ?? "No chamber selected"}</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">Review the active queue and select a patient to begin consultation.</p>
            </div>
            <div className="rounded-3xl bg-slate-950/80 px-4 py-3 text-right text-sm text-slate-300 ring-1 ring-slate-800">
              <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Queued</span>
              <span className="mt-2 block text-3xl font-semibold text-white">{appointments.length}</span>
            </div>
          </div>

          <div className="mt-10 flex-1 overflow-y-auto pr-2 pb-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className="h-32 animate-pulse rounded-[1.5rem] bg-slate-800/60" />
                ))}
              </div>
            ) : sortedAppointments.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-slate-400">
                <div>
                  <p className="text-lg font-semibold text-white">No patients checked in yet.</p>
                  <p className="mt-2 text-sm text-slate-500">Awaiting check-ins for this chamber.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAppointments.map((appointment) => {
                  const isActive = selected?.id === appointment.id;
                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => handleCardClick(appointment)}
                      disabled={appointment.status === "Completed" || appointment.status === "Cancelled"}
                      className={`group w-full rounded-[1.5rem] border p-5 text-left transition-shadow duration-200 ${
                        isActive ? "border-emerald-400 bg-slate-800 shadow-[0_20px_60px_rgba(16,185,129,0.2)]" : "border-slate-800 bg-slate-950/90 hover:border-slate-600 hover:bg-slate-900"
                      } ${appointment.status === "Completed" || appointment.status === "Cancelled" ? "cursor-not-allowed opacity-60 pointer-events-none" : "cursor-pointer"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-500">
                            <span>#{appointment.serialNo}</span>
                            <span>Patient</span>
                          </div>
                          <p className="mt-3 text-xl font-semibold text-white">{appointment.patient?.name}</p>
                          <p className="mt-1 text-sm text-slate-400">Age {appointment.patient?.age} • {appointment.patient?.gender}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                            appointment.status === "Waiting"
                              ? "bg-amber-200/15 text-amber-300"
                              : appointment.status === "InConsultation"
                              ? "bg-emerald-200/15 text-emerald-300 animate-pulse"
                              : "bg-slate-700/60 text-slate-300"
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main className="w-2/3 p-10">
          <div className="flex h-full flex-col justify-between">
            {error ? (
              <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">{error}</div>
            ) : null}

            {!activePatient ? (
              <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 text-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 shadow-[0_25px_80px_rgba(16,185,129,0.15)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 12h6M12 9v6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 7.5C4 5.567 5.567 4 7.5 4h9c1.933 0 3.5 1.567 3.5 3.5v9c0 1.933-1.567 3.5-3.5 3.5h-9C5.567 20 4 18.433 4 16.5v-9Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">Select a patient to begin</p>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">Choose a patient from the live queue to open the workspace and start the consultation journey.</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-10 shadow-[0_40px_120px_rgba(15,23,42,0.35)]">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Workspace</p>
                      <h2 className="mt-3 text-4xl font-semibold text-white">{activePatient?.name}</h2>
                      <p className="mt-2 text-base text-slate-400">Queue #{selected?.serialNo} • {selected?.status}</p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-900/80 px-6 py-4 text-right text-slate-300">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Chamber</p>
                      <p className="mt-2 text-xl font-semibold text-white">{activeChamber?.name ?? "Unassigned"}</p>
                    </div>
                  </div>

                  <div className="mt-10 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-6">
                      <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Age</p>
                      <p className="mt-4 text-3xl font-semibold text-white">{activePatient?.age}</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-6">
                      <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Gender</p>
                      <p className="mt-4 text-3xl font-semibold text-white">{activePatient?.gender}</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-6">
                      <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Phone</p>
                      <p className="mt-4 text-3xl font-semibold text-white">{activePatient?.phoneNo}</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-6">
                      <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Blood Group</p>
                      <p className="mt-4 text-3xl font-semibold text-white">{activePatient?.bloodGroup}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => startConsultation(selected)}
                    className="flex-1 rounded-[1.75rem] bg-emerald-500 px-8 py-6 text-lg font-semibold text-slate-950 shadow-[0_20px_60px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400"
                  >
                    Start Consultation & Create Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() => patchStatus(selected.id, "Completed")}
                    className="flex-1 rounded-[1.75rem] border border-emerald-500 bg-slate-900/90 px-8 py-6 text-lg font-semibold text-emerald-300 transition hover:border-emerald-400 hover:text-white"
                  >
                    Mark as Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => patchStatus(selected.id, "Cancelled")}
                    className="rounded-[1.75rem] border border-slate-700 bg-slate-900/90 px-8 py-6 text-lg font-semibold text-slate-300 transition hover:border-rose-500 hover:text-white"
                  >
                    Cancel Appointment
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
