import { openConversation } from "../../../lib/server/chat-store"
import { commerceError, fail, ok } from "../../../lib/server/api-response"
import { readSessionFromCookieHeader } from "../../../lib/server/session"
export async function POST(request:Request){const session=readSessionFromCookieHeader(request.headers.get("cookie")??"");if(!session)return fail("UNAUTHORIZED","Нэвтэрнэ үү.",401);try{const body=await request.json() as {productId?:string};if(!body.productId)return fail("INVALID_PRODUCT","Бараа сонгоно уу.",400);return ok(await openConversation(session.email,body.productId),201)}catch(error){return commerceError(error)}}
