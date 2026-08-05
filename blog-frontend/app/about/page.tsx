import Link from "next/link";
import { ABOUT_PAGE_QUERY } from "@/lib/queries";
import { AboutPage } from "../types/about";
import { client } from "@/lib/sanity";
import NewsForm from "./newsform";
import { Icon } from "@iconify/react";

export default async function AboutusPage() {
  const aboutuspage: AboutPage = await client.fetch(ABOUT_PAGE_QUERY);

  // Safe fallback to prevent app from breaking if database is empty
  const aboutUs = aboutuspage?.aboutUs || {};

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          {aboutUs.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
          {aboutUs.heading}
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          {aboutUs.content}
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Left Column: What it Offers */}
          <div className="rounded-2xl bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {aboutUs.whatitOffers} {/* Fixed typo from hatitOffers */}
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {aboutUs?.aboutoffers?.map((offer, index) => {
                // Resolve the dynamic string path based on Sanity's output format
                const iconName =
                  typeof offer?.icon?.icon === "string"
                    ? offer.icon.icon
                    : offer?.icon?.icon?.name || offer?.icon?.name;

                return (
                  <li key={index} className="flex items-center gap-2">
                    {iconName && (
                      <Icon
                        icon={iconName}
                        className="w-5 h-5 text-blue-500 flex-shrink-0"
                      />
                    )}
                    <span>{offer.description}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Column: Built With */}
          <div className="rounded-2xl bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {aboutUs.builtWith}
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {aboutUs?.buildWithUs?.map((offer, index) => {
                // Resolve the dynamic string path based on Sanity's output format
                const iconName =
                  typeof offer?.icon?.icon === "string"
                    ? offer.icon.icon
                    : offer?.icon?.icon?.name || offer?.icon?.name;

                return (
                  <li key={index} className="flex items-center gap-2">
                    {iconName && (
                      <Icon
                        icon={iconName}
                        className="w-5 h-5 text-blue-500 flex-shrink-0"
                      />
                    )}
                    <span>{offer.description}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      <div className="py-12">
        <NewsForm />
      </div>
    </main>
  );
}
