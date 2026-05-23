import { auth } from "@/auth";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return <AuthSessionProvider session={session}>{children}</AuthSessionProvider>;
}
