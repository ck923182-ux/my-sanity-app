import {defineField, defineType} from 'sanity'
import {ColorTokenInput} from '../components/ColorTokenInput'

/**
 * sectionStyle — attached to every Page Builder block.
 *
 * bgColorToken / textColorToken store the *label* of a color defined in
 * Site Settings → Theme Colors (e.g. "Brand Red").
 * The custom ColorTokenInput renders those colors as a visual swatch picker.
 * Change a color's hex in Site Settings → every section using it updates.
 */
export const sectionStyle = defineType({
  name: 'sectionStyle',
  title: 'Section Style',
  type: 'object',
  fields: [
    defineField({
      name: 'bgColorToken',
      title: 'Background Color',
      type: 'string',
      description: 'Pick a background color from your global palette.',
      components: {
        input: ColorTokenInput,
      },
    }),
    defineField({
      name: 'textColorToken',
      title: 'Text Color',
      type: 'string',
      description: 'Pick a text color from your global palette.',
      components: {
        input: ColorTokenInput,
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
          {title: 'Small  (py-8)', value: 'sm'},
          {title: 'Medium (py-16)', value: 'md'},
          {title: 'Large  (py-24)', value: 'lg'},
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
