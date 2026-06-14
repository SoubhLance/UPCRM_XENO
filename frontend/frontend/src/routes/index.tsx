import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  // Always send to dashboard; the _app layout handles auth redirect.
  return <Navigate to="/dashboard" replace />;
}
