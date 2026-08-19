import {defineField, defineType} from 'sanity'

export const heroType = defineType({
  name: 'heroSection',
  title: 'Hero Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subheading',
      title: 'Sub Heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'heroButton',
      title: 'Button',
      type: 'array',
      of: [
        {
          type: 'button',
        },
      ],
    }),
    defineField({
      name: 'Highlights',
      title: 'Highlights',
      type: 'string',
    }),
    defineField({
      name: 'Highlightscards',
      title: 'Highlights Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'highlightCard',
          title: 'Highlight Card',
          fields: [
            defineField({
              name: 'Highlightsnumber',
              title: 'Highlights Value',
              type: 'number',
            }),
            defineField({
              name: 'text',
              title: 'Text',
              type: 'string',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'style',
      title: 'Section Style',
      type: 'sectionStyle',
      group: undefined,
      description: 'Customise background colour, text colour, and spacing.',
    }),
  ],
})
