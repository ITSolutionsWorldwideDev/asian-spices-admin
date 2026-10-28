// app/api/uploadthing/core.ts

import { createUploadthing, type FileRouter, UTFiles } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { adminAuthOptions } from "@/core/auth";
import crypto from "crypto";

const f = createUploadthing();

export const mediaRouter = {
  productImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 25,
    },
  })
    .middleware(async ({ req, files }) => {
      const isCallback = req.headers.get("x-uploadthing-hook");

      let userId = "system";
      if (!isCallback) {
        const session = await getServerSession(adminAuthOptions);

        if (!session?.user?.id) {
          throw new Error("Unauthorized");
        }

        userId = session.user.id;
      }

      const fileOverrides = (files ?? []).map((file) => {
        const rawExtension = file.name.includes(".")
          ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
          : ".jpg";
        const extension = rawExtension === ".jfif" ? ".jpg" : rawExtension;

        const cleanOriginalBase = file.name.replace(/\.[^.]+$/, "");
        const slugBase =
          cleanOriginalBase
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "image";

        const uniqueSuffix = crypto.randomUUID().slice(0, 8);
        const customId = `${slugBase}-${uniqueSuffix}${extension}`;

        return {
          ...file,
          name: `${cleanOriginalBase}${extension}`,
          customId,
        };
      });

      return {
        userId,
        [UTFiles]: fileOverrides,
      };
    })
    .onUploadComplete(async ({ file }) => {
      let fileUrl = file.ufsUrl ? file.ufsUrl : file.url;

      if (!fileUrl || !file.name) {
        throw new Error("Invalid file upload");
      }

      // Use UploadThing's native /f/<customId> CDN URL so the URL path itself
      // ends directly in .jpg/.png/.webp with no '?' query string.
      if (file.customId && fileUrl.includes(`/f/${file.key}`)) {
        fileUrl = fileUrl.replace(`/f/${file.key}`, `/f/${file.customId}`);
      }

      console.log("Uploaded Image URL:", fileUrl);
      // Keep this callback fast. The media row is saved in the client via /api/media/save.
      return {
        name: file.name,
        url: fileUrl,
      };
    }),
} satisfies FileRouter;

export type MediaRouter = typeof mediaRouter;
