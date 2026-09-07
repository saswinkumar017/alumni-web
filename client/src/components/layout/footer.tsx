import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="text-lg font-semibold text-zinc-900">
              JJCET Alumni
            </Link>
            <p className="mt-4 text-sm text-zinc-600">
              J.J. College of Engineering and Technology (JJCET) is a
              premier institution dedicated to excellence in education
              and research. Our mission is to empower students with
              knowledge and skills to thrive in a global society.
            </p>
            <div className="mt-4 flex gap-4">
              <span className="text-sm text-zinc-600">Facebook</span>
              <span className="text-sm text-zinc-600">Instagram</span>
              <span className="text-sm text-zinc-600">X-twitter</span>
              <span className="text-sm text-zinc-600">Linkedin</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-zinc-600 hover:text-zinc-900">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sm text-zinc-600 hover:text-zinc-900">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/directory" className="text-sm text-zinc-600 hover:text-zinc-900">
                  Alumni Directory
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-zinc-600 hover:text-zinc-900">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">
              Alumni Resources
            </h4>
            <ul className="mt-4 space-y-2">
              <li className="text-sm text-zinc-600">Job Board</li>
              <li className="text-sm text-zinc-600">Mentorship Program</li>
              <li className="text-sm text-zinc-600">Alumni Benefits</li>
              <li className="text-sm text-zinc-600">Volunteer Opportunities</li>
              <li className="text-sm text-zinc-600">Success Stories</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">
              Get In Touch
            </h4>
            <ul className="mt-4 space-y-2">
              <li className="text-sm text-zinc-600">
                J.J. College of Engineering and Technology, Ammapettai,
                Poolangulathupatti (PO), Tiruchirappalli, Tamil Nadu -
                620009.
              </li>
              <li>
                <a href="mailto:alumni@jjcet.ac.in" className="text-sm text-zinc-600 hover:text-zinc-900">
                  alumni@jjcet.ac.in
                </a>
              </li>
              <li>
                <a href="tel:+919150411776" className="text-sm text-zinc-600 hover:text-zinc-900">
                  +919150411776
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-zinc-200 pt-8 sm:flex-row">
          <p className="text-center text-sm text-zinc-600">
            © 2024. All Rights Reserved.
          </p>
          <p className="text-center text-sm text-zinc-600">
            Made with ♥ by{" "}
            <a href="https://internest.agency" className="hover:text-zinc-900">
              Internest Agency
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
