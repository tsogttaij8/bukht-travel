import { removeCartItem, updateCartItem } from "../../../../../lib/server/cart-store"
import { commerceError, fail, ok } from "../../../../../lib/server/api-response"
import { readSessionFromCookieHeader } from "../../../../../lib/server/session"
function sessionOf(request:Request){return readSessionFromCookieHeader(request.headers.get("cookie")??"")}
export async function PATCH(request:Request,{params}:{params:Promise<{itemId:string}>}){const session=sessionOf(request);if(!session)return fail("UNAUTHORIZED","Нэвтэрнэ үү.",401);try{const {itemId}=await params;const body=await request.json() as {quantity?:number};return ok(await updateCartItem(session.email,itemId,body.quantity??0))}catch(error){return commerceError(error)}}
export async function DELETE(request:Request,{params}:{params:Promise<{itemId:string}>}){const session=sessionOf(request);if(!session)return fail("UNAUTHORIZED","Нэвтэрнэ үү.",401);try{const {itemId}=await params;return ok(await removeCartItem(session.email,itemId))}catch(error){return commerceError(error)}}
