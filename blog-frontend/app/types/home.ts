
export interface Hero {
    heading: string;
    subheading: string;
    content?: string;
    heroButton: {
        _key: string;
        _type: "button";
        text: string;
        link: string;
        variant: "primary" | "secondary";
    }[];
}

export interface Welcomeblog{
    eyebrow:string;
    heading:string;
    description:string;
    heroButton:{
        _key:string;
        _type:string;
        text:string;
        link:string;
        variant: "primary" | "secondary";
    }[];
    featertitle:string;
    homefeatures:Feature[];
}

export interface Feature {
    _key:string;
    icon: string;
    description: string;
}

export interface HomePage {
    hero: Hero;
    welcomeblog:Welcomeblog;
    features: Feature[];
}