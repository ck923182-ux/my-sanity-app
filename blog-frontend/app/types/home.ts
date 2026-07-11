
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

export interface Feature {
    icon: string;
    description: string;
}

export interface HomePage {
    hero: Hero;
    features: Feature[];
}