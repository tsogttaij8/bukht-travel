import { readCart } from "../../../lib/server/cart-store"
import { commerceError, fail, ok } from "../../../lib/server/api-response"
import { readSessionFromCookieHeader } from "../../../lib/server/session"
export const dynamic="force-dynamic"
export async function GET(request:Request){const session=readSessionFromCookieHeader(request.headers.get("cookie")??"");if(!session)return fail("UNAUTHORIZED","Нэвтэрнэ үү.",401);try{return ok(await readCart(session.email))}catch(error){return commerceError(error)}}
