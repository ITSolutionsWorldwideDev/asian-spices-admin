// app/api/uploadthing/core.ts

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { adminAuthOptions } from "@/core/auth";
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
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.ufsUrl ? file.ufsUrl : file.url;

      if (!fileUrl || !file.name) {
        throw new Error("Invalid file upload");
      }

      // Keep this callback fast. The media row is saved in the client via /api/media/save.
      return {
        name: file.name,
        url: fileUrl,
      };
    }),
} satisfies FileRouter;

export type MediaRouter = typeof mediaRouter;
