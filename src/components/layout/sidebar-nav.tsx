 "use client"
 
 import {
   Sidebar,
   SidebarHeader,
   SidebarContent,
   SidebarMenu,
   SidebarMenuItem,
   SidebarMenuButton,
   SidebarFooter,
 } from "@/components/ui/sidebar"
 import { Home, Book, GraduationCap, Pencil, Shield, Users, User, Settings, HelpCircle, LogOut } from "lucide-react"
 import Logo from "../logo"
 import Link from "next/link"
 import { usePathname } from "next/navigation"
 import { Button } from "../ui/button"
 
 const navItems = [
   { href: "/home", icon: Home, label: "Home" },
   { href: "/100lvl", icon: Book, label: "100 Level" },
   { href: "/200lvl", icon: GraduationCap, label: "200 Level" },
   { href: "/request-ebook", icon: Pencil, label: "Request E-Book" },
   { href: "/creators", icon: Users, label: "Creators" },
   { href: "/admin", icon: Shield, label: "Admin" },
 ]
 
 const bottomNavItems = [
    { href: "/account", icon: User, label: "Account" },
    { href: "/settings", icon: Settings, label: "Settings" },
    { href: "/feedback-help", icon: HelpCircle, label: "Feedback &amp; Help" },
 ]
 
 export function SidebarNav() {
   const pathname = usePathname()
 
   return (
     <Sidebar>
       <SidebarHeader>
         <Link href="/home" className="flex items-center gap-2.5">
           <Logo className="h-8 w-8 text-primary" />
           <h1 className="text-xl font-bold tracking-tighter text-primary">
             <em className="not-italic">MED-X</em>
           </h1>
         </Link>
       </SidebarHeader>
       <SidebarContent className="p-2">
         <SidebarMenu>
           {navItems.map((item) => (
             <SidebarMenuItem key={item.href}>
               <SidebarMenuButton
                 asChild
                 isActive={pathname === item.href}
                 tooltip={{ children: item.label }}
               >
                 <Link href={item.href}>
                   <item.icon />
                   <span>{item.label}</span>
                 </Link>
               </SidebarMenuButton>
             </SidebarMenuItem>
           ))}
         </SidebarMenu>
       </SidebarContent>
       <SidebarFooter className="p-2">
         <SidebarMenu>
           {bottomNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                 <SidebarMenuButton
                   asChild
                   isActive={pathname === item.href}
                   tooltip={{ children: item.label }}
                 >
                   <Link href={item.href}>
                     <item.icon />
                     <span>{item.label}</span>
                   </Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
           ))}
            <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: 'Log Out' }}>
                    <LogOut />
                    <span>Log Out</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
       </SidebarFooter>
     </Sidebar>
   )
 }
 