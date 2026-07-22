import {defineField, defineType} from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(10).max(80),
    }),
    defineField({
      name: 'slug',
      title: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      validation: (Rule) => [
        Rule.required().error('Title is required.'),
        Rule.min(10).error('Minimum 10 characters.'),
        Rule.max(80).error('Maximum 80 characters.'),
        Rule.max(60).warning('For SEO, try to keep the title under 60 characters.'),
      ],
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
            {title: 'Heading 4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
              {title: 'Underline', value: 'underline'},
            ],
            annotations: [
              {
                name: 'link',
                title: 'Link',
                type: 'object',

                fields: [
                  {
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                  },
                ],
              },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'posttag',
      title: 'Post Tags',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'tag'}],
        },
      ],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) =>
        Rule.required().custom((publishedAt) => {
          if (!publishedAt) {
            return true // Let the required rule handle empty states
          }

          const publishDate = new Date(publishedAt)
          const now = new Date()

          if (publishDate > now) {
            return 'Published date cannot be in the future'
          }

          return true
        }),
    }),

    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'showSeo',
      title: 'SEO Enable',
      type: 'boolean',
      initialValue: true,
    }),

    defineField({
      name: 'seoTitle',
      title: 'seo Title',
      type: 'string',
      validation: (Rule) =>
        Rule.min(10).warning('For SEO, try to keep the title under 60 characters'),
      hidden: ({parent}) => !parent?.showSeo,
    }),
    defineField({
      name: 'seoDescription',
      title: 'seo Description',
      type: 'text',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'featuredImage',
    },

    prepare({title, author, media}) {
      return {
        title,
        subtitle: author ? `By ${author}` : 'No Author',
        media,
      }
    },
  },
})
