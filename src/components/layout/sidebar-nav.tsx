 "use client"
 
 import {
   Sidebar,
   SidebarHeader,
   SidebarContent,
   SidebarMenu,
   SidebarMenuItem,
   SidebarMenuButton,
   SidebarFooter,
   useSidebar,
 } from "@/components/ui/sidebar"
 import { Home, Book, GraduationCap, Pencil, Shield, Users, User, Settings, HelpCircle, LogOut } from "lucide-react"
 import Logo from "../logo"
 import Link from "next/link"
 import { usePathname } from "next/navigation"
 import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
 import { signOut } from "firebase/auth"
 import { useRouter } from "next/navigation"
 import { doc } from "firebase/firestore"
 
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
    { href: "/feedback-help", icon: HelpCircle, label: "Feedback & Help" },
 ]
 
 export function SidebarNav() {
   const pathname = usePathname()
   const auth = useAuth();
   const router = useRouter();
   const { isMobile, setOpenMobile } = useSidebar();
   const { user } = useUser();
   const firestore = useFirestore();

   const userDocRef = useMemoFirebase(() => {
     if (!firestore || !user) return null;
     return doc(firestore, 'users', user.uid);
   }, [firestore, user]);
 
   const { data: userProfile } = useDoc<{ role: string }>(userDocRef);
   const isAdmin = userProfile?.role === 'admin';

   const handleLinkClick = () => {
     if (isMobile) {
       setOpenMobile(false);
     }
   }
 
   const handleLogout = () => {
     signOut(auth);
     router.push('/login');
     handleLinkClick();
   };
 
   return (
     <Sidebar collapsible="offcanvas">
       <SidebarHeader>
         <Link href="/home" className="flex items-center gap-2.5 whitespace-nowrap" onClick={handleLinkClick}>
           <Logo className="h-8 w-8 text-primary" />
           <h1 className="text-xl font-bold tracking-tighter text-primary">
             <em className="not-italic">MED-X</em>
           </h1>
         </Link>
       </SidebarHeader>
       <SidebarContent className="p-2">
         <SidebarMenu>
           {navItems.map((item) => (
            (item.href === "/admin" && !isAdmin) ? null : (
             <SidebarMenuItem key={item.href}>
               <SidebarMenuButton
                 asChild
                 isActive={pathname === item.href}
                 tooltip={{ children: item.label }}
               >
                 <Link href={item.href} onClick={handleLinkClick}>
                   <item.icon />
                   <span>{item.label}</span>
                 </Link>
               </SidebarMenuButton>
             </SidebarMenuItem>
            )
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
                   <Link href={item.href} onClick={handleLinkClick}>
                     <item.icon />
                     <span>{item.label}</span>
                   </Link>
                 </SidebarMenuButton>
              </SidebarMenuItem>
           ))}
            <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: 'Log Out' }} onClick={handleLogout}>
                    <LogOut />
                    <span>Log Out</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
       </SidebarFooter>
     </Sidebar>
   )
 }
