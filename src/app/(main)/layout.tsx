
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
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <SidebarNav />
        <SidebarInset className="w-full flex-1">
          <Header />
          <main className="flex-1 p-3 md:p-6 lg:p-8 w-full max-w-[100vw] overflow-x-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
