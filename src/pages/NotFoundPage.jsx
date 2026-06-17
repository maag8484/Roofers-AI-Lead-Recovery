import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="hero-gradient flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo className="mb-8" />
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-3 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Button className="mt-6" asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  );
}
