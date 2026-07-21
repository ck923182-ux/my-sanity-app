import {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('category'),
      S.documentTypeListItem('author'),
      S.documentTypeListItem('post'),
      S.documentTypeListItem('tag'),

      S.divider(),

      S.listItem()
        .title('Home Page')
        .id('homePage')
        .child(
          S.document()
            .schemaType('homePage')
            .documentId('homePage')
        ),
      S.listItem()
        .title('About Page')
        .id('aboutpage')
        .child(
          S.document()
            .schemaType('aboutpage')
            .documentId('aboutpage')
        ),
    ])