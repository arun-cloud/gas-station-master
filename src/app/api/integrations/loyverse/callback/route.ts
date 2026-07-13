import { NextRequest, NextResponse } from "next/server";

interface LoyverseTokenResponse {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
}

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const returnedState = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
        return NextResponse.redirect(
            new URL(
                `/settings/integrations?loyverse=failed&error=${encodeURIComponent(error)}`,
                request.url
            )
        );
    }

    if (!code) {
        return NextResponse.json(
            { error: "Loyverse authorization code is missing" },
            { status: 400 }
        );
    }

    const savedState = request.cookies.get("loyverse_oauth_state")?.value;

    if (!savedState || !returnedState || savedState !== returnedState) {
        return NextResponse.json(
            { error: "Invalid OAuth state" },
            { status: 400 }
        );
    }

    const clientId = process.env.LOYVERSE_CLIENT_ID;
    const clientSecret = process.env.LOYVERSE_CLIENT_SECRET;
    const redirectUri = process.env.LOYVERSE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.json(
            { error: "Loyverse OAuth configuration is incomplete" },
            { status: 500 }
        );
    }

    const tokenResponse = await fetch(
        "https://api.loyverse.com/oauth/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code,
                grant_type: "authorization_code",
            }),
            cache: "no-store",
        }
    );

    const tokenData =
        (await tokenResponse.json()) as LoyverseTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
        console.error("Loyverse token exchange failed", tokenData);

        return NextResponse.json(
            {
                error: "Failed to obtain Loyverse access token",
                details: tokenData,
            },
            { status: tokenResponse.status }
        );
    }

    /*
     * Save these securely in your database:
     *
     * tokenData.access_token
     * tokenData.refresh_token
     * tokenData.expires_in
     * tokenData.scope
     *
     * Never return the access token to the browser.
     */

    const response = NextResponse.redirect(
        new URL("/sales?loyverse=connected", request.url)
    );

    response.cookies.delete("loyverse_oauth_state");

    return response;
}