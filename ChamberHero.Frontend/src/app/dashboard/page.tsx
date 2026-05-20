"use client";

import { useEffect, useState } from "react";
import type { Doctor } from "@/types/doctor";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5129";
const API_URL = `${API_BASE_URL}/doctors`;

export default function DashboardPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoctors() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_URL, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data: Doctor[] = await response.json();
        setDoctors(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load doctor profile data."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchDoctors();
  }, []);

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
                ChamberHero BD Profile Viewer
              </h1>
              <p className="mt-3 max-w-2xl text-slate-400 sm:text-lg">
                Fetching your live doctor profile from the .NET backend and rendering it
                as a premium healthcare dashboard card.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-800/90 px-6 py-4 text-right text-slate-300 shadow-inner shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                API endpoint
              </p>
              <p className="mt-2 font-mono text-sm text-emerald-200">{API_URL}</p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center text-slate-300 shadow-xl shadow-slate-950/20">
            <p className="text-xl font-medium text-white">Loading doctor profile…</p>
            <p className="mt-2 text-slate-500">Connecting to the backend service on localhost.</p>
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-rose-700/40 bg-rose-950/50 p-10 text-center text-rose-100 shadow-xl shadow-rose-950/20">
            <p className="text-xl font-semibold">Unable to load doctor profile</p>
            <p className="mt-3 text-slate-300">{error}</p>
          </section>
        ) : doctors.length === 0 ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 text-center text-slate-300 shadow-xl shadow-slate-950/20">
            <p className="text-xl font-medium text-white">No doctor profiles found.</p>
            <p className="mt-2 text-slate-500">Make sure your backend is returning the expected JSON payload.</p>
          </section>
        ) : (
          <div className="grid gap-8">
            {doctors.map((doctor) => (
              <article
                key={doctor.id}
                className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/85 shadow-2xl shadow-slate-950/20"
              >
                <div className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300 ring-1 ring-emerald-500/20">
                        Verified BMDC
                      </span>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-400 ring-1 ring-slate-700">
                        {doctor.systemRole}
                      </span>
                    </div>
                    <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                      {doctor.fullName}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                      <span className="rounded-2xl bg-slate-800/90 px-4 py-2">
                        {doctor.email}
                      </span>
                      <span className="rounded-2xl bg-slate-800/90 px-4 py-2">
                        {doctor.phoneNo}
                      </span>
                      <span className="rounded-2xl bg-slate-800/90 px-4 py-2 text-emerald-300">
                        BMDC #{doctor.bmdcRegistrationNo}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] bg-slate-950/90 p-6 text-slate-300 shadow-xl shadow-slate-950/30 ring-1 ring-slate-700/60 md:w-[380px]">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Subscription
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-white">{doctor.billingModel.replace("_", " ")}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Plan tier: <span className="font-semibold text-slate-100">{doctor.plan_tier}</span>
                    </p>
                    <div className="mt-6 rounded-3xl bg-slate-900/95 p-4 text-sm text-slate-300">
                      <p className="font-medium text-slate-100">Active status</p>
                      <p className="mt-2 text-slate-400">
                        {doctor.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 bg-slate-950/80 px-8 py-8 md:px-10">
                  <h3 className="text-xl font-semibold text-white">Qualifications</h3>
                  <p className="mt-4 max-w-4xl leading-8 text-slate-300">
                    {doctor.qualificationRaw}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
