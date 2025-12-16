"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Globe,
  FileText,
  ShieldCheck,
  Building2,
  Settings,
  Info,
  Shield,
  CheckCircle2,
  Activity,
  CreditCard,
  LogOut,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useState } from "react"

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Portal", href: "/portal", icon: Globe },
  { name: "LOI & MR", href: "/loi-mr", icon: FileText },
  { name: "Sanction", href: "/sanction", icon: ShieldCheck },
  { name: "Foundation", href: "/foundation", icon: Building2 },
  { name: "Installation", href: "/installation", icon: Settings },
  { name: "System Info", href: "/system-info", icon: Info },
  { name: "Insurance", href: "/insurance", icon: Shield },
  { name: "JCC Completion", href: "/jcc-completion", icon: CheckCircle2 },
  { name: "JCC Status", href: "/jcc-status", icon: Activity },
  { name: "Payment", href: "/payment", icon: CreditCard },
]

interface SidebarContentProps {
  className?: string
  onLinkClick?: () => void
}

function SidebarContent({ className, onLinkClick }: SidebarContentProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("username")
    router.push("/login")
  }

  return (
    <div className={cn("flex h-full flex-col bg-white shadow-lg border-r border-gray-100", className)}>
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-cyan-100 text-cyan-700 shadow-sm border border-cyan-200"
                  : "text-gray-600 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-blue-600 hover:text-white hover:shadow-md transition-all duration-300",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-3 text-gray-700 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="hidden md:flex h-screen w-64 flex-col">
      <SidebarContent />
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent onLinkClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
