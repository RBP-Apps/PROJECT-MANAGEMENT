"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate network delay for a smoother feel
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (username && password) {
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("username", username)
      router.push("/dashboard")
    } else {
      setError("Please enter both username and password")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white relative overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-blue-500" />
        <CardHeader className="space-y-2 text-center pt-10">
          <div className="mx-auto bg-gradient-to-br from-cyan-100 to-blue-100 p-3 rounded-full w-fit mb-2">
            <Lock className="w-6 h-6 text-cyan-600" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-500 text-base">
            Sign in to your admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 border-gray-200 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 transition-all duration-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-gray-200 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 transition-all duration-200"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 font-medium text-center bg-red-50 p-2 rounded">{error}</p>}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing In..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
              Powered by Botivate
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
