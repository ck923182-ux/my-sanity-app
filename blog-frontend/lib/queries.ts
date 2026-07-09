export const POSTS_QUERY = `
*[_type == "post"] | order(publishedAt desc){
  _id,
  title,
  slug,
  excerpt,
  featuredImage,
  author->{
    name,
    slug{
    current
    }
  },
  category->{
    title,
    slug{
    current
    }
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
    name,
    slug{
    current
    }
  },

  category->{
  title,
  slug{
    current
  }
},

  publishedAt,
  content
}
`;

export const CATEGORY_POSTS_QUERY = `
*[
  _type=="post" &&
  category->slug.current==$slug
] | order(publishedAt desc){

  _id,
  title,
  slug,
  excerpt,

  featuredImage,

  author->{
    name,
     slug{
      current
    }
  },

  category->{
    title,
    slug{
      current
    }
  },

  publishedAt,
  featured
}
`;


export const AUTHOR_POSTS_QUERY = `
*[
  _type=="post" &&
  author->slug.current==$slug
] | order(publishedAt desc){

  _id,
  title,
  slug,
  excerpt,

  featuredImage,

  author->{
    name,
    slug{
      current
    }
  },

  category->{
    title,
    slug{
      current
    }
  },

  publishedAt,
  featured
}
`;

export const SEARCH_POSTS_QUERY = `
*[
  _type == "post" &&
  (
    title match $search ||
    excerpt match $search
  )
] | order(publishedAt desc){
  _id,
  title,
  slug,
  excerpt,

  featuredImage,

  author->{
    name,
    slug{
      current
    }
  },

  category->{
    title,
    slug{
      current
    }
  },

  publishedAt,
  featured
}
`;