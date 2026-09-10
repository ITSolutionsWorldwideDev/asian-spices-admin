// core/types/catalog.ts

export type CatalogProduct = {
  product_id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;


  base_price: number;
  store_price?: number;
  effective_price: number;

  quantity?: number;
  status?: number;

  /** The master product's own status (1 = active). Used to flag incomplete products. */
  product_status?: number;
  /** Whether the master product has at least one image. Used to flag incomplete products. */
  has_image?: boolean;

  is_overridden: boolean;
  assigned: boolean;
  is_assigned: boolean;
};