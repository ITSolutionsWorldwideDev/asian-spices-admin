// app/api/store-settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/core/db";
import { getCurrentStoreAPI } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  try {
    const store = await getCurrentStoreAPI(req);

    const { rows } = await pool.query(
      `
      SELECT 
        s.name as store_name,

        ss.store_email,
        ss.store_phone,
        ss.currency_id,
        ss.currency_code,
        ss.currency_symbol,
        ss.country_code,
        ss.timezone,
        ss.language,
        ss.date_format,
        ss.time_format,

        sb.logo_url,
        sb.favicon_url,
        sb.banner_url,
        sb.primary_color,
        sb.secondary_color,
        sb.theme_mode,

        addr.address_line1,
        addr.address_line2,
        addr.city,
        addr.state,
        addr.postal_code,
        addr.country,
        addr.latitude,
        addr.longitude,

        tax.tax_name,
        tax.tax_rate,
        tax.tax_inclusive,
        tax.tax_registration_number,

        pay.stripe_enabled,
        pay.stripe_account_id,
        pay.razorpay_enabled,
        pay.cod_enabled,

        ship.free_shipping_threshold,
        ship.flat_shipping_rate,
        ship.international_shipping,

        seo.meta_title,
        seo.meta_description,
        seo.meta_keywords,
        seo.facebook_pixel_id,
        seo.google_analytics_id,

        sub.plan_name,
        sub.status as subscription_status,
        sub.renewal_date

      FROM stores s
      LEFT JOIN store_settings ss ON ss.store_id = s.id
      LEFT JOIN store_branding sb ON sb.store_id = s.id
      LEFT JOIN store_addresses addr ON addr.store_id = s.id
      LEFT JOIN store_tax_settings tax ON tax.store_id = s.id
      LEFT JOIN store_payment_settings pay ON pay.store_id = s.id
      LEFT JOIN store_shipping_settings ship ON ship.store_id = s.id
      LEFT JOIN store_seo_settings seo ON seo.store_id = s.id
      LEFT JOIN store_subscription sub ON sub.store_id = s.id

      WHERE s.id = $1
      `,
      [store.id],
    );

    const { rows: workingHours } = await pool.query(
      `
      SELECT day_of_week, open_time, close_time, is_closed
      FROM store_working_hours
      WHERE store_id = $1
      ORDER BY day_of_week
      `,
      [store.id],
    );

    const data = rows[0] || {};
    data.working_hours = workingHours;

    return NextResponse.json(data);

    // return NextResponse.json(rows[0] || {});
  } catch (error) {
    console.error("GET STORE SETTINGS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch store settings" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const client = await pool.connect();

  try {
    const store = await getCurrentStoreAPI(req);
    const body = await req.json();

    const val = (v: any) => (v === "" || v === undefined ? null : v);
    const num = (v: any) => (v === "" || v === undefined ? 0 : Number(v));

    await client.query("BEGIN");

    /* =========================
       STORES
    ========================== */
    await client.query(
      `
      UPDATE stores
      SET name = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [val(body.store_name), store.id],
    );

    /* =========================
       STORE SETTINGS
    ========================== */
    await client.query(
      `
      INSERT INTO store_settings
      (store_id, store_email, store_phone, currency_id, currency_code, currency_symbol,
       country_code, timezone, language, date_format, time_format)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (store_id)
      DO UPDATE SET
        store_email = EXCLUDED.store_email,
        store_phone = EXCLUDED.store_phone,
        currency_id = EXCLUDED.currency_id,
        currency_code = EXCLUDED.currency_code,
        currency_symbol = EXCLUDED.currency_symbol,
        country_code = EXCLUDED.country_code,
        timezone = EXCLUDED.timezone,
        language = EXCLUDED.language,
        date_format = EXCLUDED.date_format,
        time_format = EXCLUDED.time_format,
        updated_at = NOW()
      `,
      [
        store.id,
        val(body.store_email),
        val(body.store_phone),
        val(body.currency_id),
        val(body.currency_code),
        val(body.currency_symbol),
        val(body.country_code),
        val(body.timezone),
        val(body.language),
        val(body.date_format),
        val(body.time_format),
      ],
    );

    /* =========================
       BRANDING
    ========================== */
    await client.query(
      `
      INSERT INTO store_branding
      (store_id, logo_url, favicon_url, banner_url,
       primary_color, secondary_color, theme_mode)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (store_id)
      DO UPDATE SET
        logo_url = EXCLUDED.logo_url,
        favicon_url = EXCLUDED.favicon_url,
        banner_url = EXCLUDED.banner_url,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        theme_mode = EXCLUDED.theme_mode,
        updated_at = NOW()
      `,
      [
        store.id,
        val(body.logo_url),
        val(body.favicon_url),
        val(body.banner_url),
        val(body.primary_color),
        val(body.secondary_color),
        val(body.theme_mode),
      ],
    );

    /* =========================
       ADDRESS
    ========================== */
    await client.query(
      `
      DELETE FROM store_addresses WHERE store_id = $1
      `,
      [store.id],
    );

    await client.query(
      `
      INSERT INTO store_addresses
      (store_id, address_line1, address_line2, city, state,
       postal_code, country, latitude, longitude)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        store.id,
        val(body.address_line1),
        val(body.address_line2),
        val(body.city),
        val(body.state),
        val(body.postal_code),
        val(body.country),
        num(body.latitude),
        num(body.longitude),
      ],
    );

    /* =========================
       TAX
    ========================== */
    await client.query(
      `
      INSERT INTO store_tax_settings
      (store_id, tax_name, tax_rate, tax_inclusive, tax_registration_number)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (store_id)
      DO UPDATE SET
        tax_name = EXCLUDED.tax_name,
        tax_rate = EXCLUDED.tax_rate,
        tax_inclusive = EXCLUDED.tax_inclusive,
        tax_registration_number = EXCLUDED.tax_registration_number,
        updated_at = NOW()
      `,
      [
        store.id,
        val(body.tax_name),
        num(body.tax_rate),
        body.tax_inclusive || false,
        val(body.tax_registration_number),
      ],
    );

    /* =========================
       PAYMENT
    ========================== */
    await client.query(
      `
      INSERT INTO store_payment_settings
      (store_id, stripe_enabled, stripe_account_id,
       razorpay_enabled, cod_enabled)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (store_id)
      DO UPDATE SET
        stripe_enabled = EXCLUDED.stripe_enabled,
        stripe_account_id = EXCLUDED.stripe_account_id,
        razorpay_enabled = EXCLUDED.razorpay_enabled,
        cod_enabled = EXCLUDED.cod_enabled,
        updated_at = NOW()
      `,
      [
        store.id,
        !!body.stripe_enabled,
        val(body.stripe_account_id),
        !!body.razorpay_enabled,
        !!body.cod_enabled,
      ],
    );

    /* =========================
       SHIPPING
    ========================== */
    await client.query(
      `
      INSERT INTO store_shipping_settings
      (store_id, free_shipping_threshold, flat_shipping_rate, international_shipping)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (store_id)
      DO UPDATE SET
        free_shipping_threshold = EXCLUDED.free_shipping_threshold,
        flat_shipping_rate = EXCLUDED.flat_shipping_rate,
        international_shipping = EXCLUDED.international_shipping,
        updated_at = NOW()
      `,
      [
        store.id,
        num(body.free_shipping_threshold),
        num(body.flat_shipping_rate),
        !!body.international_shipping,
      ],
    );

    /* =========================
       SEO
    ========================== */
    await client.query(
      `
      INSERT INTO store_seo_settings
      (store_id, meta_title, meta_description, meta_keywords,
       facebook_pixel_id, google_analytics_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (store_id)
      DO UPDATE SET
        meta_title = EXCLUDED.meta_title,
        meta_description = EXCLUDED.meta_description,
        meta_keywords = EXCLUDED.meta_keywords,
        facebook_pixel_id = EXCLUDED.facebook_pixel_id,
        google_analytics_id = EXCLUDED.google_analytics_id,
        updated_at = NOW()
      `,
      [
        store.id,
        val(body.meta_title),
        val(body.meta_description),
        val(body.meta_keywords),
        body.facebook_pixel_id,
        body.google_analytics_id,
      ],
    );

    /* =========================
       SUBSCRIPTION
    ========================== */
    await client.query(
      `
      INSERT INTO store_subscription
      (store_id, plan_name, status, renewal_date)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (store_id)
      DO UPDATE SET
        plan_name = EXCLUDED.plan_name,
        status = EXCLUDED.status,
        renewal_date = EXCLUDED.renewal_date,
        updated_at = NOW()
      `,
      [
        store.id,
        val(body.plan_name),
        body.subscription_status,
        val(body.renewal_date),
      ],
    );

    /* =========================
        Working Hours
    ========================== */

    const { working_hours } = body;

    // delete old
    await client.query(`DELETE FROM store_working_hours WHERE store_id = $1`, [
      store.id,
    ]);

    // insert new
    for (const wh of working_hours || []) {
      await client.query(
        `
        INSERT INTO store_working_hours
        (store_id, day_of_week, open_time, close_time, is_closed)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [store.id, wh.day_of_week, wh.open_time, wh.close_time, wh.is_closed],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("STORE SETTINGS UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update store settings" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
