import {defineField, defineType} from 'sanity'

export const blogStatistics = defineType({
  name: 'blogStats',
  title: 'Blog Statistics',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      title: 'icon',
      type: 'icon.manager',
    }),
    defineField({
      name: 'blogmetrics',
      title: 'blog Metrics',
      type: 'number',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
  ],
})
