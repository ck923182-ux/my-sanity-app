import {defineArrayMember, defineField, defineType} from 'sanity'

export const topAuthor = defineType({
  name: 'topauthor',
  title: 'Top Authors',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Optional heading displayed above the authors grid.',
    }),
    defineField({
      name: 'authors',
      title: 'Authors',
      type: 'array',
      description: 'Add as many authors as you need.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'author'}],
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
      return {title: title ?? 'Top Authors'}
    },
  },
})
