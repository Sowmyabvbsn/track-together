"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Users, Bell, Menu } from "lucide-react";
import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return null;
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <Link href="/" className="text-xl font-bold text-primary">
            TrackTogether
          </Link>
        </div>

        <SignedIn>
          <div className="hidden md:flex items-center gap-2">
            <Link href="/dashboard">
              <Button 
                variant={pathname === "/dashboard" ? "default" : "ghost"}
                size="sm"
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/groups">
              <Button 
                variant={pathname.startsWith("/groups") ? "default" : "ghost"}
                size="sm"
              >
                <Users className="mr-2 h-4 w-4" />
                Groups
              </Button>
            </Link>
            <Link href="/notifications">
              <Button 
                variant={pathname === "/notifications" ? "default" : "ghost"}
                size="sm"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
            </Link>
          </div>
        </SignedIn>

        <div className="flex items-center gap-2">
          <SignedIn>
            <div className="flex items-center gap-2">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8",
                  },
                }}
              />
              <ThemeToggle />
            </div>

            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/groups">
                      <Users className="mr-2 h-4 w-4" />
                      Groups
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-2">
                <Link href="/sign-in">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
              
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem asChild>
                      <Link href="/sign-in">Sign In</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/sign-up">Sign Up</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}