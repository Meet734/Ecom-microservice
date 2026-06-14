import { NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/orders', '/profile', '/change-password', '/dashboard', '/addresses', '/products', '/inventory', '/categories'];

const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request) {
    const { pathname } = request.nextUrl;

    const isLoggedIn = request.cookies.has('auth_status');

    const isProtected = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
    );
    const isAuthRoute = AUTH_ROUTES.some((route) =>
        pathname.startsWith(route)
    );

    if (isProtected && !isLoggedIn) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    if (isAuthRoute && isLoggedIn) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};