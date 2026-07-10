interface Category {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  postCount: number;
}

interface CategorySidebarProps {
  categories: Category[];
}
import Link from "next/link";

export default function CategorySidebar({
  categories,
}: CategorySidebarProps) {
  return (
    <aside>
      <h2>Categories</h2>

      <ul>
        {categories.map((category) => (
          <li key={category._id}>
            <Link href={`/category/${category.slug.current}`}>
              {category.title} ({category.postCount})
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}