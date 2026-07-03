export interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  };

  excerpt: string;

  featuredImage?: {
    asset: {
      url: string;
    };
  };

  author: {
    name: string;
  };

  category: {
    title: string;
  };

  publishedAt: string;

  featured: boolean;
}