import {defineField, defineType} from 'sanity'

export const formtype = defineType({
  name: 'form',
  title: 'Form',
  type: 'document',
  fields: [
    defineField({
      name: 'formName',
      title: 'Form Name',
      type: 'string',
    }),
    defineField({
      name: 'firstname',
      title: 'First Name',
      type: 'string',
    }),
    defineField({
      name: 'lastname',
      title: 'Last Name',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
    }),
  ],
  preview: {
    select: {
      title: 'formName',
      // subtitle: "hero.subHeading",
    },
  },
})
