import { addCartItem } from "../../../../lib/server/cart-store"
import { commerceError, fail, ok } from "../../../../lib/server/api-response"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"
export async function POST(request:Request){const session=readSessionFromCookieHeader(request.headers.get("cookie")??"");if(!session)return fail("UNAUTHORIZED","Нэвтэрнэ үү.",401);try{const body=await request.json() as {productId?:string;quantity?:number};if(!body.productId)return fail("INVALID_PRODUCT","Бараа сонгоно уу.",400);return ok(await addCartItem(session.email,body.productId,body.quantity??1),201)}catch(error){return commerceError(error)}}
