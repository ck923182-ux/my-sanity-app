// ─── Shared primitives ────────────────────────────────────────────────────────

export interface SanityButton {
  _key?: string;
  text: string;
  link: string;
  variant: "primary" | "secondary";
}

export interface SanityImage {
  _type: "image";
  asset: { _ref: string; _type: "reference" };
  alt?: string;
}

export interface HeadingComponent {
  heading: string;
  headingTag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export interface SanityIcon {
  icon?: string | { name?: string };
  name?: string;
}

// ─── Section style ────────────────────────────────────────────────────────────

export interface SanityColor {
  hex: string;
  alpha?: number;
  rgb?: { r: number; g: number; b: number; a: number };
  hsl?: { h: number; s: number; l: number; a: number };
}

export type PaddingY = "none" | "sm" | "md" | "lg" | "xl";

export interface SectionStyle {
  bgColor?: SanityColor;
  textColor?: SanityColor;
  paddingY?: PaddingY;
}

// ─── Block types ─────────────────────────────────────────────────────────────

export interface HeroSectionBlock {
  _type: "heroSection";
  _key: string;
  style?: SectionStyle;
  heading: string;
  subheading: string;
  content?: string;
  heroButton?: SanityButton[];
  Highlights?: string;
  Highlightscards?: { Highlightsnumber: number; text: string }[];
}

export interface FeatureBlock {
  _type: "feature";
  _key: string;
  style?: SectionStyle;
  icon?: SanityIcon;
  description: string;
}

export interface TwoColumnBlock {
  _type: "twocolumn";
  _key: string;
  style?: SectionStyle;
  heading?: HeadingComponent;
  Content?: unknown[];
  twocolumnbutton?: SanityButton;
  image?: SanityImage;
}

export interface FeaturedBlogBlock {
  _type: "featurblog";
  _key: string;
  style?: SectionStyle;
  eyebrow?: string;
  featurtitle?: string;
  Content?: unknown[];
  featurebutton?: SanityButton;
  blog: {
    _id: string;
    title: string;
    slug: { current: string };
    excerpt?: string;
    featuredImage?: SanityImage;
    publishedAt?: string;
    author?: { name: string; slug: { current: string } };
    category?: { title: string; slug: { current: string } };
  };
}

export interface StatItem {
  _key: string;
  icon?: SanityIcon;
  blogmetrics: number;
  title: string;
}

export interface BlogStatsBlock {
  _type: "blogStats";
  _key: string;
  style?: SectionStyle;
  sectionTitle?: string;
  stats: StatItem[];
}

export interface TimelinePoint {
  _key: string;
  text: string;
}

export interface TimelineItem {
  _key: string;
  year: string;
  heading?: string;
  icon?: SanityIcon;
  image?: SanityImage;
  points?: TimelinePoint[];
}

export interface TimelineBlock {
  _type: "timeline";
  _key: string;
  style?: SectionStyle;
  sectionTitle?: string;
  items: TimelineItem[];
}

export interface TopAuthorBlock {
  _type: "topauthor";
  _key: string;
  style?: SectionStyle;
  sectionTitle?: string;
  authors?: {
    _key: string;
    _id: string;
    name: string;
    slug: { current: string };
    bio?: string;
  }[];
}

export interface ExploreCategoryBlock {
  _type: "explorcategoey";
  _key: string;
  style?: SectionStyle;
  sectionTitle?: string;
  categories?: {
    _id: string;
    title: string;
    slug: { current: string };
    postCount?: number;
  }[];
}

export interface SocialLink {
  _key: string;
  platform?: "twitter" | "linkedin" | "github" | "instagram" | "website";
  url?: string;
}

export interface TeamMember {
  _key: string;
  name: string;
  designation?: string;
  image?: SanityImage;
  bio?: string;
  socialLinks?: SocialLink[];
}

export interface MeetOurTeamBlock {
  _type: "meetourteam";
  _key: string;
  style?: SectionStyle;
  sectionTitle?: string;
  sectionContent?: string;
  members?: TeamMember[];
}

// ─── Union ────────────────────────────────────────────────────────────────────

export type PageBuilderBlock =
  | HeroSectionBlock
  | FeatureBlock
  | TwoColumnBlock
  | FeaturedBlogBlock
  | BlogStatsBlock
  | TimelineBlock
  | TopAuthorBlock
  | ExploreCategoryBlock
  | MeetOurTeamBlock;

// ─── Page document ────────────────────────────────────────────────────────────

export interface PageDocument {
  _id: string;
  title: string;
  slug: { current: string };
  pageBuilder: PageBuilderBlock[];
}
