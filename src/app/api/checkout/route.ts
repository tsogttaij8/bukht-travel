import { createPendingOrder } from "../../../lib/server/cart-store"
import { commerceError, fail, ok } from "../../../lib/server/api-response"
import { readSessionFromCookieHeader } from "../../../lib/server/session"
export async function POST(request:Request){const session=readSessionFromCookieHeader(request.headers.get("cookie")??"");if(!session)return fail("UNAUTHORIZED","Нэвтэрнэ үү.",401);try{return ok(await createPendingOrder(session.email),201)}catch(error){return commerceError(error)}}
