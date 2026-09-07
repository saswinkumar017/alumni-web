export function GallerySection() {
  return (
    <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Gallery
        </h2>
        <p className="mt-4 max-w-3xl text-zinc-600">
          Explore our vibrant collection of photos capturing the essence
          of JJ College of Engineering and Technology. From memorable
          events and milestones to everyday moments of campus life, our
          gallery showcases the journey and achievements of our alumni.
          Relive the pride, joy, and camaraderie that define our
          community.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            "Alumni campus visit",
            "Alumni Association meet",
            "Aarambh celebrations",
            "Batch reunion",
            "Silver jubilee",
            "Alumni interaction",
            "Reunion moments",
            "Campus memories",
          ].map((caption) => (
            <figure
              key={caption}
              className="flex aspect-video items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-center"
            >
              <figcaption className="text-sm text-zinc-500">
                {caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
