# Asian Spices — Database Schema Documentation

Generated from `public/Copy of Asian_Spices_Database_Schema (003).xlsx` and cross-checked against this admin codebase (`app/`, `components/`, `lib/`, `core/`).

**Totals:** 133 tables, ~1298 columns.

## How to read this document

For every table:

- **Purpose** — what business data it holds
- **Where used** — admin panel / APIs / modules (when known)
- **Logic applied** — rules and workflows
- **If empty / no logic** — recommended next step

### Active architecture (current source of truth)

```
Auth:     users → store_users → roles → role_permissions → permissions
Tenant:   stores → store_settings / store_addresses
Catalog:  store_products + store_categories/subcategories/brands
          → store_product_images / prices / countries
          → store_product_catalog (per-store stock)
Orders:   store_orders → store_order_items
          → order_item_allocations / order_routing_attempts / order_events
Returns:  store_order_returns → store_order_return_items → store_return_allocations
Ship:     shipping_providers/methods/configs → shipments
Pack:     packaging_types/rules/… → store_packaging_inventory → order_packaging
Bill:     plans → subscriptions → invoices
CMS:      recipes (+ tags/categories) ; blogs ; media
```

> **Important:** Many older tables (`products`, `orders`, `customers`, `categories`, `brand`) still exist from earlier schema generations. Active multi-tenant commerce is **`store_*`**.

---

## Platform & Auth

### 1. `audit_logs`

| | |
|---|---|
| **Columns (7)** | id, actor_id, action, entity, entity_id, metadata, created_at |
| **Purpose** | Generic activity/audit trail. |
| **Where used** | `lib/audit.ts`, `components/platform/client/actions.ts`, `components/platform/settings/FeatureFlagsForm.tsx`, `app/api/users/[userId]/route.ts`, `app/api/users/route.ts`, `app/platform/billing/actions.ts`, `app/api/store/catalog/bulk/route.ts` |
| **Logic applied** | logAudit() and activity middleware log mutations with actor, action, entity, metadata. |


### 2. `email_change_tokens`

| | |
|---|---|
| **Columns (6)** | id, user_id, new_email, token, expires_at, created_at |
| **Purpose** | One-time tokens for email change confirmation. |


### 3. `login_audit`

| | |
|---|---|
| **Columns (5)** | id, user_id, ip, user_agent, created_at |
| **Purpose** | Login attempts with IP/user-agent. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | No app usage found. |
| **If empty / no logic** | Optional security feature — wire on NextAuth sign-in or drop. |

### 4. `partner_registration`

| | |
|---|---|
| **Columns (25)** | kvk_number, company_name, chamber_of_commerce_number, country, street, house_number, additional_address, postal_code, city, chamber_of_commerce_extract_document, power_of_attorney_document, first_name, middle_name, last_name, business_phone_number, business_email_address, vat_number, idin, created_at, status, reviewed_by, reviewed_at, rejection_reason, partner_id, application_id |
| **Purpose** | Partner/B2B application intake and review. |
| **Where used** | `lib/services/partner.service.ts`, `lib/services/platformDashboard.ts`, `components/platform/stores/StoreCard.tsx`, `components/platform/stores/actions.ts`, `components/platform/partners/actions.ts`, `app/api/stores/[storeId]/route.ts`, `app/api/partners/[id]/route.ts`, `app/platform/stores/[storeId]/page.tsx`, `app/api/partners/route.ts`, `app/platform/stores/page.tsx`, `app/platform/partners/[id]/page.tsx`, `app/platform/partners/page.tsx` |
| **Logic applied** | Approve/reject flow creates store + owner user; stores partner docs and KVK data. |



### 6. `permissions`

| | |
|---|---|
| **Columns (2)** | id, key |
| **Purpose** | Permission keys (e.g. VIEW_ORDERS). |
| **Where used** | `lib/validations/roles.ts`, `components/store/users/UsersList.tsx`, `core/common/sidebar/collapsedSidebar.tsx`, `lib/services/partner.service.ts`, `lib/auth/permissions.ts`, `lib/auth/guards.ts`, `app/store/[tenant]/users/[userId]/page.tsx`, `app/store/[tenant]/settings/roles/[roleId]/page.tsx`, `app/store/[tenant]/settings/roles/page.tsx`, `app/store/[tenant]/settings/roles/new/page.tsx`, `components/platform/client/UsersList.tsx`, `components/platform/client/UserForm.tsx` (+11 more) |
| **Logic applied** | Joined through role_permissions in requireStorePermission guards. |


### 7. `platform_settings`

| | |
|---|---|
| **Columns (4)** | key, value, updated_by, updated_at |
| **Purpose** | Global key/value platform configuration. |
| **Where used** | `components/platform/settings/actions.ts`, `app/platform/settings/page.tsx` |
| **Logic applied** | Read/write from /platform/settings. |


### 8. `role_permissions`

| | |
|---|---|
| **Columns (2)** | role_id, permission_id |
| **Purpose** | Many-to-many roles ↔ permissions. |
| **Where used** | `lib/auth/guards.ts`, `app/store/[tenant]/settings/roles/[roleId]/page.tsx`, `app/store/[tenant]/settings/roles/page.tsx`, `app/api/roles/[id]/route.ts`, `app/api/roles/route.ts` |
| **Logic applied** | Permission matrix for store routes and settings admin. |
| **If empty / no logic** | Core RBAC — keep. |

### 9. `roles`

| | |
|---|---|
| **Columns (4)** | id, key, scope, name |
| **Purpose** | Role definitions (platform/store scope). |
| **Where used** | `lib/validations/roles.ts`, `lib/auth/guards.ts`, `lib/services/partner.service.ts`, `app/store/[tenant]/users/[userId]/page.tsx`, `app/store/[tenant]/users/new/page.tsx`, `core/common/sidebar/two-column/index.tsx`, `core/common/sidebar/collapsedSidebar.tsx`, `app/store/[tenant]/settings/roles/[roleId]/page.tsx`, `app/store/[tenant]/settings/roles/page.tsx`, `app/store/[tenant]/settings/roles/new/page.tsx`, `components/store/users/ManageUserForm.tsx`, `core/auth/core/authorize.ts` (+11 more) |
| **Logic applied** | Assigned via store_users.role_id; scoped roles for store settings UI. |
| **If empty / no logic** | Core RBAC — keep. |

### 10. `store_addresses`

| | |
|---|---|
| **Columns (12)** | id, store_id, address_line1, address_line2, city, state, postal_code, country, latitude, longitude, created_at, updated_at |
| **Purpose** | Warehouse/ship-from address per store. |
| **Where used** | `lib/services/partner.service.ts`, `lib/order-routing.ts`, `core/order-routing/index.ts`, `app/api/store-settings/route.ts`, `app/api/shipping/create-shipment/route.ts` |
| **Logic applied** | Sender address for CheapCargo/shipping and partner store setup. |
| **If empty / no logic** | Required for shipping labels — maintain complete address per store. |

### 11. `store_audit_logs`

| | |
|---|---|
| **Columns (8)** | id, store_id, actor_id, action, entity, entity_id, changes, created_at |
| **Purpose** | Store-scoped catalog/operation audits. |
| **Where used** | `app/api/store/catalog/bulk/route.ts` |
| **Logic applied** | Bulk product catalog operations log changes. |
| **If empty / no logic** | Keep; can also feed activity log. |

### 12. `store_settings`

| | |
|---|---|
| **Columns (14)** | id, store_id, store_email, store_phone, currency_code, currency_symbol, country_code, timezone, language, date_format, time_format, created_at, updated_at, currency_id |
| **Purpose** | Per-store operational settings (email, currency, country, timezone). |
| **Where used** | `lib/order-routing.ts`, `lib/services/partner.service.ts`, `components/platform/stores/actions.ts`, `app/api/shipping/create-shipment/route.ts`, `app/api/store-settings/route.ts` |
| **Logic applied** | Used in order routing, create-shipment labels, store admin settings. |
| **If empty / no logic** | Core — keep; ensure currency_id and country_code populated per store. |

### 13. `store_users`

| | |
|---|---|
| **Columns (4)** | id, store_id, user_id, role_id |
| **Purpose** | Maps users to stores with a role. |
| **Where used** | `lib/auth/guards.ts`, `app/store/[tenant]/users/[userId]/page.tsx`, `lib/services/storeDashboard.ts`, `lib/services/partner.service.ts`, `components/platform/stores/actions.ts`, `components/platform/client/actions.ts`, `core/auth/core/authorize.ts`, `app/api/users/[userId]/route.ts`, `app/platform/users/[userId]/page.tsx`, `app/api/store-users/[id]/route.ts`, `app/api/store-users/route.ts` |
| **Logic applied** | Guards check membership + role_permissions before store access. Platform admins bypass this check. |
| **If empty / no logic** | Core RBAC — keep. |

### 14. `stores`

| | |
|---|---|
| **Columns (9)** | id, name, slug, status, created_at, updated_at, owner_email, is_default, partner_registration_id |
| **Purpose** | Tenant (store) master records. |
| **Where used** | `app/platform/users/[userId]/page.tsx`, `app/api/users/[userId]/route.ts`, `lib/services/platformDashboard.ts`, `lib/services/partner.service.ts`, `lib/order-routing.ts`, `lib/auth/permissions.ts`, `lib/auth/guards.ts`, `app/platform/stores/[storeId]/StoreTabs.tsx`, `app/platform/stores/[storeId]/StoreForm.tsx`, `app/platform/stores/[storeId]/shipping-methods/page.tsx`, `components/shipping/store/ShippingTabs.tsx`, `app/api/stores/[storeId]/route.ts` (+48 more) |
| **Logic applied** | Resolved by slug in middleware/guards; partner onboarding links partner_registration_id. |
| **If empty / no logic** | Core tenancy — keep. |

### 15. `tenants`

| | |
|---|---|
| **Columns (8)** | id, name, email, idin_verified, idin_status, created_at, updated_at, onboarding_completed |
| **Purpose** | Tenant identity/onboarding (idin verified). |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | No strong commerce path; may support partner/id verification. |
| **If empty / no logic** | Clarify if still needed vs stores; consolidate or remove if dead. |

### 16. `user_audit_logs`

| | |
|---|---|
| **Columns (6)** | id, user_id, action, actor_id, changes, created_at |
| **Purpose** | User-management audit trail. |
| **Where used** | `components/platform/client/actions.ts`, `app/api/users/[userId]/route.ts`, `app/api/users/route.ts` |
| **Logic applied** | Written on user create/update from users APIs. |
| **If empty / no logic** | Keep; surfaces in activity log union. |

### 17. `users`

| | |
|---|---|
| **Columns (10)** | id, email, password_hash, name, is_platform_admin, status, created_at, role, store_id, password_changed_at |
| **Purpose** | Platform and store user accounts (login identity). |
| **Where used** | `core/db.ts`, `app/store/[tenant]/users/[userId]/page.tsx`, `app/store/[tenant]/users/page.tsx`, `lib/services/storeDashboard.ts`, `lib/auth/guards.ts`, `core/modals/usermanagement/edituser.tsx`, `lib/services/platformDashboard.ts`, `lib/services/partner.service.ts`, `app/store/[tenant]/users/new/page.tsx`, `components/store/users/UsersList.tsx`, `components/store/users/ManageUserForm.tsx`, `core/modals/settings/twofactorconfig.tsx` (+43 more) |
| **Logic applied** | Used for authentication (NextAuth), platform admin flag, password hash, status. Joined for store membership via store_users and audit actor labels. |
| **If empty / no logic** | Core — keep and protect. |

### 18. `users-2`

| | |
|---|---|
| **Columns (8)** | id, email, password_hash, role, created_at, name, is_platform_admin, status |
| **Purpose** | Backup/old copy of users schema. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None in application code. |
| **If empty / no logic** | Legacy backup — do not use; archive or drop after export. |

### 19. `verifications`

| | |
|---|---|
| **Columns (13)** | id, tenant_id, provider, status, merchant_reference, psp_reference, first_name, last_name, iban, country, raw_response, created_at, updated_at |
| **Purpose** | Identity/payment verification records (idin, IBAN). |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | Likely partner/identity flow; limited app wiring. |
| **If empty / no logic** | Connect to partner onboarding if required; else archive. |

---

## Catalog & Products

### 20. `brand`

| | |
|---|---|
| **Columns (5)** | brand_id, name, status, created_at, updated_at |
| **Purpose** | Old brand table. |
| **Where used** | `core/types/catalog.ts`, `components/store-settings/manage-settings.tsx`, `core/common/sidebar/two-column/index.tsx`, `core/common/sidebar/collapsedSidebar.tsx`, `core/common/header/header.tsx`, `components/products/addproduct3.tsx`, `components/products/addproduct.tsx`, `components/products/tabs/ProductMainTab.tsx`, `components/products/productlist.tsx`, `components/products/ProductForm.tsx`, `core/modals/inventory/addbrand.tsx`, `components/products/FormSections/product.schema.ts` (+24 more) |
| **Logic applied** | Not used (store_brands used instead). |
| **If empty / no logic** | Drop after data move if any rows remain. |

### 21. `categories`

| | |
|---|---|
| **Columns (6)** | category_id, category, categoryslug, created_at, updated_at, status |
| **Purpose** | Old categories table. |
| **Where used** | `components/tax/taxList.tsx`, `components/subcategory/subcategoryList.tsx`, `components/subcategory/SubcategoryFilterBar.tsx`, `core/common/sidebar/collapsedSidebar.tsx`, `core/common/sidebar/two-column/index.tsx`, `components/products-catalog/FilterBar.tsx`, `components/category/FilterBar.tsx`, `components/category/categoryList.tsx`, `components/products/ProductForm.tsx`, `components/products/addproduct.tsx`, `components/platform/Sidebar.tsx`, `app/api/category/route.ts` (+22 more) |
| **Logic applied** | Not used (store_categories used). |
| **If empty / no logic** | Drop after migration of leftover data. |

### 22. `product_images`

| | |
|---|---|
| **Columns (5)** | product_image_id, product_id, media_id, is_primary, created_at |
| **Purpose** | Old product image links to media. |
| **Where used** | `app/api/products/import/route.ts`, `app/api/products/import/confirm/route.ts`, `app/api/products/[id]/route.ts`, `app/api/products/[id]/images/route.ts` |
| **Logic applied** | Not used. |
| **If empty / no logic** | Drop; use store_product_images. |

### 23. `product_images-2`

| | |
|---|---|
| **Columns (5)** | id, product_id, media_id, is_primary, sort_order |
| **Purpose** | Old product images snapshot. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Drop. |

### 24. `product_media`

| | |
|---|---|
| **Columns (5)** | id, product_id, media_id, is_primary, created_at |
| **Purpose** | Old product↔media join. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Drop. |

### 25. `product_reviews`

| | |
|---|---|
| **Columns (9)** | review_id, product_id, user_id, rating, comment, created_at, name, email, review |
| **Purpose** | Reviews by user against product. |
| **Where used** | `app/api/reviews/route.ts` |
| **Logic applied** | app/api/reviews reads/inserts here. |
| **If empty / no logic** | Either migrate to store_product_reviews or keep as current API table. |

### 26. `products`

| | |
|---|---|
| **Columns (18)** | product_id, name, slug, sku, item_code, category_id, subcategory_id, brand_id, country_of_origin, description, price, quantity, discount_type_id, discount_value, status, created_at, updated_at, store_id |
| **Purpose** | Legacy products table (pre store_products). |
| **Where used** | `core/email-templates.ts`, `components/blogs/CreateBlogForm.tsx`, `components/tax/taxList.tsx`, `components/dashboard/ProductsSection.tsx`, `components/store/Sidebar.tsx`, `app/store/[tenant]/dashboard/page.tsx`, `components/products-catalog/QuantityInput.tsx`, `components/products-catalog/ProductsCatalogComponent.tsx`, `components/products-catalog/PriceInput.tsx`, `components/products-catalog/FilterBar.tsx`, `components/products-catalog/AssignProductsTable.tsx`, `components/products-catalog/AssignedProductsTable.tsx` (+82 more) |
| **Logic applied** | related-products, random-products, email templates only. |
| **If empty / no logic** | Migrate leftovers to store_products then deprecate. |

### 27. `products-2`

| | |
|---|---|
| **Columns (20)** | product_id, name, description, price, quantity, category_id, image_url, created_at, updated_at, matchcode, item_code, brand_id, region, country_of_origin, status, sku, slug, subcategory_id, discount_type_id, discount_value |
| **Purpose** | Legacy products variant. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Drop/archive. |

### 28. `products3`

| | |
|---|---|
| **Columns (17)** | product_id, name, slug, sku, item_code, category_id, subcategory_id, brand_id, country_of_origin, description, price, quantity, discount_type_id, discount_value, status, created_at, updated_at |
| **Purpose** | Legacy products variant. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Drop/archive. |

### 29. `store_brands`

| | |
|---|---|
| **Columns (9)** | brand_id, store_id, name, slug, description, logo_url, status, created_at, updated_at |
| **Purpose** | Brand master for products. |
| **Where used** | `app/api/brand/route.ts`, `app/api/products/template/route.ts`, `app/api/products/route.ts`, `app/api/products/import/route.ts`, `app/api/products/import/preview/route.ts`, `app/api/store/catalog/route.ts`, `app/api/products/import/confirm/route.ts` |
| **Logic applied** | Brand API + product joins. |
| **If empty / no logic** | Core — keep. |

### 30. `store_categories`

| | |
|---|---|
| **Columns (7)** | id, store_id, name, slug, status, created_at, updated_at |
| **Purpose** | Product categories. |
| **Where used** | `app/api/tax-rules/import/route.ts`, `app/api/subcategory/route.ts`, `app/api/store/catalog/route.ts`, `app/api/products/template/route.ts`, `app/api/products/route.ts`, `app/api/products/import/route.ts`, `app/api/products/import/preview/route.ts`, `app/api/products/import/confirm/route.ts`, `app/api/category/route.ts` |
| **Logic applied** | Platform category API + product assignment + tax import. |
| **If empty / no logic** | Core — keep. |

### 31. `store_product_catalog`

| | |
|---|---|
| **Columns (10)** | id, store_id, product_id, price, quantity, custom_name, custom_description, status, assigned_at, updated_at |
| **Purpose** | Per-store assignment of products (price, qty, status). |
| **Where used** | `core/order-routing/index.ts`, `lib/order-routing.ts`, `lib/services/storeDashboard.ts`, `app/api/products/[id]/route.ts`, `app/api/store/catalog/route.ts`, `app/api/products/import/confirm/route.ts`, `app/api/store/catalog/bulk/route.ts` |
| **Logic applied** | Order routing picks stock stores; store catalog UI bulk ops. |
| **If empty / no logic** | Core for multi-store inventory routing — keep qty in sync. |

### 32. `store_product_countries`

| | |
|---|---|
| **Columns (3)** | id, product_id, country_id |
| **Purpose** | Which countries a product is available in. |
| **Where used** | `app/api/products/[id]/route.ts`, `app/api/products/route.ts`, `app/api/products/import/route.ts`, `app/api/products/import/confirm/route.ts` |
| **Logic applied** | Product admin assigns country_ids; filters sellable countries. |
| **If empty / no logic** | Keep for multi-country catalog. |

### 33. `store_product_discount`

| | |
|---|---|
| **Columns (9)** | id, product_id, customer_type, discount_type, discount_value, promo_code, status, created_at, updated_at |
| **Purpose** | Product-level discounts and promo fields. |
| **Where used** | `app/api/products/[id]/route.ts`, `app/api/products/route.ts`, `app/api/products/discounts/import/confirm/route.ts` |
| **Logic applied** | Discount import/confirm APIs. |
| **If empty / no logic** | Keep if promo engine active; else mark optional. |

### 34. `store_product_images`

| | |
|---|---|
| **Columns (7)** | id, product_id, url, alt_text, is_primary, sort_order, created_at |
| **Purpose** | Product image URLs and primary flag. |
| **Where used** | `app/api/products/[id]/route.ts`, `app/api/products/[id]/images/route.ts`, `app/api/products/import/route.ts`, `app/api/products/import/confirm/route.ts` |
| **Logic applied** | Image upload/replace on product edit/import. |
| **If empty / no logic** | Core — keep. |

### 35. `store_product_images_bkup_20260610`

| | |
|---|---|
| **Columns (7)** | id, product_id, url, alt_text, is_primary, sort_order, created_at |
| **Purpose** | Dated backup of product images. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Backup — archive/drop. |

### 36. `store_product_images2`

| | |
|---|---|
| **Columns (7)** | id, product_id, url, alt_text, is_primary, sort_order, created_at |
| **Purpose** | Duplicate/snapshot of product images. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Backup — drop after reconcile. |

### 37. `store_product_prices`

| | |
|---|---|
| **Columns (5)** | id, product_id, customer_type, min_quantity, price |
| **Purpose** | Tiered prices by customer_type and min_quantity. |
| **Where used** | `app/api/products/route.ts`, `app/api/products/[id]/route.ts`, `app/api/products/import/route.ts`, `app/api/products/import/confirm/route.ts` |
| **Logic applied** | B2B/B2C pricing on product CRUD/import. |
| **If empty / no logic** | Core for multi-tier pricing — keep populated. |

### 38. `store_product_prices_110626`

| | |
|---|---|
| **Columns (5)** | id, product_id, customer_type, min_quantity, price |
| **Purpose** | Dated prices backup. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Backup — drop after verify. |

### 39. `store_product_reviews`

| | |
|---|---|
| **Columns (11)** | id, product_id, customer_id, rating, title, comment, status, created_at, updated_at, guest_name, guest_email |
| **Purpose** | Storefront product reviews (customer/guest). |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | May be storefront-facing; admin reviews API still uses product_reviews. |
| **If empty / no logic** | Prefer one reviews model (this vs product_reviews) and standardize. |

### 40. `store_products`

| | |
|---|---|
| **Columns (45)** | id, store_id, name, slug, sku, item_code, category_id, subcategory_id, brand_id, description, base_price, quantity, status, created_at, updated_at, country_of_origin, country_id, discount_type, discount_value, health_benefits, search_vector, sale_price, purchase_price, customer_type, promo_code, field1_label, field1_value, field2_label, field2_value, field3_label, field3_value, field4_label, field4_value, field5_label, field5_value, field6_label, field6_value, field7_label, field7_value, field8_label, field8_value, field9_label, field9_value, field10_label, field10_value |
| **Purpose** | Primary product master (platform catalog). |
| **Where used** | `app/api/products/[id]/route.ts`, `app/api/products/route.ts`, `app/api/products/import/route.ts`, `app/api/products/import/preview/route.ts`, `app/api/products/discounts/import/preview/route.ts`, `app/api/products/import/confirm/route.ts`, `app/api/products/discounts/import/confirm/route.ts`, `app/api/platform/returns/route.ts`, `app/api/platform/orders/[orderId]/route.ts`, `app/api/platform/orders/route.ts`, `app/api/orders-queue/[orderId]/route.ts`, `app/api/orders-queue/route.ts` (+8 more) |
| **Logic applied** | CRUD, import, search_vector, discounts, multi country/brand/category FKs. |
| **If empty / no logic** | Core — keep as product source of truth. |

### 41. `store_products_110626`

| | |
|---|---|
| **Columns (21)** | id, store_id, name, slug, sku, item_code, category_id, subcategory_id, brand_id, description, price, quantity, status, created_at, updated_at, country_of_origin, country_id, discount_type, discount_value, health_benefits, search_vector |
| **Purpose** | Dated product backup. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Backup — archive/drop after verify. |

### 42. `store_products2`

| | |
|---|---|
| **Columns (21)** | id, store_id, name, slug, sku, item_code, category_id, subcategory_id, brand_id, description, price, quantity, status, created_at, updated_at, country_of_origin, country_id, discount_type, discount_value, health_benefits, search_vector |
| **Purpose** | Older product snapshot schema. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Backup — do not write; archive/drop after verify. |

### 43. `store_subcategories`

| | |
|---|---|
| **Columns (8)** | id, store_id, category_id, name, slug, status, created_at, updated_at |
| **Purpose** | Subcategories under store_categories. |
| **Where used** | `app/api/subcategory/route.ts`, `app/api/products/template/route.ts`, `app/api/products/route.ts`, `app/api/products/import/route.ts`, `app/api/products/import/preview/route.ts`, `app/api/products/import/confirm/route.ts` |
| **Logic applied** | Subcategory API + product FK. |
| **If empty / no logic** | Core — keep. |

### 44. `subcategories`

| | |
|---|---|
| **Columns (8)** | subcategory_id, category_id, category_code, title, description, status, created_at, updated_at |
| **Purpose** | Old subcategories. |
| **Where used** | `core/common/sidebar/two-column/index.tsx`, `components/subcategory/subcategoryList.tsx`, `components/subcategory/SubcategoryFilterBar.tsx`, `components/products-catalog/FilterBar.tsx`, `components/products/addproduct.tsx`, `app/api/subcategory/route.ts`, `components/products/ProductForm.tsx`, `app/api/products/template/route.ts`, `app/api/products/route.ts`, `app/api/products/import/route.ts`, `app/api/products/import/confirm/route.ts`, `app/api/products/import/preview/route.ts` |
| **Logic applied** | Not used (store_subcategories used). |
| **If empty / no logic** | Drop after migration. |

---

## Cart & Customers

### 45. `cart_items`

| | |
|---|---|
| **Columns (7)** | cart_item_id, user_id, product_id, quantity, added_at, item_id, price |
| **Purpose** | Legacy cart lines. |
| **Where used** | `app/api/register-customer/route.ts` |
| **Logic applied** | None in admin. |
| **If empty / no logic** | Drop if storefront migrated to store_cart_items. |

### 46. `customer_addresses`

| | |
|---|---|
| **Columns (9)** | address_id, customer_id, address_line1, address_line2, city, state, country, postal_code, is_default |
| **Purpose** | Legacy addresses. |
| **Where used** | `core/order-routing/index.ts`, `app/api/customers/[customerId]/route.ts`, `app/api/customers/route.ts`, `app/api/customers/[customerId]/addresses/[addressId]/route.ts`, `app/api/customers/[customerId]/addresses/route.ts`, `app/api/platform/orders/[orderId]/route.ts` |
| **Logic applied** | Alternate customer detail path. |
| **If empty / no logic** | Migrate to store_customer_addresses. |

### 47. `customers`

| | |
|---|---|
| **Columns (7)** | id, user_id, email, first_name, last_name, phone, created_at |
| **Purpose** | Legacy global customers. |
| **Where used** | `components/store/Sidebar.tsx`, `components/customers/customersList.tsx`, `components/customers/CustomerForm.tsx`, `components/customers/CustomerFilterBar.tsx`, `components/customers/AddressManager.tsx`, `lib/services/storeDashboard.ts`, `core/modals/sales/editsalesretuens.tsx`, `core/modals/sales/addsalesreturns.tsx`, `core/modals/purchases/editpurchases.tsx`, `core/modals/purchases/addpurchases.tsx`, `app/store/[tenant]/customers/[customerId]/page.tsx`, `app/store/[tenant]/customers/page.tsx` (+16 more) |
| **Logic applied** | Some alternate customer API branches. |
| **If empty / no logic** | Consolidate into store_customers then remove dual path. |

### 48. `customers-old`

| | |
|---|---|
| **Columns (9)** | customer_id, first_name, last_name, email, phone, status, created_at, updated_at, store_id |
| **Purpose** | Named backup of customers. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Drop/archive. |

### 49. `store_cart_items`

| | |
|---|---|
| **Columns (10)** | id, cart_id, product_id, quantity, price, created_at, updated_at, exchange_rate, tax_rate, tax_amount |
| **Purpose** | Cart line items with tax/FX snapshot. |
| **Where used** | `app/api/register-customer/route.ts` |
| **Logic applied** | Cart merge on customer register. |
| **If empty / no logic** | Keep for storefront checkout path. |

### 50. `store_carts`

| | |
|---|---|
| **Columns (6)** | id, global_customer_id, store_id, created_at, updated_at, session_id |
| **Purpose** | Shopping cart header per customer/session/store. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | register-customer / storefront cart flows. |
| **If empty / no logic** | Storefront concern — keep if frontend uses it; else document owner app. |

### 51. `store_customer_addresses`

| | |
|---|---|
| **Columns (17)** | id, store_id, customer_id, label, address_line1, address_line2, city, state, postal_code, country, is_default, created_at, updated_at, is_shipping_address, is_billing_address, latitude, longitude |
| **Purpose** | Customer shipping/billing addresses. |
| **Where used** | `core/order-routing/index.ts`, `app/api/customers/[customerId]/addresses/[addressId]/route.ts`, `app/api/customers/[customerId]/addresses/route.ts`, `app/api/customers/route.ts`, `app/api/platform/orders/[orderId]/route.ts` |
| **Logic applied** | Orders shipping address source; address CRUD APIs. |
| **If empty / no logic** | Core — needed for CheapCargo receiver street/city/zip. |

### 52. `store_customers`

| | |
|---|---|
| **Columns (17)** | id, store_id, customer_type, company_name, tax_id, first_name, last_name, email, phone, credit_limit, payment_terms, created_at, status, updated_at, city, postcode, user_id |
| **Purpose** | Per-store customer profiles. |
| **Where used** | `lib/services/storeDashboard.ts`, `app/api/customers/route.ts`, `app/api/customers/[customerId]/status/route.ts`, `app/api/customers/[customerId]/route.ts`, `app/api/orders/[orderId]/ship/route.ts`, `app/api/orders/[orderId]/route.ts`, `app/api/shipping/create-shipment/route.ts`, `app/api/orders/route.ts`, `app/api/platform/returns/route.ts`, `app/api/platform/orders/[orderId]/route.ts` |
| **Logic applied** | Order joins, customer admin APIs, shipping receiver email/phone/name. |
| **If empty / no logic** | Core order identity — keep complete names/phones for labels. |

### 53. `wishlists`

| | |
|---|---|
| **Columns (4)** | id, user_id, product_id, created_at |
| **Purpose** | Customer wishlist products. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | No admin usage found. |
| **If empty / no logic** | Storefront feature — implement or drop. |

---

## Orders & Fulfillment

### 54. `order_events`

| | |
|---|---|
| **Columns (7)** | id, order_id, event_type, store_id, message, metadata, created_at |
| **Purpose** | Order timeline/event log. |
| **Where used** | `lib/order-routing.ts`, `core/order-routing/index.ts`, `app/api/orders/[orderId]/events/route.ts` |
| **Logic applied** | Written by routing; read on order detail events API. |
| **If empty / no logic** | Keep for ops visibility. |

### 55. `order_item_allocations`

| | |
|---|---|
| **Columns (9)** | id, order_id, order_item_id, store_id, allocated_quantity, fulfilled_quantity, status, created_at, updated_at |
| **Purpose** | Which store fills what qty of each line. |
| **Where used** | `core/order-routing/index.ts`, `lib/services/storeDashboard.ts`, `lib/order-routing.ts`, `app/api/orders-queue/[orderId]/route.ts`, `app/api/orders-queue/route.ts`, `app/api/orders/[orderId]/route.ts`, `app/api/orders/[orderId]/fulfill/route.ts`, `app/api/cron/order-timeout/route.ts`, `app/api/orders/[orderId]/allocate/route.ts`, `app/api/shipping/create-shipment/route.ts`, `app/api/shipping/confirm-booking/route.ts`, `app/api/store/orders/route.ts` (+3 more) |
| **Logic applied** | Multi-store routing engine; queue UI; returns. |
| **If empty / no logic** | Core routing — keep consistent with catalog stock. |

### 56. `order_items`

| | |
|---|---|
| **Columns (7)** | order_item_id, quantity, price, created_at, itemid, order_id, product_id |
| **Purpose** | Legacy order lines. |
| **Where used** | `core/order-routing/index.ts`, `lib/order-routing.ts`, `app/api/orders-queue/[orderId]/route.ts`, `app/api/orders-queue/route.ts`, `app/api/orders/[orderId]/route.ts`, `app/api/orders/[orderId]/fulfill/route.ts`, `app/api/orders/[orderId]/allocate/route.ts`, `app/api/orders/route.ts`, `app/api/products/route.ts`, `app/api/store/orders/route.ts`, `app/api/platform/orders/[orderId]/route.ts`, `app/api/platform/orders/route.ts` (+2 more) |
| **Logic applied** | None active. |
| **If empty / no logic** | Drop after migration check. |

### 57. `order_routing_attempts`

| | |
|---|---|
| **Columns (7)** | id, order_id, store_id, attempt_number, status, created_at, responded_at |
| **Purpose** | History of stores asked to accept an order. |
| **Where used** | `core/order-routing/index.ts`, `lib/order-routing.ts`, `app/api/cron/order-timeout/route.ts`, `app/api/orders/[orderId]/decision/route.ts`, `app/api/orders/[orderId]/allocate/route.ts`, `app/api/orders/[orderId]/action/route.ts` |
| **Logic applied** | accept/reject/reassign + timeouts in cron. |
| **If empty / no logic** | Core routing audit — keep. |

### 58. `orders`

| | |
|---|---|
| **Columns (12)** | order_id, user_id, order_date, total_amount, status, shipping_address, payment_method, payment_reference, customer_id, store_id, created_at, updated_at |
| **Purpose** | Legacy order header. |
| **Where used** | `core/email-templates.ts`, `core/order-routing/index.ts`, `core/shipping/service.ts`, `core/common/sidebar/two-column/index.tsx`, `core/common/sidebar/collapsedSidebar.tsx`, `lib/auth/permissions.ts`, `lib/services/storeDashboard.ts`, `lib/services/platformDashboard.ts`, `core/modals/pos-modal/posModals.tsx`, `lib/order-routing.ts`, `lib/order-actions.ts`, `components/orders-queue/ordersQueueList.tsx` (+50 more) |
| **Logic applied** | Some customer history branches only. |
| **If empty / no logic** | Migrate fully to store_orders then deprecate. |

### 59. `store_order_items`

| | |
|---|---|
| **Columns (13)** | id, order_id, product_id, quantity, price, created_at, fulfilled_quantity, status, exchange_rate, tax_rate, tax_amount, seller_order_no, shipment_tracking_code |
| **Purpose** | Order line items and fulfillment qty. |
| **Where used** | `core/order-routing/index.ts`, `lib/order-routing.ts`, `app/api/products/route.ts`, `app/api/shipping/create-shipment/route.ts`, `app/api/store/orders/route.ts`, `app/api/orders-queue/[orderId]/route.ts`, `app/api/orders-queue/route.ts`, `app/api/orders/route.ts`, `app/api/orders/[orderId]/allocate/route.ts`, `app/api/orders/[orderId]/route.ts`, `app/api/orders/[orderId]/fulfill/route.ts`, `app/api/platform/returns/approve/route.ts` (+2 more) |
| **Logic applied** | Allocate/fulfill; totals/tax per line. |
| **If empty / no logic** | Core — keep. |

### 60. `store_order_return_items`

| | |
|---|---|
| **Columns (12)** | id, return_id, product_id, quantity, seller_order_no, shipment_tracking_code, order_id, price, exchange_rate, tax_rate, tax_amount, created_at |
| **Purpose** | Return line items. |
| **Where used** | `core/email-templates.ts`, `app/api/platform/returns/route.ts`, `app/api/platform/returns/approve/route.ts` |
| **Logic applied** | Joined with returns UI/API. |
| **If empty / no logic** | Core returns — keep. |

### 61. `store_order_returns`

| | |
|---|---|
| **Columns (9)** | id, order_id, customer_id, status, reason, admin_notes, created_at, updated_at, return_number |
| **Purpose** | Return request headers. |
| **Where used** | `core/email-templates.ts`, `app/api/store/returns/route.ts`, `app/api/platform/returns/route.ts`, `app/api/platform/returns/approve/route.ts` |
| **Logic applied** | Store/platform returns list + approve flow. |
| **If empty / no logic** | Core returns — keep. |

### 62. `store_orders`

| | |
|---|---|
| **Columns (43)** | id, store_id, order_number, customer_id, order_type, subtotal, tax_amount, discount_amount, shipping_amount, total_amount, fulfillment_status, created_at, updated_at, payment_status, allocation_strategy, order_status, weight, length, width, height, boxes, tracking_number, shipping_label, shipping_provider, shipped_at, transaction_id, payment_method, routing_status, rejection_count, current_store_id, customer_email, shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_latitude, shipping_longitude, shipping_status, shipping_paid, payment_url, delivered_at |
| **Purpose** | Order header (status, money, shipping, routing). |
| **Where used** | `core/email-templates.ts`, `core/order-routing/index.ts`, `core/shipping/service.ts`, `lib/services/storeDashboard.ts`, `lib/order-routing.ts`, `app/api/cron/order-timeout/route.ts`, `app/api/orders/[orderId]/shipping/route.ts`, `app/api/orders/[orderId]/ship/route.ts`, `app/api/orders/[orderId]/route.ts`, `app/api/customers/route.ts`, `app/api/orders/[orderId]/decision/route.ts`, `app/api/customers/[customerId]/orders/route.ts` (+16 more) |
| **Logic applied** | Platform/store order lists, fulfillment, ship, CheapCargo, cron timeout, analytics. |
| **If empty / no logic** | Core commerce table — single source of order truth. |

### 63. `store_return_allocations`

| | |
|---|---|
| **Columns (9)** | id, return_id, order_item_allocation_id, store_id, product_id, return_quantity, status, created_at, updated_at |
| **Purpose** | Return qty per original allocation/store. |
| **Where used** | `app/api/store/returns/route.ts`, `app/api/platform/returns/approve/route.ts` |
| **Logic applied** | Return approve uses multi-store allocation context. |
| **If empty / no logic** | Keep for multi-store returns accuracy. |

---

## Shipping

### 64. `shipment_events`

| | |
|---|---|
| **Columns (7)** | id, shipment_id, status, description, event_time, raw, created_at |
| **Purpose** | Detailed tracking event stream per shipment. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | No inserts found; tracking may overwrite shipments.status only. |
| **If empty / no logic** | Wire tracking adapter to INSERT events, or drop if never planned. |

### 65. `shipments`

| | |
|---|---|
| **Columns (16)** | id, order_id, store_id, provider_id, shipping_method_id, external_shipment_id, tracking_number, label_url, status, raw_response, created_at, updated_at, trackingUrl, tracking_url, packaging_type_id, payment_url |
| **Purpose** | Created shipments (tracking, labels, provider ids). |
| **Where used** | `core/shipping/service.ts`, `core/shipping/providers/cheapcargo.ts`, `lib/shipping/providers/cheapcargo.ts`, `lib/shipping/adapters/cheapcargo.ts`, `app/api/shipping/track/route.ts`, `app/api/shipping/generate-label/route.ts`, `app/api/shipping/create-shipment/route.ts`, `app/api/shipping/confirm-booking/route.ts`, `app/api/orders/[orderId]/route.ts` |
| **Logic applied** | create-shipment INSERT; track/update; generate-label; order detail JOINs. |
| **If empty / no logic** | Core post-fulfill shipping — keep. |

### 66. `shipping_labels`

| | |
|---|---|
| **Columns (10)** | id, order_id, order_packaging_id, courier_name, tracking_number, label_url, api_response, shipping_cost, label_status, created_at |
| **Purpose** | Separate label documents table. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | Unused; labels live on shipments.label_url. |
| **If empty / no logic** | Either use for multi-label history or drop as redundant. |

### 67. `shipping_methods`

| | |
|---|---|
| **Columns (9)** | id, store_id, provider_id, name, code, type, is_active, created_at, updated_at |
| **Purpose** | Shipping method definitions. |
| **Where used** | `core/shipping/service.ts`, `app/store/[tenant]/shipping/methods/page.tsx`, `app/platform/stores/[storeId]/shipping-methods/page.tsx`, `app/platform/stores/[storeId]/shipping/rates/page.tsx`, `app/platform/stores/[storeId]/shipping/methods/page.tsx`, `app/platform/shipping/methods/page.tsx`, `app/platform/shipping/methods/[methodId]/rates/page.tsx`, `app/api/store/shipping-methods/route.ts`, `app/api/shipping/methods/route.ts`, `app/api/platform/shipping/shipping-methods/route.ts`, `app/api/shipping/create-shipment/route.ts`, `app/api/platform/shipping/shipping-methods/[id]/route.ts` (+1 more) |
| **Logic applied** | Platform methods CRUD; create-shipment joins method name/code. |
| **If empty / no logic** | Core — keep. |

### 68. `shipping_provider_configs`

| | |
|---|---|
| **Columns (9)** | id, provider_id, store_id, api_key, api_secret, extra, is_active, created_at, updated_at |
| **Purpose** | Active API config/extra per provider/store. |
| **Where used** | `lib/shipping/resolveCredentials.ts`, `lib/shipping/providerService.ts`, `core/shipping/service.ts`, `app/platform/shipping/providers/[providerId]/page.tsx`, `app/api/platform/shipping/providers/route.ts` |
| **Logic applied** | Used by lib/shipping credentials resolve, create-shipment, test-connection. |
| **If empty / no logic** | Core — store secrets securely; prefer this over credentials table. |

### 69. `shipping_provider_credentials`

| | |
|---|---|
| **Columns (11)** | id, store_id, provider_id, api_key, api_secret, access_token, refresh_token, metadata, is_active, created_at, updated_at |
| **Purpose** | Older credentials store (api keys/tokens). |
| **Where used** | `lib/shipping/resolveCredentials.ts`, `lib/shipping/providerService.ts`, `app/api/platform/shipping/providers/route.ts` |
| **Logic applied** | Partially legacy / commented resolve paths; some DELETE/joins remain. |
| **If empty / no logic** | Finish migration to configs or restore as sole secrets store; avoid dual tables. |

### 70. `shipping_providers`

| | |
|---|---|
| **Columns (6)** | id, name, slug, is_active, created_at, updated_at |
| **Purpose** | Master list of shipping providers (e.g. CheapCargo). |
| **Where used** | `core/shipping/service.ts`, `lib/shipping/resolveCredentials.ts`, `lib/shipping/providerService.ts`, `app/store/[tenant]/shipping/methods/page.tsx`, `app/platform/stores/[storeId]/shipping-methods/page.tsx`, `app/platform/stores/[storeId]/shipping/rates/page.tsx`, `app/platform/shipping/providers/[providerId]/page.tsx`, `app/platform/stores/[storeId]/shipping/providers/page.tsx`, `app/platform/stores/[storeId]/shipping/methods/page.tsx`, `app/platform/shipping/providers/page.tsx`, `app/platform/shipping/methods/[methodId]/rates/page.tsx`, `app/platform/shipping/methods/page.tsx` (+8 more) |
| **Logic applied** | Platform provider admin + assignments. |
| **If empty / no logic** | Core — keep. |

### 71. `shipping_rates`

| | |
|---|---|
| **Columns (14)** | id, method_id, country, state, city, min_weight, max_weight, min_price, max_price, price, created_at, updated_at, min_delivery_days, max_delivery_days |
| **Purpose** | Global method rates by geo/weight/price. |
| **Where used** | `app/platform/stores/[storeId]/shipping/rates/page.tsx`, `app/api/platform/shipping/shipping-rates/[id]/route.ts`, `app/api/platform/shipping/shipping-rates/route.ts`, `app/api/platform/shipping/shipping-rates/bulk/route.ts` |
| **Logic applied** | Platform shipping rates APIs. |
| **If empty / no logic** | Keep for checkout rate shopping if storefront uses it. |

### 72. `store_shipping_methods`

| | |
|---|---|
| **Columns (5)** | id, store_id, method_id, is_enabled, created_at |
| **Purpose** | Which methods a store enables. |
| **Where used** | `app/platform/stores/[storeId]/shipping-methods/page.tsx`, `app/platform/stores/[storeId]/shipping/methods/page.tsx`, `app/api/platform/shipping/store-methods/route.ts` |
| **Logic applied** | Store shipping assignment APIs. |
| **If empty / no logic** | Keep for store enablement matrix. |

### 73. `store_shipping_providers`

| | |
|---|---|
| **Columns (8)** | id, store_id, provider_id, is_enabled, credentials, settings, created_at, updated_at |
| **Purpose** | Which providers a store enables + credentials/settings JSON. |
| **Where used** | `lib/shipping/resolveCredentials.ts`, `app/platform/stores/[storeId]/shipping/providers/page.tsx`, `app/api/store/shipping-methods/route.ts`, `app/api/shipping/methods/route.ts`, `app/api/shipping/create-shipment/route.ts`, `app/api/platform/shipping/store-providers/route.ts` |
| **Logic applied** | Store/provider assignment pages. |
| **If empty / no logic** | Align with shipping_provider_configs (may duplicate). |

### 74. `store_shipping_rates`

| | |
|---|---|
| **Columns (12)** | id, store_id, method_id, country_code, city, min_weight, max_weight, price, currency, is_active, created_at, updated_at |
| **Purpose** | Store-level shipping rates. |
| **Where used** | `app/platform/stores/[storeId]/shipping/rates/page.tsx` |
| **Logic applied** | Store rate management APIs/pages. |
| **If empty / no logic** | Keep if store overrides global rates. |

### 75. `store_shipping_settings`

| | |
|---|---|
| **Columns (7)** | id, store_id, free_shipping_threshold, flat_shipping_rate, international_shipping, created_at, updated_at |
| **Purpose** | Free shipping threshold, flat rate, international flags. |
| **Where used** | `lib/services/partner.service.ts`, `app/api/store-settings/route.ts` |
| **Logic applied** | Store settings shipping section. |
| **If empty / no logic** | Keep populated per store business rules. |

---

## Packaging

### 76. `order_packaging`

| | |
|---|---|
| **Columns (11)** | id, order_id, store_id, packaging_type_id, ribbon_id, total_package_weight_kg, packaging_cost, packaging_status, packed_by, packed_at, created_at |
| **Purpose** | Chosen packaging for a packed order. |
| **Where used** | `core/packaging-service/index.ts`, `app/platform/packaging/orders/page.tsx`, `app/api/platform/packaging/orders/route.ts` |
| **Logic applied** | packaging-service writes pack result + cost/weight. |
| **If empty / no logic** | Core order packing record — keep. |

### 77. `order_packaging_addons`

| | |
|---|---|
| **Columns (4)** | id, order_packaging_id, addon_id, quantity |
| **Purpose** | Addons used on an order_packaging row. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | No clear app inserts found. |
| **If empty / no logic** | Implement when packing UI selects addons, or leave empty intentionally documented. |

### 78. `packaging`

| | |
|---|---|
| **Columns (9)** | id, name, type, length, width, height, max_weight, price, is_active |
| **Purpose** | Older simple packaging dimensions table. |
| **Where used** | `lib/validations/packaging.ts`, `core/packaging-service/index.ts`, `app/store/[tenant]/packaging/stock/page.tsx`, `app/store/[tenant]/packaging/rules/page.tsx`, `app/store/[tenant]/packaging/adjustments/page.tsx`, `components/platform/Sidebar.tsx`, `app/store/[tenant]/orders/[orderId]/page.tsx`, `components/packaging/TenantRulesClient.tsx`, `components/packaging/StockClient.tsx`, `components/packaging/AdjustmentsClient.tsx`, `components/platform/packaging/types/PackagingTypesClient.tsx`, `components/platform/packaging/rules/RulesClient.tsx` (+35 more) |
| **Logic applied** | None (replaced by packaging_types). |
| **If empty / no logic** | Drop after migration check. |

### 79. `packaging_addons`

| | |
|---|---|
| **Columns (10)** | id, sku, name, addon_type, unit, cost_price, is_active, created_at, updated_at, description |
| **Purpose** | Add-on materials catalog. |
| **Where used** | `app/platform/packaging/addons/[addonId]/page.tsx`, `app/platform/packaging/addons/page.tsx`, `app/api/platform/packaging/addons/route.ts` |
| **Logic applied** | Platform addons API. |
| **If empty / no logic** | Core if addons used. |

### 80. `packaging_inventory_logs`

| | |
|---|---|
| **Columns (7)** | id, store_id, packaging_type_id, type, quantity_changed, reason, created_at |
| **Purpose** | Manual packaging stock adjustments log. |
| **Where used** | `app/store/[tenant]/packaging/adjustments/page.tsx`, `app/api/store/packaging/adjustments/route.ts` |
| **Logic applied** | Store packaging adjustments API. |
| **If empty / no logic** | Keep for inventory audit of manual fixes. |

### 81. `packaging_inventory_movements`

| | |
|---|---|
| **Columns (12)** | id, store_id, packaging_type_id, ribbon_id, addon_id, movement_type, quantity, reference_type, reference_id, notes, created_by, created_at |
| **Purpose** | System stock movements with references. |
| **Where used** | `core/packaging-service/index.ts` |
| **Logic applied** | packaging-service stock ops. |
| **If empty / no logic** | Core inventory ledger — keep. |

### 82. `packaging_ribbons`

| | |
|---|---|
| **Columns (10)** | id, sku, name, color, material, width_mm, cost_price, is_active, created_at, updated_at |
| **Purpose** | Ribbon catalog. |
| **Where used** | `app/api/platform/packaging/ribbons/route.ts`, `app/platform/packaging/orders/page.tsx`, `app/platform/packaging/ribbons/[ribbonId]/page.tsx`, `app/platform/packaging/ribbons/page.tsx` |
| **Logic applied** | Platform ribbons API + package records. |
| **If empty / no logic** | Core if ribbon stock used. |

### 83. `packaging_rules`

| | |
|---|---|
| **Columns (12)** | id, name, packaging_type_id, min_weight_kg, max_weight_kg, min_order_amount, max_order_amount, priority, is_active, created_at, updated_at, store_id |
| **Purpose** | Rules to pick packaging by weight/order amount/priority. |
| **Where used** | `core/packaging-service/index.ts`, `app/store/[tenant]/packaging/rules/page.tsx`, `app/api/store/packaging/rules/route.ts`, `app/platform/packaging/rules/page.tsx`, `app/api/platform/packaging/rules/route.ts` |
| **Logic applied** | packaging-service + platform/store rules UI. |
| **If empty / no logic** | Keep rules prioritized & active flags correct. |

### 84. `packaging_types`

| | |
|---|---|
| **Columns (16)** | id, sku, name, package_type, description, length_cm, width_cm, height_cm, empty_weight_kg, max_weight_kg, material, color, is_fragile, is_active, created_at, updated_at |
| **Purpose** | Master packaging boxes/types dimensions/weights. |
| **Where used** | `app/store/[tenant]/packaging/stock/page.tsx`, `app/store/[tenant]/packaging/rules/page.tsx`, `core/packaging-service/index.ts`, `app/store/[tenant]/packaging/adjustments/page.tsx`, `app/api/platform/packaging/types/route.ts`, `app/api/platform/packaging/rules/route.ts`, `app/platform/packaging/inventory/page.tsx`, `app/platform/packaging/orders/page.tsx`, `app/platform/packaging/rules/page.tsx`, `app/platform/packaging/types/page.tsx`, `app/platform/packaging/types/[typeId]/page.tsx` |
| **Logic applied** | Platform types CRUD + packaging-service selection. |
| **If empty / no logic** | Core packaging catalog — keep. |

### 85. `store_packaging_addon_inventory`

| | |
|---|---|
| **Columns (8)** | id, store_id, addon_id, quantity_available, minimum_threshold, damaged_quantity, created_at, updated_at |
| **Purpose** | Per-store addon stock. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | Inventory APIs for addons. |
| **If empty / no logic** | Keep if addon stock tracked. |

### 86. `store_packaging_inventory`

| | |
|---|---|
| **Columns (10)** | id, store_id, packaging_type_id, quantity_available, minimum_threshold, reserved_quantity, damaged_quantity, is_active, created_at, updated_at |
| **Purpose** | Per-store packaging type stock levels. |
| **Where used** | `core/packaging-service/index.ts`, `app/store/[tenant]/packaging/stock/page.tsx`, `app/store/[tenant]/packaging/adjustments/page.tsx`, `app/api/store/packaging/initialize/route.ts`, `app/api/store/packaging/adjustments/route.ts`, `app/platform/packaging/inventory/page.tsx`, `app/api/shipping/create-shipment/route.ts` |
| **Logic applied** | initialize/stock-in/adjust; create-shipment may consume. |
| **If empty / no logic** | Core — keep thresholds/qty accurate. |

### 87. `store_ribbon_inventory`

| | |
|---|---|
| **Columns (8)** | id, store_id, ribbon_id, quantity_available, minimum_threshold, damaged_quantity, created_at, updated_at |
| **Purpose** | Per-store ribbon stock. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | Ribbon inventory management. |
| **If empty / no logic** | Keep if ribbons stocked. |

---

## Billing

### 88. `billing_addresses`

| | |
|---|---|
| **Columns (12)** | billing_address_id, user_id, billingcity, billingzip, billingemail, billingfirstname, billinglastname, billingaddress, billingphone, country, created_at, updated_at |
| **Purpose** | User billing address for account. |
| **Where used** | `app/api/account-details/route.ts` |
| **Logic applied** | account-details API upsert/join. |
| **If empty / no logic** | Keep for account billing profile. |

### 89. `billing_audit_logs`

| | |
|---|---|
| **Columns (6)** | id, store_id, actor_id, action, metadata, created_at |
| **Purpose** | Billing/subscription plan change audit. |
| **Where used** | `app/platform/billing/actions.ts` |
| **Logic applied** | Inserted when plan assigned in billing actions. |
| **If empty / no logic** | Keep; activity log includes it. |

### 90. `invoices`

| | |
|---|---|
| **Columns (5)** | id, store_id, amount_cents, status, issued_at |
| **Purpose** | Platform invoices for store fees. |
| **Where used** | `core/common/sidebar/two-column/index.tsx`, `components/dashboard/SalesAndTransactions.tsx`, `app/platform/billing/page.tsx`, `app/platform/billing/invoices/page.tsx`, `app/platform/billing/actions.ts` |
| **Logic applied** | Billing invoices page list/count. |
| **If empty / no logic** | Keep; ensure issue pipeline writes rows if billing live. |

### 91. `plans`

| | |
|---|---|
| **Columns (7)** | id, name, price_cents, interval, features, is_active, created_at |
| **Purpose** | SaaS subscription plans for stores. |
| **Where used** | `lib/services/platformDashboard.ts`, `lib/services/partner.service.ts`, `components/platform/billing/StorePlanSelectorClient.tsx`, `components/platform/billing/StorePlanSelector.tsx`, `app/platform/stores/[storeId]/page.tsx`, `app/platform/stores/StorePlanSection.tsx`, `app/platform/billing/plans/page.tsx`, `app/platform/billing/page.tsx`, `app/platform/billing/actions.ts` |
| **Logic applied** | Billing UI plan list/assign. |
| **If empty / no logic** | Keep catalogue of commercial plans. |

### 92. `store_subscription`

| | |
|---|---|
| **Columns (7)** | id, store_id, plan_name, status, renewal_date, created_at, updated_at |
| **Purpose** | Alternate/simple subscription row per store. |
| **Where used** | `app/api/store-settings/route.ts` |
| **Logic applied** | May duplicate subscriptions partially. |
| **If empty / no logic** | Consolidate with subscriptions to avoid double sources. |

### 93. `subscriptions`

| | |
|---|---|
| **Columns (6)** | id, store_id, plan_id, status, current_period_end, updated_at |
| **Purpose** | Store ↔ plan subscription state. |
| **Where used** | `lib/services/partner.service.ts`, `lib/services/platformDashboard.ts`, `components/platform/stores/actions.ts`, `components/platform/billing/StorePlanSelector.tsx`, `app/platform/stores/[storeId]/page.tsx`, `app/platform/billing/actions.ts` |
| **Logic applied** | Assign/cancel in billing actions; partner provision may attach plan. |
| **If empty / no logic** | Core SaaS billing — keep status in sync. |

---

## Tax

### 94. `category_tax_mappings`

| | |
|---|---|
| **Columns (2)** | category_id, tax_rule_id |
| **Purpose** | Maps categories to tax rules. |
| **Where used** | `app/api/tax-rules/route.ts` |
| **Logic applied** | tax-rules category mapping. |
| **If empty / no logic** | Keep for category-specific VAT. |

### 95. `platform_tax_rules`

| | |
|---|---|
| **Columns (9)** | id, country_code, state_code, tax_name, tax_rate, is_active, created_at, updated_at, category_id |
| **Purpose** | Country (and optional state/category) tax rates. |
| **Where used** | `app/api/tax-rules/route.ts`, `app/api/tax-rules/import/route.ts` |
| **Logic applied** | tax-rules API + import templates. |
| **If empty / no logic** | Core tax engine input — keep for each market. |

### 96. `store_tax_settings`

| | |
|---|---|
| **Columns (8)** | id, store_id, tax_name, tax_rate, tax_inclusive, tax_registration_number, created_at, updated_at |
| **Purpose** | Default tax name/rate/inclusive flags per store. |
| **Where used** | `lib/services/partner.service.ts`, `app/api/store-settings/route.ts` |
| **Logic applied** | store-settings read/write. |
| **If empty / no logic** | Keep store tax defaults populated. |

---

## Recipes & CMS

### 97. `blogs`

| | |
|---|---|
| **Columns (13)** | blog_id, title, slug, excerpt, content, featured_image_id, status, author_id, created_at, updated_at, meta_title, meta_description, published_at |
| **Purpose** | Blog posts CMS. |
| **Where used** | `components/blogs/EditBlogForm.tsx`, `components/blogs/CreateBlogForm.tsx`, `components/blogs/blogsList.tsx`, `components/blogs/BlogCard.tsx`, `app/store/[tenant]/blogs/[id]/edit/page.tsx`, `app/store/[tenant]/blogs/page.tsx`, `app/store/[tenant]/blogs/create/page.tsx`, `app/api/blogs/route.ts` |
| **Logic applied** | blogs API + store blog pages. |
| **If empty / no logic** | Keep for content marketing. |

### 98. `recipe_categories`

| | |
|---|---|
| **Columns (9)** | id, name, slug, description, image_url, is_active, sort_order, created_at, updated_at |
| **Purpose** | Recipe categories. |
| **Where used** | `app/api/recipe-categories/route.ts`, `app/api/recipe-categories/[id]/route.ts`, `app/platform/analytics/page.tsx`, `app/platform/recipes/page.tsx` |
| **Logic applied** | recipe-categories API. |
| **If empty / no logic** | Keep. |

### 99. `recipe_favorites`

| | |
|---|---|
| **Columns (5)** | id, tenant_id, recipe_id, customer_id, created_at |
| **Purpose** | Customer favorites of recipes. |
| **Where used** | `app/platform/analytics/page.tsx` |
| **Logic applied** | analytics; storefront favorites if app exists. |
| **If empty / no logic** | Keep for personalization metrics. |

### 100. `recipe_recipe_tags`

| | |
|---|---|
| **Columns (2)** | recipe_id, tag_id |
| **Purpose** | Recipe ↔ tag M2M. |
| **Where used** | `components/platform/recipes/actions.ts`, `app/platform/recipes/[recipeId]/page.tsx`, `app/api/recipes/[id]/tags/route.ts`, `app/api/recipe-tags/[id]/route.ts`, `app/api/recipe-tags/route.ts`, `app/api/recipe-tags/assign/route.ts`, `app/api/recipe-tags/assign/bulk/route.ts` |
| **Logic applied** | assign APIs. |
| **If empty / no logic** | Keep. |

### 101. `recipe_tags`

| | |
|---|---|
| **Columns (6)** | id, name, slug, created_at, color, is_active |
| **Purpose** | Recipe tags. |
| **Where used** | `components/platform/recipes/actions.ts`, `app/api/recipes/[id]/tags/route.ts`, `app/api/recipe-tags/[id]/route.ts`, `app/api/recipe-tags/route.ts`, `app/api/recipe-tags/assign/route.ts`, `app/api/recipe-tags/reorder/route.ts`, `app/api/recipe-tags/assign/bulk/route.ts`, `app/platform/recipes/[recipeId]/page.tsx` |
| **Logic applied** | tags CRUD + reorder + assign. |
| **If empty / no logic** | Keep. |

### 102. `recipe_views`

| | |
|---|---|
| **Columns (6)** | id, tenant_id, recipe_id, ip_address, user_agent, viewed_at |
| **Purpose** | View analytics per recipe. |
| **Where used** | `app/platform/analytics/page.tsx` |
| **Logic applied** | platform analytics aggregation. |
| **If empty / no logic** | Keep if analytics needed; optional privacy retention policy. |

### 103. `recipes`

| | |
|---|---|
| **Columns (25)** | id, tenant_id, category_id, title, slug, short_description, content, youtube_url, youtube_video_id, thumbnail_url, preparation_time, cooking_time, servings, difficulty, seo_title, seo_description, seo_keywords, status, is_featured, published_at, total_views, created_by, created_at, updated_at, customer_id |
| **Purpose** | Recipe CMS content. |
| **Where used** | `components/platform/Sidebar.tsx`, `components/platform/recipes/YoutubePreview.tsx`, `components/platform/recipes/tags/RecipeTagSelector.tsx`, `components/platform/recipes/tags/RecipeTagOrder.tsx`, `components/platform/recipes/tags/BulkRecipeTagEditor.tsx`, `components/platform/recipes/RecipesClient.tsx`, `components/platform/recipes/RecipeCard.tsx`, `components/platform/recipes/FiltersBar.tsx`, `components/platform/recipes/categories/RecipeCategoriesList.tsx`, `components/platform/recipes/categories/FiltersBar.tsx`, `components/platform/recipes/actions.ts`, `app/platform/analytics/page.tsx` (+11 more) |
| **Logic applied** | Full platform recipes CRUD, SEO, featured, publish. |
| **If empty / no logic** | Core content — keep. |

---

## CMS & Media

### 104. `media`

| | |
|---|---|
| **Columns (10)** | media_id, file_name, file_url, file_type, width, height, size, alt_text, created_at, uploaded_by |
| **Purpose** | Media library (files uploaded via admin). |
| **Where used** | `components/store-settings/manage-settings.tsx`, `components/orders/FilterBar.tsx`, `components/media/MediaFilterBar.tsx`, `components/media/FeaturedImageUpload.tsx`, `components/blogs/EditBlogForm.tsx`, `components/blogs/CreateBlogForm.tsx`, `core/email-templates.ts`, `components/products/utils/getThumb.ts`, `components/products/tabs/ProductImagesTab.tsx`, `components/products/ProductForm.tsx`, `core/json/siderbar_data.tsx`, `core/json/sidebar_dataone.tsx` (+15 more) |
| **Logic applied** | media APIs + uploadthing saves metadata. |
| **If empty / no logic** | Keep as media source of truth. |

### 105. `media2`

| | |
|---|---|
| **Columns (10)** | media_id, file_name, file_url, file_type, width, height, size, alt_text, created_at, uploaded_by |
| **Purpose** | Media library duplicate. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Drop after reconcile with media. |

---

## Chatbot (unused in admin)

### 106. `bibi_chatbot_knowledge_view`

| | |
|---|---|
| **Columns (16)** | source_type, source_table, source_id, tenant_id, title, slug, page_url, category_name, tags, content, image_url, video_url, status, is_featured, published_at, updated_at |
| **Purpose** | Unified knowledge view for chatbot RAG/search. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | View only; not queried from this admin repo. |
| **If empty / no logic** | Used by chatbot service if separate; do not drop without checking that service. |

### 107. `chatbot_recipes`

| | |
|---|---|
| **Columns (8)** | recipe_id, title, slug, recipe_url, short_description, category_name, tags, youtube_url |
| **Purpose** | Denormalized recipes for chatbot. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None in admin. |
| **If empty / no logic** | Keep only if chatbot apps depend on it; else pipeline from recipes. |

### 108. `chatbot_recipes_2`

| | |
|---|---|
| **Columns (8)** | recipe_id, title, slug, recipe_url, short_description, category_name, tags, youtube_url |
| **Purpose** | Alt denormalized recipes for chatbot. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Collapse duplicates; one export table. |

### 109. `chatbot_store_products`

| | |
|---|---|
| **Columns (9)** | product_id, name, slug, product_url, description, price, brand_name, category_name, primary_image_url |
| **Purpose** | Denormalized products for chatbot answers. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None in admin. |
| **If empty / no logic** | Keep if chatbot uses; refresh from store_products regularly. |

### 110. `chatbot_store_products_2`

| | |
|---|---|
| **Columns (6)** | id, name, slug, description, price, health_benefits |
| **Purpose** | Alt chatbot product feed. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Deduplicate with chatbot_store_products. |

### 111. `chatbot_store_products_legacy`

| | |
|---|---|
| **Columns (6)** | id, name, slug, description, price, health_benefits |
| **Purpose** | Legacy chatbot product feed. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Archive/drop. |

---

## Geo & Currency

### 112. `cities`

| | |
|---|---|
| **Columns (10)** | id_city, city, state_id, is_default, is_active, sort_order, lang, created_at, updated_at, country_id |
| **Purpose** | City directory. |
| **Where used** | `core/common/sidebar/two-column/index.tsx`, `core/json/siderbar_data.tsx`, `core/json/sidebar_dataone.tsx`, `app/store/[tenant]/orders/[orderId]/page.tsx` |
| **Logic applied** | Sidebar/routes exist historically; no SQL in admin found. |
| **If empty / no logic** | Populate if address autocomplete needs it; else drop/implement. |

### 113. `cities_bkup`

| | |
|---|---|
| **Columns (10)** | id_city, city, state_id, is_default, is_active, sort_order, lang, created_at, updated_at, country_id |
| **Purpose** | Cities backup. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Drop after verify. |

### 114. `countries`

| | |
|---|---|
| **Columns (10)** | country_id, country_name, country_code, dial_code, currency_name, currency_symbol, currency_code, country_status, is_shippable, currency_id |
| **Purpose** | Sellable/shipping countries and currency link. |
| **Where used** | `components/tax/taxList.tsx`, `core/common/sidebar/collapsedSidebar.tsx`, `components/store-settings/manage-settings.tsx`, `core/common/selectOption/selectOption.tsx`, `components/shipping/store/StoreRatesClient.tsx`, `components/products-catalog/FilterBar.tsx`, `components/products/ProductForm.tsx`, `components/products/addproduct.tsx`, `app/api/countries/route.ts`, `components/platform/shipping/RatesManager.tsx`, `app/api/country-currencies/route.ts`, `app/api/tax-rules/import/route.ts` (+11 more) |
| **Logic applied** | countries API, currency map, product countries, tax import. |
| **If empty / no logic** | Core geo master — keep is_shippable accurate. |

### 115. `countries2`

| | |
|---|---|
| **Columns (32)** | id, name, iso3, numeric_code, iso2, phonecode, capital, currency, currency_name, currency_symbol, tld, native, population, gdp, region, region_id, subregion, subregion_id, nationality, area_sq_km, postal_code_format, postal_code_regex, timezones, translations, latitude, longitude, emoji, emojiU, created_at, updated_at, flag, wikiDataId |
| **Purpose** | Rich world-countries dataset (ISO/geo extras). |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None in admin. |
| **If empty / no logic** | Optional enrichment seed; or drop if countries is enough. |

### 116. `currencies`

| | |
|---|---|
| **Columns (8)** | id, code, name, symbol, decimal_places, is_active, is_base, created_at |
| **Purpose** | Currency master (code, symbol, base flag). |
| **Where used** | `components/store-settings/manage-settings.tsx`, `components/platform/currency-rates/CurrencyRates.tsx`, `components/platform/Sidebar.tsx`, `components/platform/currencies/CurrencyList.tsx`, `components/platform/country-currencies/CountryCurrencies.tsx`, `app/platform/currencies/page.tsx`, `app/platform/country-currencies/page.tsx`, `app/api/store-currency/route.ts`, `app/api/country-currencies/route.ts`, `app/api/currencies/convert/route.ts`, `app/api/currencies/[id]/route.ts`, `app/api/currencies/route.ts` (+2 more) |
| **Logic applied** | currency CRUD APIs. |
| **If empty / no logic** | Core — one is_base currency only. |

### 117. `currency_rates`

| | |
|---|---|
| **Columns (5)** | id, base_currency_id, target_currency_id, rate, updated_at |
| **Purpose** | FX conversion rates between currencies. |
| **Where used** | `app/api/currency-rates/[id]/route.ts`, `app/api/currency-rates/route.ts`, `app/api/currencies/rate/route.ts`, `app/api/currencies/convert/route.ts` |
| **Logic applied** | rates API + convert route. |
| **If empty / no logic** | Keep rates updated if multi-currency live. |

### 118. `states`

| | |
|---|---|
| **Columns (6)** | id_state, state, country_id, is_active, sort_order, lang |
| **Purpose** | States/provinces. |
| **Where used** | `core/common/sidebar/collapsedSidebar.tsx`, `core/common/sidebar/two-column/index.tsx`, `core/json/siderbar_data.tsx`, `core/json/sidebar_dataone.tsx`, `components/orders/FilterBar.tsx`, `app/api/orders/[orderId]/allocate/route.ts`, `app/platform/returns/page.tsx`, `app/platform/media/page.tsx` |
| **Logic applied** | No admin SQL found. |
| **If empty / no logic** | Implement for US-like markets or drop. |

### 119. `states_bkup`

| | |
|---|---|
| **Columns (6)** | id_state, state, country_id, is_active, sort_order, lang |
| **Purpose** | States backup. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None. |
| **If empty / no logic** | Drop after verify. |

### 120. `store_currency_settings`

| | |
|---|---|
| **Columns (6)** | id, store_id, base_currency_id, allow_multi_currency, created_at, updated_at |
| **Purpose** | Store base currency and multi-currency flag. |
| **Where used** | `app/api/store-currency/route.ts` |
| **Logic applied** | store currency settings APIs. |
| **If empty / no logic** | Keep for multi-currency stores. |

### 121. `temp_city_import`

| | |
|---|---|
| **Columns (2)** | country_name, city_name |
| **Purpose** | Temporary staging for city import. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | Import staging only. |
| **If empty / no logic** | Empty after import; truncate when idle; not production runtime table. |

---

## Store Config

### 122. `store_branding`

| | |
|---|---|
| **Columns (10)** | id, store_id, logo_url, favicon_url, banner_url, primary_color, secondary_color, theme_mode, created_at, updated_at |
| **Purpose** | Logo, colors, theme. |
| **Where used** | `app/api/store-settings/route.ts` |
| **Logic applied** | May be storefront theming; light admin use. |
| **If empty / no logic** | Implement theme admin or feed storefront only. |

### 123. `store_localization`

| | |
|---|---|
| **Columns (8)** | id, store_id, country_id, timezone, currency_code, language, created_at, updated_at |
| **Purpose** | Country, timezone, language, currency_code per store. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | Store localization config. |
| **If empty / no logic** | Align with store_settings to avoid conflicting fields. |

### 124. `store_payment_settings`

| | |
|---|---|
| **Columns (8)** | id, store_id, stripe_enabled, stripe_account_id, razorpay_enabled, cod_enabled, created_at, updated_at |
| **Purpose** | Payment gateway toggles (Stripe/Razorpay/COD). |
| **Where used** | `lib/services/partner.service.ts`, `app/api/store-settings/route.ts` |
| **Logic applied** | Payment settings storage. |
| **If empty / no logic** | Populate when payments go live; secure account IDs. |

### 125. `store_promo_codes`

| | |
|---|---|
| **Columns (12)** | id, code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, usage_count, starts_at, expires_at, status, created_at |
| **Purpose** | Promo codes with limits and windows. |
| **Where used** | `app/api/products/promos/route.ts` |
| **Logic applied** | Likely checkout path; low admin surface may exist. |
| **If empty / no logic** | Admin CRUD if missing; enforce usage_count limits. |

### 126. `store_seo_settings`

| | |
|---|---|
| **Columns (9)** | id, store_id, meta_title, meta_description, meta_keywords, facebook_pixel_id, google_analytics_id, created_at, updated_at |
| **Purpose** | Meta + analytics/pixel IDs. |
| **Where used** | `app/api/store-settings/route.ts` |
| **Logic applied** | SEO settings storage. |
| **If empty / no logic** | Keep for marketing tags on storefront. |

### 127. `store_working_hours`

| | |
|---|---|
| **Columns (6)** | id, store_id, day_of_week, open_time, close_time, is_closed |
| **Purpose** | Open/close times per weekday. |
| **Where used** | `core/order-routing/index.ts`, `lib/order-routing.ts`, `app/api/store-settings/route.ts` |
| **Logic applied** | Store hours config. |
| **If empty / no logic** | Use for SLA/routing timeouts messaging or storefront display. |

---

## Notifications

### 128. `newsletter_subscribers`

| | |
|---|---|
| **Columns (5)** | id, email, status, subscribed_at, unsubscribed_at |
| **Purpose** | Email newsletter list. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None in admin. |
| **If empty / no logic** | Wire subscribe API + export or drop. |

### 129. `user_notification_preferences`

| | |
|---|---|
| **Columns (9)** | user_id, push_enabled, order_updates, recipe_reel_updates, new_products, price_drops, restock_alerts, promotional_emails, updated_at |
| **Purpose** | What messages user wants. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None in admin. |
| **If empty / no logic** | Needed before marketing push features. |

### 130. `user_notifications`

| | |
|---|---|
| **Columns (8)** | id, user_id, type, title, body, data, is_read, created_at |
| **Purpose** | In-app/user notifications. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | No strong admin wiring found. |
| **If empty / no logic** | Implement push of order events or drop. |

### 131. `user_push_tokens`

| | |
|---|---|
| **Columns (6)** | id, user_id, token, platform, created_at, last_seen_at |
| **Purpose** | Mobile push tokens. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | None in admin. |
| **If empty / no logic** | Mobile app concern — retain if apps register tokens. |

---

## PostgreSQL System

### 132. `pg_stat_statements`

| | |
|---|---|
| **Columns (49)** | userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since |
| **Purpose** | Postgres extension: query performance stats. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | DB only; not application data. |
| **If empty / no logic** | Ops tooling only — do not treat as business table; do not drop extension carelessly. |

### 133. `pg_stat_statements_info`

| | |
|---|---|
| **Columns (2)** | dealloc, stats_reset |
| **Purpose** | Extension metadata for pg_stat_statements. |
| **Where used** | _No references found in this admin codebase_ |
| **Logic applied** | DB only. |
| **If empty / no logic** | Ops only. |

---

## Recommended cleanup priorities

### Safe to archive/drop after backup (high confidence unused in this app)

- Backup copies: `cities_bkup`, `states_bkup`, `customers-old`, `store_products_110626`, `store_product_prices_110626`, `store_product_images_bkup_20260610`, `store_products2`, `store_product_images2`, `users-2`, `media2`, `products-2`, `products3`, `product_images-2`, `chatbot_store_products_legacy`
- Superseded names: `brand` → `store_brands`; `categories`/`subcategories` → `store_*`; `packaging` → `packaging_types`; `order_items` → `store_order_items`
- Temp: `temp_city_import` (truncate after imports)

### Dual-path tech debt (still referenced — clean carefully)

1. `products` vs `store_products` (related/random product APIs)
2. `customers`/`customer_addresses`/`orders` vs `store_*` customer/order model
3. `shipping_provider_credentials` vs `shipping_provider_configs`
4. `subscriptions` vs `store_subscription`
5. `product_reviews` vs `store_product_reviews`
6. `shipping_labels` / `shipment_events` vs data currently stored on `shipments`

### Features present in schema but not fully implemented in admin

| Table | Suggested work |
|---|---|
| `password_reset_tokens` | Finish forgot-password API + email |
| `email_change_tokens` | Secure email change confirmation |
| `login_audit` | Log successful/failed logins for security |
| `shipment_events` | Persist provider tracking webhooks/history |
| `shipping_labels` | Multi-label history if needed |
| `order_packaging_addons` | Write addon qty when packing |
| `newsletter_subscribers` | Admin list + export |
| `user_notifications*` / `user_push_tokens` | Notification center + mobile push |
| `wishlists` | Storefront favorites sync / admin insight |
| Chatbot denormalized tables | Scheduled ETL from `recipes`/`store_products` or drop |

### System objects (do not manage as business data)

`pg_stat_statements`, `pg_stat_statements_info` — PostgreSQL performance extension views.

---

*Note: “Where used” is based on string matches in this admin repository. Storefront, mobile, or chatbot services may still depend on tables marked unused here.*
