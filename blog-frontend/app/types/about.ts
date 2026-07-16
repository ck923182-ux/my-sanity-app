export interface AboutUs {
eyebrow:string;
heading:string;
content:string;
hatitOffers:string;
aboutoffers:Feature[];
builtWith:string;
buildWithUs:Feature[];
}
export interface Feature {
    _key:string;
    icon: string;
    description: string;
}

export interface AboutPage {
    aboutUs:AboutUs
}