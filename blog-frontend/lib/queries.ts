export const POSTS_QUERY = `
*[_type=="post"] | order(publishedAt desc){
  _id,
  title,
  slug,
  excerpt,

  featuredImage{
    asset->{
      url
    }
  },

  author->{
    name
  },

  category->{
    title
  },

  publishedAt,
  featured
}
`;