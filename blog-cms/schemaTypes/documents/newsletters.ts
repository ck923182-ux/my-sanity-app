import {defineField, defineType} from 'sanity'

export const newsypesform = defineType({
  name: 'newsletter',
  title: 'News Letters',
  type: 'document',
  fields: [
    defineField({
      name: 'newslettername',
      title: 'News Letter name',
      type: 'string',
    }),
    defineField({
      name: 'fullname',
      title: 'Full Name',
      type: 'string',
    }),
    defineField({
      name: 'emailaddress',
      title: 'Email Address',
      type: 'string',
    }),
    defineField({
      name: 'consent',
      title: 'Consent',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'subscribedAt',
      title: 'subscribedAt',
      type: 'date',
    }),
  ],
})
