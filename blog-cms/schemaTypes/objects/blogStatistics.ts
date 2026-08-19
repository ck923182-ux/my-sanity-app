import {defineArrayMember, defineField, defineType} from 'sanity'

export const blogStatistics = defineType({
  name: 'blogStats',
  title: 'Blog Statistics',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Optional heading displayed above the stats grid.',
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      description: 'Add as many stat cards as you need.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'statItem',
          title: 'Stat',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'icon.manager',
            }),
            defineField({
              name: 'blogmetrics',
              title: 'Metric Value',
              type: 'number',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'blogmetrics',
            },
            prepare({title, subtitle}) {
              return {
                title: title ?? 'Untitled stat',
                subtitle: subtitle != null ? String(subtitle) : '',
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'style',
      title: 'Section Style',
      type: 'sectionStyle',
      description: 'Customise background colour, text colour, and spacing.',
    }),
  ],
  preview: {
    select: {
      title: 'sectionTitle',
    },
    prepare({title}) {
      return {title: title ?? 'Blog Statistics'}
    },
  },
})
