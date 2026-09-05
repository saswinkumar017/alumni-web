import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              JJCET Alumni
            </h3>
            <p className="mt-4 text-sm text-zinc-600">
              J.J. College of Engineering and Technology
              <br />
              Ammapettai, Poolangulathupatti (PO)
              <br />
              Tiruchirappalli, Tamil Nadu - 620009
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Alumni Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">
              Contact
            </h4>
            <ul className="mt-4 space-y-2">
              <li className="text-sm text-zinc-600">
                📞 98428 11776
              </li>
              <li className="text-sm text-zinc-600">
                📧 alumni@jjcet.ac.in
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">
              Follow Us
            </h4>
            <div className="mt-4 flex gap-4">
              <a
                href="#"
                className="text-zinc-600 hover:text-zinc-900"
              >
                Facebook
              </a>
              <a
                href="#"
                className="text-zinc-600 hover:text-zinc-900"
              >
                LinkedIn
              </a>
              <a
                href="#"
                className="text-zinc-600 hover:text-zinc-900"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-200 pt-8">
          <p className="text-center text-sm text-zinc-600">
            © {new Date().getFullYear()} JJCET Alumni Association. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
