// import { NextRequest, NextResponse } from "next/server";

// export function proxy() {
//   console.log("PROXY IS RUNNING");

//   return NextResponse.next();
  
// }

// // let's add a matcher
// export const config = {
//   matcher: ["/intercept-demo/:path*"],
// };


// /intercept-demo
//        │
//        ▼
//    proxy.ts
//        │
//        │ matcher matches
//        ▼
// NextResponse.next()
//        │
//        ▼
// intercept-demo/page.tsx
// Proxy is acting as the gatekeeper we discussed.
// But currently the gatekeeper says:
// "Everyone can pass."
// return NextResponse.next();

import { request } from "https";
import { NextResponse} from "next/server";

export function proxy(request: Request) {
  
    const url = new URL(request.url);

   if(url.pathname.startsWith("/intercept-demo/secret")) {
    return NextResponse.redirect(new URL("/contact", request.url));
   }


  return NextResponse.next();
}

export const config = {
  matcher: ["/intercept-demo/:path*"],
};

// Request
//    ↓
// Proxy runs
//    ↓
// Check condition
//    ↓
//  ┌───────────────┐
//  │ condition ?   │
//  └───────┬───────┘
//      true│false
//          │
//     ┌────┴─────┐
//     ↓          ↓
//  redirect    next()
//  /contact    normally