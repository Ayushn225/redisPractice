import { pool } from "../db/pool";
import {
  Product,
  ProductRow,
  CreateProductInput,
  UpdateProductInput,
} from "../types/product";
import redisClient from "../redis/client";

const PRODUCTS_ALL_CACHE_KEY = "products:all";
const PRODUCTS_TTL_SECONDS =  60;

async function deleteProductsAllCache(): Promise<void>{
  await redisClient.del(PRODUCTS_ALL_CACHE_KEY);
  console.log("all products cache deleted");
}

async function deleteProductById(id: number): Promise<void>{
  const keyword = `product:id:${id}`;
  await redisClient.del(keyword);
  console.log("deleted by id successfully");
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    stock: row.stock,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function fetchAllProducts(filters: {
  category?: string;
  search?: string;
}): Promise<Product[]> {
  let query = "SELECT * FROM products WHERE 1=1";
  const values: string[] = [];

  if (filters.category) {
    values.push(filters.category);
    query += ` AND LOWER(category) = LOWER($${values.length})`;
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    query += ` AND (LOWER(name) LIKE LOWER($${values.length}) OR LOWER(description) LIKE LOWER($${values.length}))`;
  }

  query += " ORDER BY id ASC";

  const result = await pool.query<ProductRow>(query, values);
  return result.rows.map(mapProductRow);
}

export async function getAllProducts(filters: {
  category?: string;
  search?: string;
}): Promise<Product[]> {

  const hasFilters = Boolean(filters?.category || filters?.search)
  if(hasFilters){
    console.log("cache bypass");
    return fetchAllProducts(filters);
  }

  const cacheProducts = await redisClient.get(PRODUCTS_ALL_CACHE_KEY);

  if(!cacheProducts){

    console.log("cache miss");
    const products = await fetchAllProducts(filters);

    await redisClient.setEx(PRODUCTS_ALL_CACHE_KEY, PRODUCTS_TTL_SECONDS, JSON.stringify(products));

    return products;

  }else{
    console.log("cache hit");

    return JSON.parse(cacheProducts) as Product[];
  }
}

export async function fetchProductById(id: number): Promise<Product | null> {
  const result = await pool.query<ProductRow>(
    "SELECT * FROM products WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapProductRow(result.rows[0]);
}

export async function getProductById(id: number): Promise<Product | null> {
  const keyword = `product:id:${id}`;
  const cachedProduct = await redisClient.get(keyword);
  if(cachedProduct){
    console.log("by id cache hit");
    return JSON.parse(cachedProduct) as Product;
  }

  console.log("by id cache miss");
  const result = await fetchProductById(id);
  if(!result){
    console.log("no product");
    return null;
  }
  await redisClient.setEx(keyword, PRODUCTS_TTL_SECONDS, JSON.stringify(result));

  return result;
}

export async function createProduct(
  input: CreateProductInput
): Promise<Product> {
  const result = await pool.query<ProductRow>(
    `INSERT INTO products (name, description, price, category, stock)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.name, input.description, input.price, input.category, input.stock]
  );

  const newProduct =  mapProductRow(result.rows[0]);

  await deleteProductsAllCache();

  return newProduct;
}

export async function updateProduct(
  id: number,
  input: UpdateProductInput
): Promise<Product | null> {
  const existing = await getProductById(id);
  if (!existing) {
    return null;
  }

  const name = input.name ?? existing.name;
  const description = input.description ?? existing.description;
  const price = input.price ?? existing.price;
  const category = input.category ?? existing.category;
  const stock = input.stock ?? existing.stock;

  const result = await pool.query<ProductRow>(
    `UPDATE products
     SET name = $1,
         description = $2,
         price = $3,
         category = $4,
         stock = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [name, description, price, category, stock, id]
  );

  const updatedProduct = mapProductRow(result.rows[0]);

  await deleteProductsAllCache();

  await deleteProductById(id);

  return updatedProduct;
}
