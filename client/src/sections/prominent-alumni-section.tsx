"use client";

import { useState } from "react";

const ALUMNI = [
  { name: "Dhibu Ninan Thomas", detail: "CSE Music Director, Chennai" },
  { name: "Thoufiq Ahamed", detail: "E & I Fire Safety Engineer Hamad Medical Corporation, Qatar" },
  { name: "Rajkumar", detail: "MECH Design and Programmer Intra-Mold Co, Ltd, Thailand" },
  { name: "Karthikeyan", detail: "CIVIL Managing Partner, GMS Consultancy, Chennai" },
  { name: "Santhosh", detail: "Deputy Collector (Trainee) Thiruvannamalai District" },
  { name: "Dr. Shimi Haridasan", detail: "Professor, Electrical Engineering, Punjab Engineering College - Punjab" },
  { name: "Chandru", detail: "CEO & Founder of TechnoRUCS" },
  { name: "Joseph Christopher Xavie", detail: "CEO – Nishanthini Academy and Nishanthini HR Services, Coimbatore" },
  { name: "Arja Anil Das", detail: "Activity Co-ordinator, Santa Health Care, Harrow City, London UK" },
  { name: "Nishantini IPS", detail: "DIG" },
  { name: "Sumaya Shakir", detail: "CIO - IT Innovation" },
  { name: "Dr. N. Siva Shanmugam", detail: "Professor, Mechanical Engg, NIT - Trichy" },
  { name: "S. Maheshwaran", detail: "AVP - Bank of America" },
  { name: "Karthik", detail: "Scientist - ISRO" },
  { name: "Anandha Murugan", detail: "Scientist - DRDO" },
  { name: "Arun Ramachandran", detail: "CEO & Founder, DEFI Technologies, Dubai, UAE" },
  { name: "Sangeeth Kumar", detail: "Co-Founder, Director, Corvid System LLP, Bangalore" },
  { name: "Santhosh Narayanan", detail: "CSE Music Director, Chennai" },
  { name: "Muthamil", detail: "MECH, Lyricist, Chennai" },
  { name: "Gopi Aravindh Raja", detail: "CSE Actor, Chennai" },
  { name: "Arun Raja Kamaraja", detail: "CSE Director, Chennai" },
  { name: "Siva Karthikeyan", detail: "CSE Lead Actor, Chennai" },
];

const PAGE_SIZE = 4;

export function ProminentAlumniSection() {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(ALUMNI.length / PAGE_SIZE);
  const visible = ALUMNI.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Our Prominent Alumni
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((a) => (
            <div
              key={a.name}
              className="rounded-xl border border-zinc-200 bg-white p-6"
            >
              <h3 className="font-semibold text-zinc-900">{a.name}</h3>
              <p className="mt-2 text-sm text-zinc-600">{a.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => (p - 1 + pages) % pages)}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Previous slide
          </button>
          <span className="text-sm text-zinc-500">
            {page + 1} / {pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => (p + 1) % pages)}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Next slide
          </button>
        </div>
      </div>
    </section>
  );
}
