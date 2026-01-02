import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
      const sheetId = import.meta.env.VITE_SHEET_ID;
      
      if (!scriptUrl) {
          throw new Error("App Script URL is not configured.");
      }

      console.log("Attempting login...");
      console.log("Script URL:", scriptUrl);
      const cleanSheetId = sheetId.trim();
      console.log("Sheet ID:", cleanSheetId);

      // Fetch all users using multiple common parameter names for robustness
      // Some scripts expect 'sheet', others 'sheetName', others 'table'
      const params = new URLSearchParams({
        action: 'read',
        sheet: 'Login Master', // Common
        sheetName: 'Login Master', // Also common
        id: cleanSheetId
      });

      const response = await fetch(`${scriptUrl}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to connect to login server.");
      }

      const data = await response.json();
      console.log("Login Data Received:", data);

      if (data.success === false) {
          console.error("API Error:", data.error);
          throw new Error(data.error || "Sheet connection failed");
      }
      
      // The App Script returns an array of arrays (rows)
      // Row 0 is the header: ["User Name", "User ID", "Pass", "Role", ...]
      const rawRows = Array.isArray(data) ? data : (data.data || []);
      
      if (rawRows.length < 2) {
          console.warn("No data rows found (only header or empty).");
          setError("No user data available.");
          return;
      }

      // 1. Identify Headers and map them to indices
      const headers = rawRows[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, ''));
      console.log("Parsed Headers:", headers);

      const userIdIndex = headers.indexOf("userid"); // Matches "User ID", "user id"
      const passIndex = headers.indexOf("pass");     // Matches "Pass"
      
      // Fallback check if "pass" isn't found, try "password"
      const finalPassIndex = passIndex !== -1 ? passIndex : headers.indexOf("password");

      if (userIdIndex === -1 || finalPassIndex === -1) {
          console.error("Critical: 'User ID' or 'Pass' column not found in headers.");
          setError("Server Error: Invalid Sheet Structure.");
          return;
      }

      // 2. Search through data rows (skipping header row 0)
      let foundUser = null;
      
      for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          // Ensure row has enough columns
          if (!row || row.length <= Math.max(userIdIndex, finalPassIndex)) continue;

          const rowUserId = String(row[userIdIndex]).trim();
          const rowPass = String(row[finalPassIndex]).trim();

          if (rowUserId === username.trim() && rowPass === password.trim()) {
              // Found match!
              // Map full row data to object for storage
              foundUser = {};
              rawRows[0].forEach((headerName, index) => {
                  foundUser[headerName] = row[index];
              });
              break;
          }
      }

      if (foundUser) {
        console.log("User matched:", foundUser);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", foundUser["User Name"] || username);
        localStorage.setItem("userRole", foundUser["Role"] || "User");
        navigate("/dashboard");
      } else {
        console.warn("No matching user found for:", username);
        setError("Invalid User ID or Password");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
      <style>{`
        @keyframes blob-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(300px, -50px) scale(1.2); }
          66% { transform: translate(100px, 150px) scale(0.8); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes blob-2 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-250px, 100px) scale(1.1); }
          66% { transform: translate(50px, 50px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes blob-3 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-150px, -150px) scale(0.9); }
          66% { transform: translate(100px, -50px) scale(1.3); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob-1 {
          animation: blob-1 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-blob-2 {
          animation: blob-2 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-blob-3 {
          animation: blob-3 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      {/* Background Decor Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply animate-blob-1" />
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-cyan-400/20 rounded-full blur-[100px] mix-blend-multiply animate-blob-2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply animate-blob-3" />
      </div>

      <Card className="w-full max-w-md border border-white/40 shadow-2xl bg-white/60 backdrop-blur-xl rounded-3xl relative z-10 overflow-hidden animate-fade-in-up">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600" />

        <CardHeader className="space-y-4 text-center pt-8 pb-8">
          <div className="mx-auto bg-white p-4 rounded-2xl shadow-lg shadow-blue-500/10 mb-1 border border-blue-50">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Welcome Back
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Enter your credentials to access the admin portal
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1"
              >
                User ID
              </Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter User ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 bg-white/50 border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-200 transition-all rounded-xl shadow-sm text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1"
              >
                Password
              </Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white/50 border-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-200 transition-all rounded-xl shadow-sm text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 w-11 text-slate-400 hover:text-blue-600 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm py-2 px-3 rounded-lg text-center font-medium animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 rounded-xl font-semibold text-base hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In to Dashboard <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase flex items-center justify-center gap-2">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              Powered By Botivate
              <span className="w-8 h-[1px] bg-slate-200"></span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
