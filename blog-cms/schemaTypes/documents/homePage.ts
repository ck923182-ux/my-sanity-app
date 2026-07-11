import { defineField, defineType } from "sanity";

export const homePageType = defineType({
    name: "homepgae",
    title: "Home Page",
    type: "document",
    fields: [
        defineField({
            name: "hero",
            title: "Hero Section",
            type: "hero"
        }),
        defineField({
            name: "features",
            title: "Features",
            type: "array",
            of: [
                {
                    type: "feature",
                },
            ],
        }),

    ],
});