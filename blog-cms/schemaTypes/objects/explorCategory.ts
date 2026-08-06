import {defineField, defineType} from 'sanity'

export const explorCategory = defineType({
  name: 'explorcategoey',
  title: 'Browser By Category',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'categorys',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (Rule) => Rule.required(),
    }),
  ],
})
