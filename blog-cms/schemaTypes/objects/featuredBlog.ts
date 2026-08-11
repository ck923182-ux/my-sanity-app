import {defineField, defineType} from 'sanity'

export const featureBlog = defineType({
  name: 'featurblog',
  title: 'Feature Blog',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    }),
    defineField({
      name: 'featurtitle',
      title: 'Feature Title',
      type: 'string',
    }),
    defineField({
      name: 'Content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
        },
      ],
    }),
    defineField({
      name: 'featurebutton',
      title: 'Button',
      type: 'button',
    }),
    defineField({
      name: 'blog',
      title: 'Blog',
      type: 'reference',
      to: [{type: 'post'}],
      validation: (Rule) => Rule.required(),
    }),
  ],
})
