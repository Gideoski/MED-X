'use client';

import {SidebarTrigger} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import Link from 'next/link';
import Logo from '../logo';
import {Button} from '../ui/button';
import {useAuth, useUser} from '@/firebase';
import {signOut} from 'firebase/auth';
import {useRouter} from 'next/navigation';

export function Header() {
  const {user} = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth);
    router.push('/login');
  };

  return (
    <header className="relative sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <div className="hidden md:block">
          <Link href="/home" className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="whitespace-nowrap text-xl font-bold tracking-tighter text-primary">
              <em className="not-italic">MED-X</em>
            </span>
          </Link>
        </div>
      </div>

      {/* Center Section (Mobile Only) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
        <Link href="/home" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="whitespace-nowrap text-xl font-bold tracking-tighter text-primary">
            <em className="not-italic">MED-X</em>
          </span>
        </Link>
      </div>

      {/* Right Section */}
      <div className="flex items-center">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.displayName || 'Student'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account">Account</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}