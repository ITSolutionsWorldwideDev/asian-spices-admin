// apps/admin/components/blogs/BlogCard.tsx

import Link from "next/link";
import { Edit, Trash2 } from "react-feather";

type Props = {
  blog: any;
  onDelete: (id: number) => void;
};

export default function BlogCard({ blog, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="relative">
        <img
          src={blog.featured_image_url || "/placeholder/blog.jpg"}
          alt={blog.title}
          className="h-48 w-full object-cover"
        />
        <span
          className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full ${
            blog.status === "published"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {blog.status}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2">
          <Link href={`/blogs/${blog.blog_id}`}>{blog.title}</Link>
        </h3>

        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {blog.excerpt}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{new Date(blog.created_at).toLocaleDateString()}</span>

          <div className="flex gap-2">
            <Link
              href={`/blogs/${blog.blog_id}/edit`}
              className="p-1 hover:text-blue-600"
            >
              <Edit size={14} />
            </Link>
            <button
              onClick={() => onDelete(blog.blog_id)}
              className="p-1 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
