import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Distinguished Alumni",
  description:
    "Celebrating JJCET alumni making a profound impact — Dr. Shimi Haridasan, National Best Teacher Award recipient.",
};

export default function DistinguishedAlumniPage() {
  return (
    <>
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-zinc-900">Distinguished Alumni</h1>
        </div>
      </section>
      <section className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-zinc-700">
          Dr. Shimi Haridasan, an alumni of JJCET from the EEE 1998-2002
          batch, received the National Best Teacher Award from the
          President of India. Additionally, she had the honor of
          interacting with the Prime Minister of India during the
          Teachers&rsquo; Day 2024 event. It&rsquo;s wonderful to see
          alumni from JJCET making such a profound impact.
        </p>
        <p className="text-zinc-700">
          Dr Shimi, working as Associate Professor in the Electrical
          Engineering Department at Punjab Engineering College (Deemed to
          be University), Chandigarh have been selected for the National
          Awards to Teachers 2024 for HEIs and Polytechnics. At PEC,
          Chandigarh she is in the role of Associate Dean Academics (NEP
          2020 and ERP) and took initiatives to implement multiple entry
          multiple exit option. She has also worked as Assistant
          Professor, Electrical Engineering Department, NITTTR,
          Chandigarh under the Ministry of Education, GoI.
        </p>
      </section>
    </>
  );
}
