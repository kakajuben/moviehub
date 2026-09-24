import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: () => {
    // Forwards directly to the authenticated admin panel
    throw redirect({ to: "/admin" });
  },
});
