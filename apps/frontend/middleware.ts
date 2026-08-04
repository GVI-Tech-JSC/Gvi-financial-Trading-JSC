import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales:       ["vi", "en", "zh", "ko", "ja"],
  defaultLocale: "vi",
  localePrefix:  "always",
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
