// apps/admin/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t p-4 mt-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-gray-600 text-sm">
          2026 © Asian Spices. All Rights Reserved
        </p>
        <p className="text-gray-600 text-sm">
          Designed &amp; Developed by{" "}
          <Link href="#" className="text-blue-600 hover:underline">
            IT SolutionsHub2010
          </Link>
        </p>
      </div>
    </footer>
  );
}