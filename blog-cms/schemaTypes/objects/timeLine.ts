import {defineArrayMember, defineField, defineType} from 'sanity'

export const timeLine = defineType({
  name: 'timeline',
  title: 'Timeline',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Optional heading displayed above the timeline.',
    }),
    defineField({
      name: 'items',
      title: 'Timeline Items',
      type: 'array',
      description: 'Add each milestone in chronological order.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'timelineItem',
          title: 'Timeline Item',
          fields: [
            defineField({
              name: 'year',
              title: 'Year / Date Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'heading',
              title: 'Heading',
              type: 'string',
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'icon.manager',
            }),
            defineField({
              name: 'image',
              title: 'Image (optional)',
              type: 'image',
              options: {hotspot: true},
            }),
            defineField({
              name: 'points',
              title: 'Bullet Points',
              type: 'array',
              description: 'Add one or more bullet points for this milestone.',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'bulletPoint',
                  title: 'Bullet Point',
                  fields: [
                    defineField({
                      name: 'text',
                      title: 'Text',
                      type: 'text',
                      rows: 2,
                      validation: (Rule) => Rule.required(),
                    }),
                  ],
                  preview: {
                    select: {title: 'text'},
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: 'year',
              subtitle: 'heading',
            },
            prepare({title, subtitle}) {
              return {
                title: title ?? 'Untitled',
                subtitle: subtitle ?? '',
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
    select: {title: 'sectionTitle'},
    prepare({title}) {
      return {title: title ?? 'Timeline'}
    },
  },
})
