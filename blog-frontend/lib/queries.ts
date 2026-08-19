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
  posttag[]->{
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

  content[]{
    ...,
    _key,
    _type,
    markDefs[]{
      ...,
      _key
    },
    children[]{
      ...,
      _key
    }
  }
}
`;

// related post display in single blog post 
export const RELATED_POSTS_QUERY = `
*[_type == "post" && category._ref == $categoryId && slug.current != $slug] | order(publishedAt desc)[0...3]{
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
  _id,
  title,
  slug{
    current
  }
},
  posttag[]->{
    title,
    slug{
      current
    }
  },
  publishedAt,
  featured
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

// Home page singleton fetch

export const HOME_PAGE_QUERY = `
*[_type=="homePage"][0]{
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
  pageBuilder[]{
    _key,
    _type,

    _type == "heroSection" => {
      heading,
      subheading,
      content,
      heroButton[]{_key, text, link, variant},
      Highlights,
      Highlightscards[]{Highlightsnumber, text}
    },

    _type == "feature" => {
      icon,
      description
    },

    _type == "twocolumn" => {
      heading{heading, headingTag},
      Content[]{..., _key},
      twocolumnbutton{text, link, variant},
      image
    },

    _type == "featurblog" => {
      eyebrow,
      featurtitle,
      Content[]{..., _key},
      featurebutton{text, link, variant},
      blog->{
        _id,
        title,
        slug{current},
        excerpt,
        featuredImage,
        publishedAt,
        author->{name, slug{current}},
        category->{title, slug{current}}
      }
    },

    _type == "blogStats" => {
      sectionTitle,
      stats[]{
        _key,
        icon,
        blogmetrics,
        title
      }
    },

    _type == "timeline" => {
      sectionTitle,
      items[]{
        _key,
        year,
        heading,
        icon,
        image,
        points[]{_key, text}
      }
    },

    _type == "topauthor" => {
      sectionTitle,
      authors[]->{_id, name, slug{current}, bio}
    },

    _type == "explorcategoey" => {
      sectionTitle,
      categories[]->{
        _id,
        title,
        slug{current},
        "postCount": count(*[_type == "post" && category._ref == ^._id])
      }
    },

    _type == "meetourteam" => {
      sectionTitle,
      sectionContent,
      members[]{
        _key,
        name,
        designation,
        image,
        bio,
        socialLinks[]{_key, platform, url}
      }
    }
  }
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

// ─── Page Builder ─────────────────────────────────────────────────────────────

export const PAGE_QUERY = `
*[_type == "page" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  pageBuilder[]{
    _key,
    _type,

    // heroSection
    _type == "heroSection" => {
      heading,
      subheading,
      content,
      heroButton[]{_key, text, link, variant},
      Highlights,
      Highlightscards[]{Highlightsnumber, text}
    },

    // feature
    _type == "feature" => {
      icon,
      description
    },

    // twocolumn
    _type == "twocolumn" => {
      heading{heading, headingTag},
      Content[]{..., _key},
      twocolumnbutton{text, link, variant},
      image
    },

    // featurblog
    _type == "featurblog" => {
      eyebrow,
      featurtitle,
      Content[]{..., _key},
      featurebutton{text, link, variant},
      blog->{
        _id,
        title,
        slug{current},
        excerpt,
        featuredImage,
        publishedAt,
        author->{name, slug{current}},
        category->{title, slug{current}}
      }
    },

    // blogStats
    _type == "blogStats" => {
      sectionTitle,
      stats[]{
        _key,
        icon,
        blogmetrics,
        title
      }
    },

    // timeline
    _type == "timeline" => {
      sectionTitle,
      items[]{
        _key,
        year,
        heading,
        icon,
        image,
        points[]{_key, text}
      }
    },

    // topauthor
    _type == "topauthor" => {
      sectionTitle,
      authors[]->{_id, name, slug{current}, bio}
    },

    // explorcategoey
    _type == "explorcategoey" => {
      sectionTitle,
      categories[]->{
        _id,
        title,
        slug{current},
        "postCount": count(*[_type == "post" && category._ref == ^._id])
      }
    },

    // meetourteam
    _type == "meetourteam" => {
      sectionTitle,
      sectionContent,
      members[]{
        _key,
        name,
        designation,
        image,
        bio,
        socialLinks[]{_key, platform, url}
      }
    }
  }
}
`;

export const ALL_PAGES_QUERY = `
*[_type == "page"]{ slug }
`;
