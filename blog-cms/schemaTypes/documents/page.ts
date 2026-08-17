import {defineField, defineType} from 'sanity'
import {definePageBuilderField} from '../objects/pageBuilder'

export const pageType = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (Rule) => Rule.required(),
    }),

    definePageBuilderField(),
  ],
})