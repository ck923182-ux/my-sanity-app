import {defineField, defineType} from 'sanity'

export const twoColoum = defineType({
  name: 'twocolumn',
  title: 'Two Column Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'headingComponent',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'block',
    }),
    defineField({
      name: 'twocolumnbutton',
      title: 'Button',
      type: 'button',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
    }),
  ],
})
