import { Header } from "@/components/layout/header"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <SidebarNav />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
