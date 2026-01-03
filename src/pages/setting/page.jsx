import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Check, ChevronsUpDown, Loader2, ShieldAlert, KeyRound, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageOptions, setPageOptions] = useState([]);
  const [columnMapping, setColumnMapping] = useState({}); // Store indices
  const [nextRowIndex, setNextRowIndex] = useState(null); // Track next empty row
  const [formData, setFormData] = useState({
    userName: "",
    userId: "",
    password: "",
    role: "User",
    pageAccess: [],
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter((user) =>
    Object.values(user).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
      const sheetId = import.meta.env.VITE_SHEET_ID;

      const params = new URLSearchParams({
        action: "read",
        sheet: "Login Master", // Sheet Name from screenshot
        sheetName: "Login Master",
        id: sheetId.trim(),
      });

      const response = await fetch(`${scriptUrl}?${params.toString()}`);
      if (!response.ok) throw new Error("Network Error");

      const result = await response.json();
      const rawRows = Array.isArray(result) ? result : result.data || [];

      if (rawRows.length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      // Robust Header Detection
      let headerRowIndex = -1;
      // Search for a row that contains "user name" and "user id"
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const row = rawRows[i];
          if (!Array.isArray(row)) continue;
          const lowerRow = row.map(c => String(c).toLowerCase().trim());
          if (lowerRow.includes("user name") || lowerRow.includes("username") && lowerRow.includes("user id")) {
              headerRowIndex = i;
              break;
          }
      }

      if (headerRowIndex === -1) {
          // Fallback to row 0 if not found
          console.warn("Could not find header row, defaulting to 0");
          headerRowIndex = 0;
      }

      const rawHeaderRow = rawRows[headerRowIndex];
      const headerRow = rawHeaderRow.map(h => String(h).trim().toLowerCase());
      
      const colMap = {
        userName: headerRow.findIndex(h => h.includes("user name") || h === "username"),
        userId: headerRow.findIndex(h => h.includes("user id") || h === "userid"),
        password: headerRow.findIndex(h => h.includes("pass") || h.includes("password")),
        role: headerRow.findIndex(h => h.includes("role")),
        pageAccess: headerRow.findIndex(h => h.includes("page access") || h.includes("access")),
        pageName: headerRow.findIndex(h => h.includes("page name") || h.includes("pagename")), 
      };

      const getHeader = (idx) => idx !== -1 ? rawHeaderRow[idx] : null;

      // We just need the mapping for submission
      setColumnMapping(colMap);
      
      // Calculate next row index (1-based)
      // Scan for the first empty row after the header to avoid appending after empty rows
      let foundNextIndex = rawRows.length + 1;
      
      // We look at the User ID column (or User Name if ID is missing) to check if a row is "used"
      // Start scanning after the header row
      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row) {
              foundNextIndex = i + 1;
              break;
          }
          
          // Check key columns
          const userIdVal = colMap.userId !== -1 ? row[colMap.userId] : "";
          const userNameVal = colMap.userName !== -1 ? row[colMap.userName] : "";
          
          // If both main identifiers are empty/missing, we consider this row free
          if ((!userIdVal || String(userIdVal).trim() === "") && 
              (!userNameVal || String(userNameVal).trim() === "")) {
              foundNextIndex = i + 1;
              break;
          }
      }
      
      console.log("Calculated Next Row Index:", foundNextIndex);
      setNextRowIndex(foundNextIndex);

      const loadedUsers = [];
      const loadedPages = new Set();

      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row) continue;

        // Extract User Data - Ensure we have at least a User ID or Name
        if (colMap.userId !== -1 && row[colMap.userId]) {
            loadedUsers.push({
                userName: colMap.userName !== -1 ? row[colMap.userName] : "",
                userId: row[colMap.userId],
                password: colMap.password !== -1 ? row[colMap.password] : "",
                role: colMap.role !== -1 ? row[colMap.role] : "User",
                pageAccess: colMap.pageAccess !== -1 && row[colMap.pageAccess] 
                    ? String(row[colMap.pageAccess]).split(",").map(s => s.trim()).filter(Boolean) 
                    : [],
                rowIndex: i + 1
            });
        }

        // Extract Page Options from Column G (Page Name)
        if (colMap.pageName !== -1 && row[colMap.pageName]) {
            loadedPages.add(String(row[colMap.pageName]).trim());
        }
      }

      setUsers(loadedUsers);
      setPageOptions(Array.from(loadedPages).filter(Boolean).sort());

    } catch (e) {
      console.error("Fetch Data Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageAccessToggle = (page) => {
    setFormData(prev => {
        const current = prev.pageAccess;
        if (current.includes(page)) {
            return { ...prev, pageAccess: current.filter(p => p !== page) };
        } else {
            return { ...prev, pageAccess: [...current, page] };
        }
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
       const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
       const sheetId = import.meta.env.VITE_SHEET_ID;

       // Use 'update' on the next available row index to add a new row
       // This works if the script supports expanding the sheet via setValue on a new row.
       
       if (!nextRowIndex) throw new Error("Could not determine next row index");

       const rowUpdate = {};
       
       const addField = (colIdx, val) => {
           if (colIdx !== -1 && colIdx !== undefined) {
               rowUpdate[colIdx] = val;
           }
       };

       addField(columnMapping.userName, formData.userName);
       addField(columnMapping.userId, formData.userId);
       addField(columnMapping.password, formData.password);
       addField(columnMapping.role, formData.role);
       addField(columnMapping.pageAccess, formData.pageAccess.join(", "));
       
       rowUpdate[5] = "Active"; 

       const params = new URLSearchParams({
        action: "update", // Use 'update' which we know exists
        sheet: "Login Master",
        sheetName: "Login Master",
        id: sheetId,
        rowIndex: nextRowIndex, // Target the new row
        rowData: JSON.stringify(rowUpdate)
       });

       const response = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
       });
       
       const textResult = await response.text();
       console.log("Server Response:", textResult);

       let result;
       try {
           result = JSON.parse(textResult);
       } catch (e) {
           // If parsing fails, checks if textResult looks like success
           // Google Apps Script 'ContentService.createTextOutput' often returns just text
           if (textResult.toLowerCase().includes("success") || textResult.toLowerCase().includes("done")) {
               result = { success: true };
           } else {
               // Show the RAW text to the user so we know what happened
              throw new Error("Server returned non-JSON: " + textResult);
           }
       }

       if (result.success || result.status === "success" || result.result === "success") {
           setIsDialogOpen(false);
           setFormData({
            userName: "",
            userId: "",
            password: "",
            role: "User",
            pageAccess: [],
           });
           fetchData(); // Refresh
       } else {
           throw new Error("Failed to add user: " + (result.message || result.error || JSON.stringify(result)));
       }

    } catch (e) {
        console.error("Submit Error:", e);
        alert("Error adding user. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage system users, roles, and access permissions.</p>
        </div>
        <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md hover:shadow-lg transition-all"
            onClick={() => setIsDialogOpen(true)}
        >
            <UserPlus className="h-4 w-4" />
            Add New User
        </Button>
      </div>

      <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-1 flex flex-col md:flex-row items-center justify-between gap-4 h-auto min-h-[3.5rem]">
            <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Registered Users
            </CardTitle>
            <div className="relative w-full md:w-100">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white border-black focus-visible:ring-blue-200 h-9 transition-all hover:border-blue-200"
                />
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table className="[&_th]:text-center [&_td]:text-center">
                    <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                        <TableRow className="border-b border-blue-100 hover:bg-transparent">
                            <TableHead className="h-12 font-bold text-slate-600 w-[150px]">User Name</TableHead>
                            <TableHead className="h-12 font-bold text-slate-600 w-[120px]">User ID</TableHead>
                            <TableHead className="h-12 font-bold text-slate-600 w-[120px]">Password</TableHead>
                            <TableHead className="h-12 font-bold text-slate-600 w-[100px]">Role</TableHead>
                            <TableHead className="h-12 font-bold text-slate-600 w-[250px]">Page Access</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse">
                                    {Array.from({ length: 5 }).map((__, j) => (
                                        <TableCell key={j}><div className="h-4 bg-slate-100 rounded w-2/3 mx-auto"></div></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : filteredUsers.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                    {users.length === 0 ? "No users found." : "No users found matching your search."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <TableRow key={index} className="hover:bg-blue-50/30 transition-colors">
                                    <TableCell className="font-medium text-slate-800">{user.userName}</TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">{user.userId}</TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500 tracking-wider">
                                        {user.password}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "uppercase text-[10px] tracking-wider",
                                            user.role?.toLowerCase() === 'admin' 
                                                ? "bg-blue-50 text-blue-700 border-blue-200" 
                                                : "bg-slate-50 text-slate-700 border-slate-200"
                                        )}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[250px] mx-auto text-xs text-slate-600 font-medium whitespace-normal break-words text-center">
                                            {user.pageAccess && user.pageAccess.length > 0 ? (
                                                user.pageAccess.join(", ")
                                            ) : (
                                                <span className="text-slate-400 italic">No Access</span>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-blue-800">
                    <UserPlus className="h-5 w-5" />
                    Add New User
                </DialogTitle>
                <DialogDescription>
                    Create a new user and assign permissions.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="userName">User Name</Label>
                    <Input 
                        id="userName" 
                        placeholder="e.g. John Doe" 
                        value={formData.userName}
                        onChange={(e) => setFormData({...formData, userName: e.target.value})}
                        className="focus-visible:ring-blue-500"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="userId">User ID</Label>
                        <Input 
                            id="userId" 
                            placeholder="e.g. user123" 
                            value={formData.userId}
                            onChange={(e) => setFormData({...formData, userId: e.target.value})}
                            className="focus-visible:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="password">Password</Label>
                         <Input 
                            id="password" 
                            placeholder="Secret key" 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="focus-visible:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Role</Label>
                    <Select 
                        value={formData.role} 
                        onValueChange={(val) => setFormData({...formData, role: val})}
                    >
                        <SelectTrigger className="focus:ring-blue-500 hover:bg-transparent hover:text-slate-900 border-slate-200 hover:border-blue-300 transition-colors">
                            <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="border-blue-50">
                            <SelectItem value="Admin" className="focus:bg-blue-50 focus:text-slate-900 cursor-pointer">Admin</SelectItem>
                            <SelectItem value="User" className="focus:bg-blue-50 focus:text-slate-900 cursor-pointer">User</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Page Access</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="outline" 
                                className="w-full justify-between text-left font-normal bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 active:scale-100 hover:border-blue-300 hover:bg-slate-50 hover:text-slate-900 transition-all"
                            >
                                <span className={cn("truncate", formData.pageAccess.length === 0 && "text-muted-foreground")}>
                                    {formData.pageAccess.length > 0 
                                        ? `${formData.pageAccess.length} Selected` 
                                        : "Select Pages"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 shadow-lg border-blue-50" align="start">
                            <div className="h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">      
                                <div className="p-2 grid gap-1">
                                    {pageOptions.length === 0 ? (
                                        <div className="p-2 text-sm text-slate-500 text-center">No pages found in sheet.</div>
                                    ) : (
                                        pageOptions.map((page) => (
                                            <div 
                                                key={page} 
                                                className="
                                                    flex items-center space-x-2 p-2
                                                    hover:bg-blue-50
                                                    rounded-md cursor-pointer
                                                    transition-colors
                                                "
                                                onClick={() => handlePageAccessToggle(page)}
                                            >
                                                <Checkbox 
                                                    id={`page-${page}`} 
                                                    checked={formData.pageAccess.includes(page)}
                                                    onCheckedChange={() => handlePageAccessToggle(page)}
                                                    className="
                                                        border-slate-300
                                                        data-[state=checked]:bg-blue-600
                                                        data-[state=checked]:border-blue-600
                                                        focus-visible:ring-2
                                                        focus-visible:ring-blue-500
                                                        focus-visible:ring-offset-2
                                                        hover:border-blue-400
                                                    "
                                                />
                                                <label 
                                                    htmlFor={`page-${page}`} 
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                                >
                                                    {page}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                     {formData.pageAccess.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {formData.pageAccess.map(p => (
                                <Badge key={p} variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100">
                                    {p}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-4">
                <Button 
                    variant="outline" 
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    onClick={() => setIsDialogOpen(false)} 
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.userName || !formData.userId}
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save User
                </Button>
            </div>

          </DialogContent>
      </Dialog>
    </div>
  );
}
