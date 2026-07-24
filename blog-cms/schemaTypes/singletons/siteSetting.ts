import {defineField, defineType} from 'sanity'

export const siteSetting = defineType({
  name: 'sitesettings',
  title: 'Site Setting',
  type: 'document',
  fields: [
    defineField({
      name: 'header',
      title: 'Header',
      type: 'object',
      fields: [
        defineField({
          name: 'headerlogo',
          title: 'Header Logo',
          type: 'image',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'headertitle',
          title: 'Header Title',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'headertags',
          title: 'Header tag',
          type: 'array',
          of: [
            {
              type: 'string',
              title: 'text',
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Footer',
      type: 'object',
      fields: [
        defineField({
          name: 'footertitle',
          title: 'Footer Title',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'footercontent',
          title: 'Footer Content',
          type: 'text',
          rows: 3,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'explore',
          title: 'Explore',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'quicklink',
          title: 'Quick links',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'copyright',
          title: 'Copy Right',
          type: 'text',
          rows: 3,
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'header.headertitle',
      media: 'header.headerlogo',
    },
    prepare({title, media}) {
      return {
        title: title || 'Theme Setting',
        media,
      }
    },
  },
})
