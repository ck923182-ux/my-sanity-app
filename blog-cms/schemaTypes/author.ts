import { defineField, defineType } from 'sanity'


export const authorType = defineType({
    name: "author",
    title: "Author",
    type: "document",
    fields: [
        defineField({
            name: "name",
            title: "name",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            options: {
                source: "name",
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "photo",
            title: "Photo",
            type: "image",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "bio",
            title: "Bio",
            type: "text",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "email",
            title: "Email",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "website",
            title: "Website",
            type: "url",
        })
    ]
});