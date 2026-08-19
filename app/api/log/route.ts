// / Internal endpoint called by middleware to log all API mutations.

import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/core/db";



// Map URL path segments → entity name shown in the activity log

function deriveEntity(path: string): string {

 if (path.includes("/orders")) return "order";

 if (path.includes("/products")) return "product";

 if (path.includes("/users")) return "user";

 if (path.includes("/stores")) return "store";

 if (path.includes("/shipping")) return "shipment";

 if (path.includes("/customers")) return "customer";

 if (path.includes("/billing")) return "billing";

 if (path.includes("/returns")) return "return";

 if (path.includes("/packaging")) return "packaging";

 if (path.includes("/roles")) return "role";

 if (path.includes("/tax-rules")) return "tax";

 if (path.includes("/currencies")) return "currency";

 if (path.includes("/recipes")) return "recipe";

 if (path.includes("/category")) return "category";

 if (path.includes("/partners")) return "partner";

 return "system";

}



// Convert HTTP method + path into a readable label

function deriveAction(method: string, path: string): string {

 const entity = deriveEntity(path);



 // Specific overrides

 if (path.includes("/fulfill")) return `fulfilled ${entity}`;

 if (path.includes("/action")) return `performed action on ${entity}`;

 if (path.includes("/decision")) return `made decision on ${entity}`;

 if (path.includes("/ship")) return `shipped ${entity}`;

 if (path.includes("/approve")) return `approved ${entity}`;

 if (path.includes("/stock-in")) return `stocked in packaging`;

 if (path.includes("/create-shipment")) return `created shipment`;

 if (path.includes("/generate-label")) return `generated label`;

 if (path.includes("/confirm-booking")) return `confirmed booking`;

 if (path.includes("/status")) return `updated ${entity} status`;

 if (path.includes("/import")) return `imported ${entity}`;



 if (method === "POST") return `created ${entity}`;

 if (method === "PUT" || method === "PATCH") return `updated ${entity}`;

 if (method === "DELETE") return `deleted ${entity}`;

 return `${method.toLowerCase()} ${entity}`;

}



export async function POST(req: NextRequest) {

 try {

   const { actorId, actorEmail, method, path } = await req.json();



   const action = deriveAction(method, path);

   const entity = deriveEntity(path);



   await pool.query(

     `INSERT INTO audit\_logs (actor\_id, action, entity, entity\_id, metadata)

      VALUES ($1, $2, $3, $4, $5)`,

     [

       actorId || null,

       action,

       entity,

       null,

       JSON.stringify({ email: actorEmail, method, path }),

     ],

   );



   return NextResponse.json({ ok: true });

 } catch (err: any) {

   // Silent fail — never break the main request

   console.error("\[activity-log]", err?.message);

   return NextResponse.json({ ok: false });

 }

}