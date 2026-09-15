import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-white/30">404</p>
      <h1 className="font-serif text-3xl font-bold text-white">Page not found</h1>
      <p className="max-w-md text-sm text-white/50">
        That route does not exist. Head back to the studio or explore the 3D office.
      </p>
      <Link to="/" className="btn-primary">
        Back to Studio
      </Link>
    </div>
  );
}
