import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { RTL_LOCALES } from "@/lib/config/locales";
import { fontVariables } from "@/lib/fonts";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const dir = RTL_LOCALES.includes(locale as "ar") ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={fontVariables}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
