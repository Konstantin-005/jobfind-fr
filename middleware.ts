import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // В middleware мы не имеем доступа к localStorage, поэтому пропускаем проверку
  // и перенаправляем на страницу, где клиентский код проверит доступ
  // и выполнит редирект при необходимости
  return NextResponse.next();
}

export const config = {
  matcher: '/employer/:path*',
};
