export const POSTS_QUERY = `
*[_type == "post"] | order(publishedAt desc)[$start...$end]{
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
  slug{
  current
  },
  excerpt,

  featuredImage,

 author->{
    name,
    slug{
    current
    }
  },

  category->{
  _id,
  title,
  slug{
    current
  }
},

  publishedAt,
  content
}
`;

// related post display in single blog post 
export const RELATED_POSTS_QUERY = `
*[_type =="post" && category._ref==$categoryId && slug.current != $slug ] | order(publishedAt desc)[0...3]
{
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

  publishedAt
}`;




// Display post by category this is category page 
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

// Display the author page , author by psot 
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

// Search post
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

// use to count the total post 
export const POSTS_COUNT_QUERY = `
count(*[_type=="post"])
`;




export const AUTHORS_QUERY = `
*[_type == "author"] | order(name asc){
  _id,
  name,
  slug{
    current
  },
  "postCount": count(
    *[
      _type == "post" &&
      author._ref == ^._id
    ]
  ),
  bio,
  hero{
   heading,
   subheading,
   heroButton,
  },
}
`;

export const CATEGORIES_QUERY = `
*[_type == "category"] | order(title asc){
  _id,
  title,

  slug{
    current
  },

  "postCount": count(
    *[
      _type == "post" &&
      category._ref == ^._id
    ]
  )
}
`;

export const SITEMAP_POSTS_QUERY = `
*[_type == "post"]{
  slug,
  _updatedAt
}
`;

// Homae page hero object fetch 

export const HOME_PAGE_QUERY = `
*[_type=="homePage"][0]{
  hero{
   heading,
   subheading,
   heroButton,
  },
  welcomeblog{
  eyebrow,
  heading,
  description,
  featertitle,
  heroButton[]{
  _key,
  text,
  link,
  variant
  },
  homefeatures[]{
  icon,
  description
  },
  },
  features[]{
   icon,
   description
  },
}
`

export const ABOUT_PAGE_QUERY = `
*[_type=="aboutpage"][0]{
  aboutUs{
  eyebrow,
  heading,
  content,
  whatitOffers,
  aboutoffers[]{
  icon,
  description,
  },
  builtWith,
  buildWithUs[]{
  icon,
  description
  },
  },
  features[]{
   icon,
   description
  },
}
`