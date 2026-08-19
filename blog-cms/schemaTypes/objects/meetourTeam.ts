import {defineArrayMember, defineField, defineType} from 'sanity'

export const meeturTeam = defineType({
  name: 'meetourteam',
  title: 'Meet Our Team',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Heading displayed above the team grid.',
    }),
    defineField({
      name: 'sectionContent',
      title: 'Section Description',
      type: 'text',
      rows: 2,
      description: 'Optional sub-text below the heading.',
    }),
    defineField({
      name: 'members',
      title: 'Team Members',
      type: 'array',
      description: 'Add each team member card.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'teamMember',
          title: 'Team Member',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'designation',
              title: 'Designation / Role',
              type: 'string',
            }),
            defineField({
              name: 'image',
              title: 'Photo',
              type: 'image',
              options: {hotspot: true},
            }),
            defineField({
              name: 'bio',
              title: 'Short Bio',
              type: 'text',
              rows: 2,
            }),
            defineField({
              name: 'socialLinks',
              title: 'Social Links',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'socialLink',
                  title: 'Social Link',
                  fields: [
                    defineField({
                      name: 'platform',
                      title: 'Platform',
                      type: 'string',
                      options: {
                        list: [
                          {title: 'Twitter / X', value: 'twitter'},
                          {title: 'LinkedIn', value: 'linkedin'},
                          {title: 'GitHub', value: 'github'},
                          {title: 'Instagram', value: 'instagram'},
                          {title: 'Website', value: 'website'},
                        ],
                      },
                    }),
                    defineField({
                      name: 'url',
                      title: 'URL',
                      type: 'url',
                    }),
                  ],
                  preview: {
                    select: {title: 'platform', subtitle: 'url'},
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'designation',
              media: 'image',
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
      return {title: title ?? 'Meet Our Team'}
    },
  },
})
