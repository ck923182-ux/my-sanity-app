import {defineField, defineType} from 'sanity'
import {definePageBuilderField} from '../objects/pageBuilder'

export const homePageType = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'hero',
    }),
    defineField({
      name: 'welcomeblog',
      title: 'Welcome Blog',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
        }),
        defineField({
          name: 'heading',
          title: 'Heading',
          type: 'string',
        }),
        defineField({
          name: 'description',
          title: 'Description',
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
          name: 'featertitle',
          title: 'Feature Title',
          type: 'string',
        }),
        defineField({
          name: 'homefeatures',
          title: 'Home Features',
          type: 'array',
          of: [
            {
              type: 'feature',
            },
          ],
        }),
      ],
    }),
    definePageBuilderField(),
  ],
  preview: {
    select: {
      title: 'hero.heading',
      // subtitle: "hero.subHeading",
    },
  },
})
