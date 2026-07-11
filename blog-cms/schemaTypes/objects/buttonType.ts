import { defineField, defineType } from "sanity";

export const buttonType = defineType({
    name: "button",
    title: "Button",
    type: "object",
    fields: [
        defineField({
            name: "text",
            title: "Button Title",
            type: "string",
        }),
        defineField({
            name: "link",
            title: "Button Link",
            type: "string",

        }),
        defineField({
            name: "variant",
            title: "Button variant",
            type: "string",
            options: {
                list: [
                    { title: "Primary", value: "primary" },
                    { title: "Secondary", value: "secondary" },
                ],
            },
            initialValue: "primary",
        }),
    ]


})