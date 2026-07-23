// import {StructureResolver} from 'sanity/structure'

// export const structure: StructureResolver = (S) =>
//   S.list()
//     .title('Content')
//     .items([
//       S.documentTypeListItem('category'),
//       S.documentTypeListItem('author'),
//       S.documentTypeListItem('post'),
//       S.documentTypeListItem('tag'),

//       S.divider(),

// S.listItem()
//   .title('Home Page')
//   .id('homePage')
//   .child(
//     S.document()
//       .schemaType('homePage')
//       .documentId('homePage')
//   ),
//       S.listItem()
//         .title('About Page')
//         .id('aboutpage')
//         .child(
//           S.document()
//             .schemaType('aboutpage')
//             .documentId('aboutpage')
//         ),
//     ])

import {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Blog Site')
    .items([
      //Theme Setting
      S.listItem()
        .title('Theme Setting')
        .id('themesettings')
        .child(S.document().schemaType('themesettings').documentId('themesettings')),
      S.divider(),
      // Website
      S.listItem()
        .title('🌐 Website')
        .child(
          S.list()
            .title('Website')
            .items([
              S.listItem()
                .title('🏠 Home Page')
                .child(S.document().schemaType('homePage').documentId('homePage')),

              S.listItem()
                .title('ℹ️ About Page')
                .child(S.document().schemaType('aboutpage').documentId('aboutpage')),
            ]),
        ),

      // Blog
      S.listItem()
        .title('📑 Blog')
        .child(
          S.list()
            .title('Blog')
            .items([
              S.documentTypeListItem('post').title('Posts'),
              S.documentTypeListItem('author').title('Authors'),
              S.documentTypeListItem('category').title('Categories'),
              S.documentTypeListItem('tag').title('Tags'),
            ]),
        ),
    ])
