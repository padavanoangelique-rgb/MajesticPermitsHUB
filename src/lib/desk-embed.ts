import type {NextRequest} from "next/server";
// Layout hint only. This function must never authorize a user.
export function isDeskEmbed(request: NextRequest) {return request.nextUrl.searchParams.get("embed")==="1";}
