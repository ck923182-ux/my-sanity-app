import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link href="/">
          <h1 className="text-2xl font-bold text-blue-600">
            Sanity Blog
          </h1>
        </Link>

        {/* Navigation */}
        <nav>
          <ul className="flex items-center gap-8">
            <li>
              <Link
                href="/"
                className="font-medium text-gray-700 hover:text-blue-600"
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                href="/category"
                className="font-medium text-gray-700 hover:text-blue-600"
              >
                Categories
              </Link>
            </li>

            <li>
              <Link
                href="/author"
                className="font-medium text-gray-700 hover:text-blue-600"
              >
                Authors
              </Link>
            </li>

            <li>
              <Link
                href="/search"
                className="font-medium text-gray-700 hover:text-blue-600"
              >
                Search
              </Link>
            </li>
          </ul>
        </nav>

        {/* Button */}
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          Get Started
        </Link>

      </div>
    </header>
  );
}