import { defineField, defineType } from 'sanity'

export const categoryType = defineType({
    name: 'category',
    title: 'Category',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: "Title",
            type: 'string',
        }),
    ]
});