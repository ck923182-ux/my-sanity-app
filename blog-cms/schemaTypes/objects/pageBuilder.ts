import {defineArrayMember, defineField} from 'sanity'

export const pageBuilderSectionTypes = [
  'feature',
  'twocolumn',
  'featurblog',
  'blogStats',
  'heroSection',
  'timeline',
  'topauthor',
  'explorcategoey',
  'meetourteam',
] as const

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