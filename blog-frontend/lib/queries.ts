export const POSTS_QUERY = `
*[_type == "post"] | order(publishedAt desc){
  _id,
  title,
  slug,
  excerpt,
  featuredImage,
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

export const SINGLE_POST_QUERY = `
*[_type=="post" && slug.current==$slug][0]{
  _id,
  title,
  slug,
  excerpt,

  featuredImage,

  author->{
    name
  },

  category->{
    title
  },

  publishedAt,
  content
}
`;