import PortalLayout from "@/components/PortalLayout";

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalLayout role="coordinator">
      {children}
    </PortalLayout>
  );
}
