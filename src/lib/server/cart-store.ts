import { randomUUID } from "node:crypto"
import type { Cart, CartItem } from "../commerce-types"
import { getDb } from "./db"
import { getProduct } from "./product-store"
import { getSupabaseAdmin, isSupabaseEnabled } from "./supabase"

type JoinedRow = { id: string; product_id: string; quantity: number; products: { name: string; price: string; image_url: string; seller_name: string } | null }

function money(price: string): { value: number; currency: string } {
  const normalized = price.replace(/,/g, "")
  const value = Number(normalized.match(/\d+(?:\.\d+)?/)?.[0] ?? 0)
  const currency = /(?:USD|\$)/i.test(price) ? "USD" : /CNY|¥|元/i.test(price) ? "CNY" : "MNT"
  return { value: Number.isFinite(value) ? value : 0, currency }
}

function shape(id: string | null, rows: JoinedRow[]): Cart {
  const currencies = new Set<string>()
  const items: CartItem[] = rows.map((row) => {
    const product = row.products
    const parsed = money(product?.price ?? "0")
    currencies.add(parsed.currency)
    return { id: row.id, productId: row.product_id, name: product?.name ?? "Устсан бараа", imageUrl: product?.image_url ?? "", sellerName: product?.seller_name ?? "", unitPrice: parsed.value, formattedPrice: product?.price ?? "", currency: parsed.currency, quantity: row.quantity, subtotal: parsed.value * row.quantity, available: Boolean(product) }
  })
  const currency = currencies.size === 1 ? Array.from(currencies)[0] : currencies.size ? "MIXED" : "MNT"
  return { id, items, totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0), total: items.reduce((sum, item) => sum + item.subtotal, 0), currency }
}

export async function readCart(email: string): Promise<Cart> {
  email = email.toLowerCase()
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    const { data: cart, error } = await supabase.from("carts").select("id").eq("user_email", email).eq("status", "active").maybeSingle()
    if (error) throw error
    if (!cart) return shape(null, [])
    const { data, error: itemError } = await supabase.from("cart_items").select("id, product_id, quantity, products(name,price,image_url,seller_name)").eq("cart_id", cart.id).order("created_at")
    if (itemError) throw itemError
    return shape(cart.id, (data ?? []) as unknown as JoinedRow[])
  }
  const db = await getDb()
  const cart = await db.query<{ id: string }>("SELECT id FROM carts WHERE user_email=$1 AND status='active' LIMIT 1", [email])
  if (!cart.rows[0]) return shape(null, [])
  const result = await db.query<JoinedRow>(`SELECT ci.id,ci.product_id,ci.quantity,json_build_object('name',p.name,'price',p.price,'image_url',p.image_url,'seller_name',p.seller_name) products FROM cart_items ci LEFT JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=$1 ORDER BY ci.created_at`, [cart.rows[0].id])
  return shape(cart.rows[0].id, result.rows)
}

export async function addCartItem(email: string, productId: string, quantity: number): Promise<Cart> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("INVALID_QUANTITY")
  email = email.toLowerCase()
  const product = await getProduct(productId)
  if (!product) throw new Error("PRODUCT_UNAVAILABLE")
  if (product.sellerEmail.toLowerCase() === email) throw new Error("OWN_PRODUCT")
  const now = new Date().toISOString()
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin()
    let { data: cart } = await supabase.from("carts").select("id").eq("user_email", email).eq("status", "active").maybeSingle()
    if (!cart) { const created = { id: randomUUID(), user_email: email, status: "active", created_at: now, updated_at: now }; const result = await supabase.from("carts").insert(created).select("id").single(); if (result.error) throw result.error; cart = result.data }
    const existing = await supabase.from("cart_items").select("id,quantity").eq("cart_id", cart.id).eq("product_id", productId).maybeSingle()
    if (existing.error) throw existing.error
    const result = existing.data ? await supabase.from("cart_items").update({ quantity: existing.data.quantity + quantity, updated_at: now }).eq("id", existing.data.id) : await supabase.from("cart_items").insert({ id: randomUUID(), cart_id: cart.id, product_id: productId, quantity, created_at: now, updated_at: now })
    if (result.error) throw result.error
  } else {
    const db = await getDb(); const cartId = randomUUID()
    await db.query(`INSERT INTO carts(id,user_email,status,created_at,updated_at) VALUES($1,$2,'active',$3,$3) ON CONFLICT (user_email) WHERE status='active' DO UPDATE SET updated_at=EXCLUDED.updated_at`, [cartId,email,now])
    const cart = await db.query<{ id: string }>("SELECT id FROM carts WHERE user_email=$1 AND status='active'", [email])
    await db.query(`INSERT INTO cart_items(id,cart_id,product_id,quantity,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$5) ON CONFLICT(cart_id,product_id) DO UPDATE SET quantity=cart_items.quantity+EXCLUDED.quantity,updated_at=EXCLUDED.updated_at`, [randomUUID(),cart.rows[0].id,productId,quantity,now])
  }
  return readCart(email)
}

export async function updateCartItem(email: string, itemId: string, quantity: number): Promise<Cart> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("INVALID_QUANTITY")
  const cart = await readCart(email); if (!cart.items.some((item) => item.id === itemId)) throw new Error("NOT_FOUND")
  if (isSupabaseEnabled()) { const { error } = await getSupabaseAdmin().from("cart_items").update({ quantity, updated_at: new Date().toISOString() }).eq("id", itemId).eq("cart_id", cart.id!); if (error) throw error }
  else { const db=await getDb(); await db.query("UPDATE cart_items SET quantity=$1,updated_at=$2 WHERE id=$3 AND cart_id=$4",[quantity,new Date().toISOString(),itemId,cart.id]) }
  return readCart(email)
}

export async function removeCartItem(email: string, itemId: string): Promise<Cart> {
  const cart=await readCart(email); if (!cart.items.some((item)=>item.id===itemId)) throw new Error("NOT_FOUND")
  if(isSupabaseEnabled()){const {error}=await getSupabaseAdmin().from("cart_items").delete().eq("id",itemId).eq("cart_id",cart.id!);if(error)throw error}
  else {const db=await getDb();await db.query("DELETE FROM cart_items WHERE id=$1 AND cart_id=$2",[itemId,cart.id])}
  return readCart(email)
}

export async function createPendingOrder(email: string) {
  const cart=await readCart(email); if(!cart.items.length) throw new Error("EMPTY_CART"); if(cart.items.some((item)=>!item.available)) throw new Error("PRODUCT_UNAVAILABLE"); if(cart.currency==="MIXED") throw new Error("MIXED_CURRENCY")
  const id=randomUUID(), now=new Date().toISOString()
  if(isSupabaseEnabled()){const supabase=getSupabaseAdmin();const {error}=await supabase.from("commerce_orders").insert({id,user_email:email.toLowerCase(),status:"pending_payment",total:cart.total,currency:cart.currency,created_at:now,updated_at:now});if(error)throw error;const result=await supabase.from("commerce_order_items").insert(cart.items.map(item=>({id:randomUUID(),order_id:id,product_id:item.productId,product_name:item.name,unit_price:item.unitPrice,currency:item.currency,quantity:item.quantity})));if(result.error)throw result.error}
  else {const db=await getDb();await db.query("INSERT INTO commerce_orders(id,user_email,status,total,currency,created_at,updated_at) VALUES($1,$2,'pending_payment',$3,$4,$5,$5)",[id,email.toLowerCase(),cart.total,cart.currency,now]);for(const item of cart.items)await db.query("INSERT INTO commerce_order_items(id,order_id,product_id,product_name,unit_price,currency,quantity) VALUES($1,$2,$3,$4,$5,$6,$7)",[randomUUID(),id,item.productId,item.name,item.unitPrice,item.currency,item.quantity])}
  return { id, status:"pending_payment" as const, total:cart.total, currency:cart.currency, paymentConfigured:false }
}
