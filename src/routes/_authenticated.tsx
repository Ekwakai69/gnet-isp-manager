import { createFileRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: Layout,
});
