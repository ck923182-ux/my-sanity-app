import {defineField, defineType} from 'sanity'
import {definePageBuilderField} from '../objects/pageBuilder'

export const aboutPageType = defineType({
  name: 'aboutpage',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({
      name: 'aboutUs',
      title: 'Aboutus',
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
          name: 'content',
          title: 'Content',
          type: 'text',
          rows: 4,
        }),
        defineField({
          name: 'whatitOffers',
          title: 'What it offers',
          type: 'string',
        }),
        defineField({
          name: 'aboutoffers',
          title: 'About offers',
          type: 'array',
          of: [
            {
              type: 'feature',
            },
          ],
        }),
        defineField({
          name: 'builtWith',
          title: 'Build With',
          type: 'string',
        }),
        defineField({
          name: 'buildWithUs',
          title: 'Build With Us',
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
      title: 'aboutUs.eyebrow',
      // subtitle: "hero.subHeading",
    },
  },
})
