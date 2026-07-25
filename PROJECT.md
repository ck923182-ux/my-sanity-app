# Sanity Blog — Project Documentation

A headless blog platform built with **Sanity CMS** (blog-cms) and **Next.js 16 App Router** (blog-frontend). Content is managed in Sanity Studio and served to the frontend via GROQ queries over the Sanity client.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [CMS — blog-cms](#cms--blog-cms)
  - [Schema Types](#schema-types)
  - [Singletons](#singletons)
  - [Studio Structure](#studio-structure)
- [Frontend — blog-frontend](#frontend--blog-frontend)
  - [Pages](#pages)
  - [Components](#components)
  - [GROQ Queries](#groq-queries)
  - [TypeScript Types](#typescript-types)
  - [Utilities](#utilities)
- [Known Issues & Tech Debt](#known-issues--tech-debt)
- [Future Feature Ideas](#future-feature-ideas)

---

## Project Structure

```
my-sanity-app/
├── blog-cms/               # Sanity Studio (CMS)
│   ├── schemaTypes/
│   │   ├── documents/      # post, author, category, tag
│   │   ├── objects/        # hero, feature, button
│   │   └── singletons/     # homePage, aboutPage, siteSetting
│   ├── structure/          # Custom studio sidebar structure
│   ├── sanity.config.ts
│   └── sanity.cli.ts
│
└── blog-frontend/          # Next.js 16 App Router frontend
    ├── app/
    │   ├── blog/           # /blog and /blog/[slug]
    │   ├── author/         # /author and /author/[slug]
    │   ├── category/       # /category and /category/[slug]
    │   ├── about/          # /about
    │   ├── search/         # /search
    │   ├── components/     # Shared UI components
    │   ├── types/          # TypeScript interfaces
    │   ├── layout.tsx
    │   ├── page.tsx        # Home (/)
    │   └── sitemap.ts      # Auto-generated XML sitemap
    └── lib/
        ├── sanity.ts       # Sanity client instance
        ├── image.ts        # Image URL builder helper
        └── queries.ts      # All GROQ queries
```

---

## Tech Stack

| Layer      | Technology                                       |
|------------|--------------------------------------------------|
| CMS        | Sanity v3 (structureTool + visionTool)           |
| Frontend   | Next.js 16.2, React 19, TypeScript 5             |
| Styling    | Tailwind CSS v4                                  |
| Fonts      | Geist Sans + Geist Mono (next/font)              |
| Rich Text  | @portabletext/react v6                           |
| Images     | @sanity/image-url + next/image                   |
| Data       | @sanity/client v7 (GROQ, no CDN)                 |

---

## Getting Started

### 1. CMS (Sanity Studio)

```bash
cd blog-cms
npm install
npm run dev        # starts studio at http://localhost:3333
```

### 2. Frontend (Next.js)

```bash
cd blog-frontend
npm install
npm run dev        # starts app at http://localhost:3000
```

---

## Environment Variables

Create a `.env.local` in `blog-frontend/`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=lvbrpsfe
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
```

> The Sanity client (`lib/sanity.ts`) reads all three variables and will throw at runtime if any are missing.

---

## CMS — blog-cms

**Project ID:** `lvbrpsfe`  
**Dataset:** `production`

### Schema Types

#### Documents

| Schema     | Key Fields                                                                                                      |
|------------|-----------------------------------------------------------------------------------------------------------------|
| `post`     | title (10–80 chars), slug, excerpt (10–80 chars), content (Portable Text), featuredImage, category (ref), posttag (ref[]), author (ref), publishedAt (no future dates), featured (bool), showSeo, seoTitle, seoDescription |
| `author`   | name, slug, photo, bio, email, website (url), hero (hero object)                                                |
| `category` | title, slug, description, featured (bool)                                                                       |
| `tag`      | title, slug                                                                                                     |

**Post content** supports: `h2`, `h3`, `h4`, `blockquote`, bold, italic, underline, and inline links.

#### Objects (reusable embedded types)

| Schema    | Fields                                             |
|-----------|----------------------------------------------------|
| `hero`    | heading (required), subheading (required), content (text, optional), heroButton[] (button array) |
| `feature` | icon (emoji string e.g. 🚀), description (text, required) |
| `button`  | text, link (string), variant (`primary` \| `secondary`) |

#### Singletons

| Schema         | Key Fields                                                                                                     |
|----------------|----------------------------------------------------------------------------------------------------------------|
| `homePage`     | hero (hero obj), welcomeblog { eyebrow, heading, description, heroButton[], featertitle, homefeatures[] }      |
| `aboutpage`    | aboutUs { eyebrow, heading, content, whatitOffers, aboutoffers[] (feature), builtWith, buildWithUs[] (feature) } |
| `sitesettings` | header { headerlogo, headertitle, headertags[] }, footer { footertitle, footercontent, explore, quicklink, copyright } |

### Studio Structure

The sidebar is organised into three sections:

```
Blog Site
├── Site Setting          → sitesettings singleton
├── ─────────────
├── 🌐 Website
│   ├── 🏠 Home Page      → homePage singleton
│   └── ℹ️ About Page     → aboutpage singleton
└── 📑 Blog
    ├── Posts
    ├── Authors
    ├── Categories
    └── Tags
```

The `homePage` document is removed from the global "New document" shortcut to prevent accidental duplicates.

---

## Frontend — blog-frontend

### Pages

| Route              | File                               | Data Source                                   | Notes                                     |
|--------------------|------------------------------------|-----------------------------------------------|-------------------------------------------|
| `/`                | `app/page.tsx`                     | `HOME_PAGE_QUERY`                             | Renders Hero + welcomeblog section        |
| `/blog`            | `app/blog/page.tsx`                | `POSTS_QUERY`, `POSTS_COUNT_QUERY`, `CATEGORIES_QUERY` | Paginated (4 per page), with category sidebar |
| `/blog/[slug]`     | `app/blog/[slug]/page.tsx`         | `SINGLE_POST_QUERY`, `RELATED_POSTS_QUERY`    | Full post + up to 3 related posts         |
| `/category`        | `app/category/page.tsx`            | `CATEGORIES_QUERY`                            | Lists all categories with post counts     |
| `/category/[slug]` | `app/category/[slug]/page.tsx`     | `CATEGORY_POSTS_QUERY`                        | All posts under a category                |
| `/author`          | `app/author/page.tsx`              | `AUTHORS_QUERY`                               | Lists all authors with post counts        |
| `/author/[slug]`   | `app/author/[slug]/page.tsx`       | `AUTHOR_POSTS_QUERY`                          | All posts by an author                    |
| `/about`           | `app/about/page.tsx`               | `ABOUT_PAGE_QUERY`                            | About page content from Sanity            |
| `/search`          | `app/search/page.tsx`              | `SEARCH_POSTS_QUERY`                          | Wildcard search on title + excerpt        |
| `/sitemap.xml`     | `app/sitemap.ts`                   | `SITEMAP_POSTS_QUERY`                         | Auto-generated Next.js sitemap            |

### Components

| Component                       | Type   | Description                                                                 |
|---------------------------------|--------|-----------------------------------------------------------------------------|
| `Header`                        | Client | Sticky top nav bar, responsive hamburger menu. Links: Home, Blog, Categories, Authors, About, Search |
| `Footer`                        | Server | 3-column dark footer — brand description, Explore links, Quick links        |
| `Hero`                          | Server | Gradient hero section — fetches `HOME_PAGE_QUERY`, renders heading/subheading/buttons + stats panel |
| `PostCard`                      | Server | Reusable card — 16:9 featured image, category badge, tags, excerpt, author link |
| `CategorySidebar`               | Server | Sticky sidebar on `/blog` — category list with post counts + search CTA     |
| `PortableText/index.tsx`        | Server | Wraps `@portabletext/react` with custom components                          |
| `PortableText/components.tsx`   | —      | Custom renderers for h2, h3, h4, blockquote, and inline links               |

### GROQ Queries

All queries live in `lib/queries.ts`.

| Export                  | Purpose                                              | Parameters              |
|-------------------------|------------------------------------------------------|-------------------------|
| `POSTS_QUERY`           | Paginated post list (author, category, tags)         | `$start`, `$end`        |
| `SINGLE_POST_QUERY`     | Full post by slug, includes Portable Text content    | `$slug`                 |
| `RELATED_POSTS_QUERY`   | Up to 3 posts in the same category                  | `$categoryId`, `$slug`  |
| `CATEGORY_POSTS_QUERY`  | All posts filtered by category slug                 | `$slug`                 |
| `AUTHOR_POSTS_QUERY`    | All posts filtered by author slug                   | `$slug`                 |
| `SEARCH_POSTS_QUERY`    | Wildcard match on title and excerpt                 | `$search`               |
| `POSTS_COUNT_QUERY`     | Total post count (used for pagination)              | —                       |
| `AUTHORS_QUERY`         | All authors with computed post count                | —                       |
| `CATEGORIES_QUERY`      | All categories with computed post count             | —                       |
| `SITEMAP_POSTS_QUERY`   | Post slugs and `_updatedAt` for sitemap             | —                       |
| `HOME_PAGE_QUERY`       | homePage singleton — hero + welcomeblog + features  | —                       |
| `ABOUT_PAGE_QUERY`      | aboutpage singleton — aboutUs section               | —                       |

### TypeScript Types

Located in `app/types/`.

**`post.ts`** — `Post`
```ts
{
  _id, title, slug, excerpt, featuredImage,
  author: { name, slug },
  category: { title, slug },
  posttag[]: { title, slug },
  publishedAt, featured
}
```

**`home.ts`** — `Hero`, `Welcomeblog`, `Feature`, `HomePage`
```ts
HomePage {
  hero: { heading, subheading, content?, heroButton[] }
  welcomeblog: { eyebrow, heading, description, heroButton[], featertitle, homefeatures[] }
  features: Feature[]
}
```

**`about.ts`** — `AboutUs`, `Feature`, `AboutPage`
```ts
AboutPage {
  aboutUs: { eyebrow, heading, content, hatitOffers, aboutoffers[], builtWith, buildWithUs[] }
}
```

### Utilities

| File            | Export     | Purpose                                         |
|-----------------|------------|-------------------------------------------------|
| `lib/sanity.ts` | `client`   | Sanity client instance, reads from `.env.local` |
| `lib/image.ts`  | `urlFor()` | Builds Sanity CDN image URLs with transformations |

---

## Known Issues & Tech Debt

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | **Typo:** `hatitOffers` in `about.ts` type doesn't match `whatitOffers` in schema — renders `undefined` | `app/types/about.ts`, `app/about/page.tsx` | Rename to `whatitOffers` in the type and page |
| 2 | **Dead import:** `import { run } from 'sanity/migrate'` in `feature.ts` | `blog-cms/schemaTypes/objects/feature.ts` | Remove the import |
| 3 | **Hardcoded localhost** in `sitemap.ts` — breaks production sitemap | `app/sitemap.ts` | Replace with a `NEXT_PUBLIC_SITE_URL` env var |
| 4 | **`featuredImage: any`** in `Post` type — not type-safe | `app/types/post.ts` | Use `SanityImageSource` from `@sanity/image-url` |
| 5 | **No error/loading boundaries** — failed fetches crash pages silently | All pages | Add `error.tsx` and `loading.tsx` per route segment |
| 6 | **`aboutpage` and `sitesettings` not protected** from duplicate creation | `blog-cms/sanity.config.ts` | Filter both from `newDocumentOptions` like `homePage` |

---

## Future Feature Ideas

This section tracks planned additions and enhancements.

### Content & CMS

- [ ] **Comment system** — Add a `comment` document schema (author name, email, body, post reference, approved bool) and a public submission API route
- [ ] **Newsletter subscription** — `subscriber` document with email, subscribed date; integrate with Mailchimp / Resend
- [ ] **Reading time estimate** — Compute estimated read time from Portable Text content block count and surface on `PostCard` and single post
- [ ] **Post series / collections** — A `series` document that groups ordered posts (e.g. "Learn Next.js in 5 parts")
- [ ] **Gallery / media object** — Reusable `gallery` object for image arrays inside post content
- [ ] **Social links on Author** — Add `socialLinks[]` (platform + url) to the `author` schema
- [ ] **Featured posts section** — Query `featured: true` posts and render a highlighted section on the homepage

### Frontend & UX

- [ ] **Dark mode** — Toggle via Tailwind `dark:` classes and `localStorage`
- [ ] **Tag listing page** — `/tag` and `/tag/[slug]` pages, similar to categories
- [ ] **Breadcrumbs** — Display navigation trail on `/blog/[slug]`, `/category/[slug]`, `/author/[slug]`
- [ ] **Table of contents** — Auto-generate from `h2`/`h3` blocks in post content with anchor links
- [ ] **Reading progress bar** — Horizontal scroll indicator at the top of single post pages
- [ ] **Related posts carousel** — Replace the static 3-post grid with a horizontal scrollable carousel
- [ ] **Social share buttons** — Twitter/X, LinkedIn, copy-link on single post pages
- [ ] **Skeleton loading** — Add `loading.tsx` files per route to show skeleton cards while data loads
- [ ] **Infinite scroll / load more** — Replace or supplement pagination on `/blog` with a "Load more" button

### SEO & Performance

- [ ] **Dynamic metadata** — Add `generateMetadata()` to `/blog/[slug]`, `/author/[slug]`, `/category/[slug]` using Sanity data
- [ ] **Open Graph images** — Add `opengraph-image.tsx` per route segment for social preview cards
- [ ] **Production sitemap URL** — Replace hardcoded `localhost:3000` in `sitemap.ts` with `NEXT_PUBLIC_SITE_URL`
- [ ] **JSON-LD structured data** — Add `Article` schema markup to single post pages for Google rich results
- [ ] **ISR / on-demand revalidation** — Add `revalidate` or Sanity webhook-triggered `revalidatePath` for cache invalidation

### Developer Experience

- [ ] **Zod validation** — Validate GROQ query results at runtime with Zod schemas for type safety
- [ ] **Sanity TypeGen** — Use `sanity typegen generate` to auto-generate TypeScript types from schemas (replaces manual `app/types/`)
- [ ] **Storybook** — Isolated component development for `PostCard`, `CategorySidebar`, `Hero`
- [ ] **E2E tests** — Add Playwright tests for key user flows (home → blog → single post, search)
- [ ] **CI/CD pipeline** — GitHub Actions: lint + build check on PRs, deploy preview on Vercel
