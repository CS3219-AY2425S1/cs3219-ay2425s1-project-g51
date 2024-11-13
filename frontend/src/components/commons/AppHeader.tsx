"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import SettingsDialog from "./SettingsDialog";

const AppHeader: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  return (
    <div>
      <header className="bg-primary text-primary-foreground py-4 px-6 flex justify-between items-center">
        <div className="flex">
          <Link href="#" className="flex items-center space-x-2" prefetch={false}>
            <span className="text-xl font-bold">PeerPrep</span>
          </Link>
          <nav className="hidden md:flex space-x-4 px-5 items-center">
            <Link href="./sessions" className="hover:underline">
            Sessions
          </Link>
          <Link href="./questions" className="hover:underline">
              Questions
            </Link>
          </nav>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-8 h-8 p-0 hover:bg-gray-700 rounded-full">
              <User className="h-6 w-6 text-white" />
              <span className="sr-only">Open user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default AppHeader;
