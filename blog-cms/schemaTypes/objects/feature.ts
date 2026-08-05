import { defineField, defineType } from "sanity";
import { run } from "sanity/migrate";

export const featureType = defineType({
    name: "feature",
    title: "Feature",
    type: "object",
    fields: [
        defineField({
            name: "icon",
            title: "Icon",
            type: "icon.manager",
        }),
        defineField({
            name: "description",
            title: "description",
            type: "text",
            rows: 3,
            validation: (Rule) => Rule.required(),
        }),
    ],
});