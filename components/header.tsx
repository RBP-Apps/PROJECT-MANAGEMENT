"use client"

import { useEffect, useState } from "react"

export function Header() {
  const [username, setUsername] = useState("")

  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  return (
    <header className="h-16 border-b border-gray-100 bg-white px-6 flex items-center justify-between shadow-lg z-10 relative">
      <div>
        <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome back{username ? `, ${username}` : ""}!
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground font-medium">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
    </header>
  )
}
