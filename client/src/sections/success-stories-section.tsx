"use client";

import { useState } from "react";

interface Testimonial {
  id: number;
  name: string;
  department: string;
  batch: string;
  company: string;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Mr. Shankar Durairaj",
    department: "CSE",
    batch: "1999-2003",
    company: "Cognizant Technology Solution",
    quote:
      "There is lots of support given by my college. Our Placement cell supported us in many ways. They conducted Personality Development Program for all departments through which I benefited much.",
  },
  {
    id: 2,
    name: "Mr. Rooban Annamalai",
    department: "EEE",
    batch: "1994-1998",
    company: "Indian Navy (Retired Commander)",
    quote:
      "While studying in JJCET I set a National record for getting selected in all 3 services. These are achieved through my teachers' guidance.",
  },
  {
    id: 3,
    name: "Ms. R. Mahalakshmi",
    department: "CSE",
    batch: "2018-2022",
    company: "Multiple Offers",
    quote:
      "J.J.College of Engineering and Technology is a great institution. I have got 5 offers and it's to choose the best among those.",
  },
];

export function SuccessStoriesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const testimonial = testimonials[currentIndex];

  if (!testimonial) {
    return null;
  }

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Success Stories
        </h2>
        <div className="relative mt-12">
          <div className="mx-auto max-w-3xl text-center">
            <blockquote className="text-lg leading-8 text-zinc-600 sm:text-xl">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <div className="mt-6">
              <div className="font-semibold text-zinc-900">
                {testimonial.name}
              </div>
              <div className="text-sm text-zinc-600">
                {testimonial.department}, {testimonial.batch} •{" "}
                {testimonial.company}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={prev}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Previous
            </button>
            <button
              onClick={next}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Next
            </button>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full ${
                  index === currentIndex
                    ? "bg-zinc-900"
                    : "bg-zinc-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
