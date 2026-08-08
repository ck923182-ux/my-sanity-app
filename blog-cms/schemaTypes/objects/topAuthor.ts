import {defineField, defineType} from 'sanity'

export const topAuthor = defineType({
  name: 'topauthor',
  title: 'Top Author',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [
        {
          type: 'author',
        },
      ],
    }),
  ],
})
