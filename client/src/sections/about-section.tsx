export function AboutSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              About JJCET Alumni Association
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              The JJCET Alumni Association serves as a bridge between the
              institution and its graduates, fostering lifelong connections and
              professional growth. Our mission is to create a vibrant community
              where alumni can network, collaborate, and contribute to the
              development of current students.
            </p>
            <p className="mt-4 text-lg leading-8 text-zinc-600">
              Whether you&apos;re looking to reconnect with former classmates,
              explore job opportunities, or give back to your alma mater, our
              alumni network provides the platform to stay connected and make a
              difference.
            </p>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-200">
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
              <span className="text-lg">Campus Image</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
