import { defineField, defineType } from "sanity";

export const heroType = defineType({
    name: "hero",
    title: "Hero Section",
    type: "object",
    fields: [
        defineField({
            name: "heading",
            title: "Heading",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "subheading",
            title: "Sub Heading",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "content",
            title: "Content",
            type: "text",
            rows: 3
        }),
        defineField({
            name: "heroButton",
            title: "Button",
            type: "array",
            of: [
                {
                    type: "button",
                },

            ],
        }),
    ],

});