import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export function LegalLayout({ title, updated, children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container max-w-3xl py-14">
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
          <div className="prose-legal mt-8 space-y-6 text-muted-foreground">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ heading, children }) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-bold text-ink">{heading}</h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}
