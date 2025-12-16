import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, DollarSign, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Projects",
      value: "142",
      description: "+12% from last month",
      icon: Activity,
      color: "text-blue-600 bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Users",
      value: "2,345",
      description: "+5% from last week",
      icon: Users,
      color: "text-purple-600 bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Revenue",
      value: "$45,231",
      description: "+18% from last month",
      icon: DollarSign,
      color: "text-green-600 bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Growth",
      value: "+12.5%",
      description: "Year over year",
      icon: TrendingUp,
      color: "text-pink-600 bg-pink-50",
      iconColor: "text-pink-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Overview of your system metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border border-gray-100 shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-blue-100 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-blue-900">Recent Activity</CardTitle>
            <CardDescription>Latest updates from the system</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[
                { color: "bg-blue-500", label: "New project created" },
                { color: "bg-purple-500", label: "User registered" },
                { color: "bg-green-500", label: "Payment received" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${activity.color} animate-pulse`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.label}</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-100 shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
            <CardTitle className="text-green-900">System Status</CardTitle>
            <CardDescription>Current operational status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {["Database", "API", "Storage"].map((service) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{service}</span>
                  <span className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full font-medium shadow-sm">
                    Operational
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
