import type { PageBuilderBlock } from "./pageBuilder";

export interface Welcomeblog {
  eyebrow: string;
  heading: string;
  description: string;
  heroButton: {
    _key: string;
    _type: string;
    text: string;
    link: string;
    variant: "primary" | "secondary";
  }[];
  featertitle: string;
  homefeatures: Feature[];
}

export interface Feature {
  _key: string;
  icon: string;
  description: string;
}

export interface HomePage {
  welcomeblog: Welcomeblog;
  pageBuilder: PageBuilderBlock[];
}
