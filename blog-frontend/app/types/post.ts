export interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  };

  excerpt: string;

    featuredImage: any;


  author: {
    name: string;
    slug:{
      current:string;
    }
  };

  category: {
  title: string;
  slug: {
    current: string;
  };
};

  publishedAt: string;

  featured: boolean;
}