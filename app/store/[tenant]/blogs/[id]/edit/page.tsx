// apps/admin/app/(admin)/blogs/edit/[id]/page.tsx

import EditBlogClient from "@/components/blogs/EditBlogForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <EditBlogClient blogId={id} />;
}
