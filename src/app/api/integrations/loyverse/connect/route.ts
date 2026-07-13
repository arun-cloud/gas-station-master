import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.LOYVERSE_CLIENT_ID;
    const redirectUri = process.env.LOYVERSE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return NextResponse.json(
            {
                error:
                    "Missing LOYVERSE_CLIENT_ID or LOYVERSE_REDIRECT_URI environment variable",
            },
            { status: 500 }
        );
    }

    const state = randomBytes(32).toString("hex");

    const authorizationUrl = new URL(
        "https://api.loyverse.com/oauth/authorize"
    );

    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set(
        "scope",
        [
            "RECEIPTS_READ",
            "STORES_READ",
            "ITEMS_READ",
            "EMPLOYEES_READ",
            "POS_DEVICES_READ",
            "PAYMENT_TYPES_READ",
            "MERCHANT_READ",
        ].join(" ")
    );
    authorizationUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set("loyverse_oauth_state", state, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 10 * 60,
    });

    return response;
}