import {defineArrayMember, defineField, defineType} from 'sanity'

export const explorCategory = defineType({
  name: 'explorcategoey',
  title: 'Browse By Category',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Optional heading displayed above the categories grid.',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      description: 'Add as many categories as you need.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'category'}],
        }),
      ],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'style',
      title: 'Section Style',
      type: 'sectionStyle',
      description: 'Customise background colour, text colour, and spacing.',
    }),
  ],
  preview: {
    select: {title: 'sectionTitle'},
    prepare({title}) {
      return {title: title ?? 'Browse By Category'}
    },
  },
})
