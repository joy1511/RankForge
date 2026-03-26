import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { GlobalBackground } from "../components/GlobalBackground";

export function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ position: "relative" }}
    >
      <GlobalBackground />

      <div className="relative z-10 text-center max-w-xl">
        <div
          className="gradient-text mb-4"
          style={{ fontSize: "clamp(8rem,20vw,13rem)", fontWeight: 700, lineHeight: 1 }}
        >
          404
        </div>
        <h2 className="mb-3" style={{ fontSize: "1.75rem", fontWeight: 700 }}>Page Not Found</h2>
        <p className="text-[--text-secondary] mb-10" style={{ fontSize: "1.0625rem", lineHeight: 1.7 }}>
          This page doesn't exist. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/app">
            <Button
              className="btn-primary px-8"
              style={{ height: "48px" }}
            >
              <Home className="mr-2 w-4 h-4" />
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button
              variant="outline"
              className="btn-primary-outline px-8"
              style={{ height: "48px" }}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
