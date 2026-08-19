import {defineField, defineType} from 'sanity'

export const sectionStyle = defineType({
  name: 'sectionStyle',
  title: 'Section Style',
  type: 'object',
  fields: [
    defineField({
      name: 'bgColor',
      title: 'Background Color',
      type: 'color',
      description: 'Pick a background color for this section.',
      options: {
        disableAlpha: false,
      },
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'color',
      description: 'Pick a text color. Ensure it contrasts with the background.',
      options: {
        disableAlpha: false,
      },
    }),
    defineField({
      name: 'paddingY',
      title: 'Vertical Padding',
      type: 'string',
      description: 'Controls top/bottom spacing of this section.',
      initialValue: 'md',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Small (py-8)', value: 'sm'},
          {title: 'Medium (py-16)', value: 'md'},
          {title: 'Large (py-24)', value: 'lg'},
          {title: 'Extra Large (py-32)', value: 'xl'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Section Style'}
    },
  },
})
