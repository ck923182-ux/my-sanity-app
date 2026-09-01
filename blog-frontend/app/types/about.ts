// export interface AboutUs {
// eyebrow:string;
// heading:string;
// content:string;
// hatitOffers:string;
// aboutoffers:Feature[];
// builtWith:string;
// buildWithUs:Feature[];
// }
// export interface Feature {
//     _key:string;
//     icon: string;
//     description: string;
// }

// export interface AboutPage {
//     aboutUs:AboutUs
// }
import type { PageBuilderBlock } from "./pageBuilder";

export interface AboutUs {
  eyebrow: string;
  heading: string;
  content: string;
  hatitOffers: string;
  whatitOffers: string;
  aboutoffers: Feature[];
  builtWith: string;
  buildWithUs: Feature[];
}

export interface Feature {
  _key: string;
  icon: any; // Changed from string to any to accept the icon object
  description: string;
}

export interface AboutPage {
  aboutUs: AboutUs;
    pageBuilder: PageBuilderBlock[];

}
