import Link from "next/link";
import { ABOUT_PAGE_QUERY } from "@/lib/queries";
import { AboutPage } from "../types/about";
import { client } from "@/lib/sanity";

export default async function AboutusPage() {
  const aboutuspage:AboutPage = await client.fetch(ABOUT_PAGE_QUERY);
  const { aboutUs } = aboutuspage;
  // console.log("about us" + aboutUs);
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{aboutUs.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
          {aboutUs.heading}
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          {aboutUs.content}
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">{aboutUs.hatitOffers}</h2>
          
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {aboutUs.aboutoffers.map((offer, index) => (
                <li key={index}>
                  {offer.icon} {offer.description}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">{aboutUs.builtWith}</h2>
             <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {aboutUs.buildWithUs.map((offer, index) => (
                <li key={index}>
                  {offer.icon} {offer.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
