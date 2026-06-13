// apps/admin/app/api/uploadthing/core.ts

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { adminAuthOptions } from "@/core/auth";
// import { adminAuthOptions } from "@/core/auth/admin";
import { pool } from "@/core/db";

const f = createUploadthing();

export const mediaRouter = {
  productImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 25,
    },
  })
    .middleware(async ({ req }) => {
      const isCallback = req.headers.get("x-uploadthing-hook");

      // ✅ Allow UploadThing callback
      if (isCallback) {
        return { userId: "system" };
      }

      const session = await getServerSession(adminAuthOptions);

      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      console.log("🔥 Upload complete triggered");

      console.log("file:", file);
      console.log("metadata:", metadata);

      const fileUrl = file.ufsUrl ? file.ufsUrl : file.url;

      // return { ok: true };

      // 🔒 VALIDATION
      if (!fileUrl || !file.name) {
        throw new Error("Invalid file upload");
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(file.type)) {
        throw new Error("Only JPG, PNG, WEBP allowed");
      }

      if (file.size > 8 * 1024 * 1024) {
        throw new Error("File too large (max 8MB)");
      }

      console.log("uploadthing file ====", file);
      console.log("uploadthing metadata.userId ====", metadata.userId);

      const cleanFileName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.\-_]/g, "-")
        .replace(/-+/g, "-");

      const result = await pool.query(
        `INSERT INTO media
          (file_name, file_url, file_type, size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING media_id`,
        [cleanFileName, fileUrl, file.type, file.size, metadata.userId],
      );

      console.log("✅ inserted media:", result.rows[0]);

      return {
        mediaId: result.rows[0].media_id,
        name: file.name,
        url: fileUrl,
      };

      // return { mediaId: result.rows[0].media_id };
    }),
} satisfies FileRouter;

export type MediaRouter = typeof mediaRouter;
