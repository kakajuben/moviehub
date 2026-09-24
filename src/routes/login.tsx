import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    // Immediately forwards anyone visiting /login to the working /auth screen
    throw redirect({ to: "/auth" });
  },
});
