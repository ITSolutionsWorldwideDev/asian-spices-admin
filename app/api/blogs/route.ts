// /app/api/blog/route.ts (GET)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";

import { getServerSession } from "next-auth";
// import { authOptions } from "@/core/auth";
// import { adminAuthOptions } from "@/core/auth/admin";
import { adminAuthOptions } from "@/core/auth";

/* ------------------------------------
   GET
------------------------------------ */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 20);
  const search = searchParams.get("search");
  const sort = searchParams.get("sort");

  const offset = (page - 1) * limit;

  try {
    /* -------- Single blog -------- */
    if (id) {
      const result = await pool.query(
        `SELECT
            b.blog_id,
            b.title,
            b.slug,
            b.excerpt,
            b.content,
            b.meta_title,
            b.meta_description,
            b.published_at,
            b.status,
            b.created_at,
            m.file_url AS featured_image_url
          FROM blogs b
          LEFT JOIN media m ON m.media_id = b.featured_image_id
          WHERE blog_id = $1
          ORDER BY b.created_at DESC`,
        [id],
      );

      if (!result.rows.length) {
        return NextResponse.json({ error: "Blog not found" }, { status: 404 });
      }

      return NextResponse.json(result.rows[0]);
    }

    /* -------- List categories -------- */
    const where: string[] = [];
    const values: any[] = [];

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      where.push(`LOWER(b.title) LIKE $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    let orderBy = "b.created_at DESC";
    if (sort === "nameAsc") orderBy = "b.title ASC";
    if (sort === "nameDesc") orderBy = "b.title DESC";
    if (sort === "dateAsc") orderBy = "b.created_at ASC";

    values.push(limit, offset);

    const dataQuery = `
      SELECT
            b.blog_id,
            b.title,
            b.slug,
            b.excerpt,
            b.content,
            b.meta_title,
            b.meta_description,
            b.published_at,
            b.status,
            b.created_at,
            m.file_url AS featured_image_url
      FROM blogs b
      LEFT JOIN media m ON m.media_id = b.featured_image_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS count
      FROM blogs
      ${whereClause}
    `;

    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, values),
      pool.query(countQuery, values.slice(0, where.length ? 1 : 0)),
    ]);

    return NextResponse.json({
      items: dataRes.rows,
      totalResults: countRes.rows[0].count,
      page,
      pageSize: limit,
      totalPages: Math.ceil(countRes.rows[0].count / limit),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 },
    );
  }
}

/* ------------------------------------
   POST (create blog)
------------------------------------ */
export async function POST(req: Request) {
  try {
    // const session = await getServerSession(authOptions);
    const session = await getServerSession(adminAuthOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const query = `
      INSERT INTO blogs
        (
          title,
          slug,
          excerpt,
          content,
          status,
          author_id,
          featured_image_id,
          meta_title,
          meta_description,
          published_at
        )
      VALUES (
        $1,$2,$3,$4,$5::text,$6,$7,$8,$9,
        CASE WHEN $5::text = 'published' THEN NOW() ELSE NULL::timestamp END
      )
      RETURNING blog_id
    `;

    const values = [
      body.title,
      body.slug,
      body.excerpt || null,
      body.content,
      body.status || "draft",
      session.user.id,
      body.featured_image_id || null,
      body.meta_title || null,
      body.meta_description || null,
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      blog_id: result.rows[0].blog_id,
    });
  } catch (error: any) {
    console.error("BLOG POST ERROR:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 },
    );
  }
}

/* ------------------------------------
   PUT (update blog)
------------------------------------ */
export async function PUT(req: Request) {
  try {
    /* ---------------- Params ---------------- */
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json();

    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    /* ---------------- Query ---------------- */
    const query = `
      UPDATE blogs SET
        title = $1,
        slug = $2,
        excerpt = $3,
        content = $4,
        status = $5::text,
        featured_image_id = $6,
        meta_title = $7,
        meta_description = $8,
        updated_at = NOW(),
        published_at = CASE
          WHEN $5::text = 'published' THEN NOW()
          ELSE NULL::timestamp
        END
      WHERE blog_id = $9
      RETURNING blog_id
    `;

    const values = [
      body.title,
      body.slug,
      body.excerpt || null,
      body.content,
      body.status || "draft",
      body.featured_image_id || null,
      body.meta_title || null,
      body.meta_description || null,
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      blog_id: result.rows[0].blog_id,
    });
  } catch (error: any) {
    console.error("BLOG PUT ERROR:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 },
    );
  }
}

/* ------------------------------------
   DELETE (remove blog)
------------------------------------ */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Blog ID required" }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `DELETE FROM blog WHERE blog_id = $1 RETURNING *`,
      [id],
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 },
    );
  }
}
