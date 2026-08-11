import {defineArrayMember, defineField} from 'sanity'

export const pageBuilderSectionTypes = ['hero', 'feature', 'topauthor', 'twocolumn' , 'featurblog' ,'explorcategoey'] as const

export const pageBuilderSections = pageBuilderSectionTypes.map((type) =>
  defineArrayMember({
    type,
  }),
)

export function definePageBuilderField() {
  return defineField({
    name: 'pageBuilder',
    title: 'Page Builder',
    type: 'array',
    description: 'Add, remove, and reorder page sections.',
    of: pageBuilderSections,
  })
}
