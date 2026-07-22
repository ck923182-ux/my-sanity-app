import Link from "next/link";

export const portableTextComponents = {
  block: {
    h2: ({ children }: any) => (
      <h2 className="mt-10 mb-4 text-3xl font-bold">
        {children}
      </h2>
    ),

    h3: ({ children }: any) => (
      <h3 className="mt-8 mb-3 text-2xl font-semibold">
        {children}
      </h3>
    ),

    h4: ({ children }: any) => (
      <h4 className="mt-6 mb-2 text-xl font-semibold">
        {children}
      </h4>
    ),

    blockquote: ({ children }: any) => (
      <blockquote className="my-6 border-l-4 border-blue-500 pl-4 italic">
        {children}
      </blockquote>
    ),
  },

  marks: {
    link: ({ children, value }: any) => (
      <Link
        href={value.href}
        target="_blank"
        className="text-blue-600 underline"
      >
        {children}
      </Link>
    ),
  },
};