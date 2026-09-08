import {defineField, defineType} from 'sanity'

/**
 * A single named color in the global palette.
 * Editors define these once in Site Settings → Theme Colors.
 */
export const themeColor = defineType({
  name: 'themeColor',
  title: 'Theme Color',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Color Name',
      type: 'string',
      description: 'e.g. "Brand Red", "Dark Background", "Light Grey"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Color Value',
      type: 'color',
      description: 'Pick the exact color. This will be used everywhere this token is applied.',
      options: {disableAlpha: false},
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'label',
      color: 'value.hex',
    },
    prepare({title, color}) {
      return {
        title: title ?? 'Unnamed color',
        subtitle: color ?? '',
      }
    },
  },
})
