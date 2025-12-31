import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Users, DollarSign, TrendingUp, RefreshCw, AlertCircle, FileText, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCapacity: 0,
    totalSanctioned: 0,
    completionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
      const sheetId = import.meta.env.VITE_SHEET_ID;

      if (!scriptUrl || !sheetId) {
        throw new Error("Configuration missing: VITE_APP_SCRIPT_URL or VITE_SHEET_ID not found.");
      }

      // Fetch 'Project Main' instead of 'Dashboard' to get actual raw data for aggregation
      // This solves the 'empty dashboard' issue by calculating metrics live.
      const params = new URLSearchParams({
        action: "read",
        sheet: "Project Main", 
        sheetName: "Project Main",
        id: sheetId.trim(),
      });

      const response = await fetch(`${scriptUrl}?${params.toString()}`);
      if (!response.ok) throw new Error("Network Error");

      const result = await response.json();
      const rawRows = Array.isArray(result) ? result : result.data || [];

      if (rawRows.length === 0) {
        setData([]);
        setIsLoading(false);
        return;
      }

      // --- Header Detection (Robust Logic from Foundation Page) ---
      let headerRowIndex = -1;
      const targetColumns = ["regid", "beneficiaryname", "village"];
      
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const row = rawRows[i];
        if (!Array.isArray(row)) continue;
        const normalizedRow = row.map(c => String(c).toLowerCase().replace(/\s+/g, ''));
        if (targetColumns.filter(col => normalizedRow.includes(col)).length >= 2) {
            headerRowIndex = i;
            break;
        }
      }

      if (headerRowIndex === -1 && rawRows.length > 5) headerRowIndex = 5;
      if (headerRowIndex === -1 || !rawRows[headerRowIndex]) {
        // Only if Project Main is totally empty or weird
        console.warn("Could not identify header row in Project Main, retrying default index 0");
        headerRowIndex = 0;
      }

      const rawHeaders = rawRows[headerRowIndex].map(h => String(h).trim());
      const headers = rawHeaders.map(h => h.toLowerCase());
      const findCol = (keys) => headers.findIndex(h => keys.every(k => h.includes(k)));

      // --- Column Mapping for Aggregation ---
      const colMap = {
        company: findCol(["company"]),
        district: findCol(["district"]),
        installer: findCol(["installer"]),
        pumpType: findCol(["pump", "type"]), // For Capacity approximation
        
        // Status Counts
        sanctionNo: findCol(["sanction", "no"]),
        
        // Foundation
        // Approximating "Dispatch" as Material Receiving Date present
        fdDispatch: findCol(["fd", "receiving"]), 
        // Foundation Done Timestamp
        fdDone: findCol(["actual", "3"]), 
        
        // Installation
        // Approximating "Dispatch" as Material Receiving Date present
        insDispatch: findCol(["ins", "receiving"]), 
        // Installation Done Timestamp
        insDone: findCol(["actual", "4"]), 
        
        // Payment
        payment: findCol(["payment", "done"]), // Look for explicit column or check amounts?
        amount: findCol(["amount"])
      };

      // --- Aggregation Logic ---
      // Key: `${Company}|${District}`
      const aggMap = new Map();
      let totalProjectsCount = 0;
      let totalSanctionedCount = 0;
      let totalCompletedCount = 0;

      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row) continue;
        
        // Basic grouping keys
        const company = (colMap.company !== -1 && row[colMap.company]) ? String(row[colMap.company]).trim() : "Unknown";
        const district = (colMap.district !== -1 && row[colMap.district]) ? String(row[colMap.district]).trim() : "Unknown";
        
        // Skip completely empty rows
        if (company === "Unknown" && district === "Unknown") continue;

        totalProjectsCount++;

        const key = `${company}|${district}`;
        
        if (!aggMap.has(key)) {
            aggMap.set(key, {
                id: key,
                company,
                district,
                installer: (colMap.installer !== -1 && row[colMap.installer]) ? row[colMap.installer] : "-", // Take the first installer found
                capacity: 0,
                target: "-", // Target is likely manual, setting as placeholder
                sanction: 0,
                balance: 0,
                foundationDispatch: 0,
                foundationComplete: 0,
                installationDispatch: 0,
                installationComplete: 0,
                jccRbp: 0, // Placeholder
                jccDoSubmitted: 0, // Placeholder
                jccRo: 0, // Placeholder
                jccRoao: 0, // Placeholder
                jccZo: 0, // Placeholder
                jccHo: 0, // Placeholder
                paymentDone: 0
            });
        }
        
        const entry = aggMap.get(key);

        // Count Sanctions
        if (colMap.sanctionNo !== -1 && row[colMap.sanctionNo]) {
            entry.sanction++;
            totalSanctionedCount++;
        }

        // Count Foundation
        if (colMap.fdDispatch !== -1 && row[colMap.fdDispatch]) entry.foundationDispatch++;
        if (colMap.fdDone !== -1 && row[colMap.fdDone]) entry.foundationComplete++;

        // Count Installation
        if (colMap.insDispatch !== -1 && row[colMap.insDispatch]) entry.installationDispatch++;
        if (colMap.insDone !== -1 && row[colMap.insDone]) {
             entry.installationComplete++;
             totalCompletedCount++;
        }

        // Logic for Payment (if amount exists, maybe?)
        // if (colMap.amount !== -1 && row[colMap.amount]) entry.paymentDone++;
      }

      const parsedData = Array.from(aggMap.values());
      
      // Calculate simple Completion Rate
      const completionRate = totalProjectsCount > 0 ? ((totalCompletedCount / totalProjectsCount) * 100).toFixed(1) : 0;

      setData(parsedData);
      setStats({
        totalProjects: totalProjectsCount,
        totalCapacity: parsedData.length + " Sites", // Placeholder text
        totalSanctioned: totalSanctionedCount,
        completionRate: completionRate
      });
      setLastUpdated(new Date());

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out min-h-screen bg-slate-50/50">
      
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
            Project Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time analytics aggregated from Project Main
          </p>
        </div>
        <div className="flex items-center gap-2">
           {lastUpdated && (
                <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
                     <Clock className="h-3 w-3" /> Updated: {lastUpdated.toLocaleTimeString()}
                </span>
           )}
          <Button 
            onClick={fetchData} 
            disabled={isLoading}
            variant="outline"
            className="border-slate-200 hover:bg-white hover:text-blue-600 transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 border-y border-r border-blue-50 shadow-sm bg-white/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Beneficiaries</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.totalProjects}</div>
            <p className="text-xs text-slate-400 mt-1">Total registered projects</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 border-y border-r border-purple-50 shadow-sm bg-white/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Active Companies</CardTitle>
            <div className="p-2 bg-purple-50 rounded-lg">
                <Activity className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{isLoading ? "..." : data.length}</div>
            <p className="text-xs text-slate-400 mt-1">Operating districts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 border-y border-r border-green-50 shadow-sm bg-white/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Sanctioned</CardTitle>
            <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.totalSanctioned}</div>
            <p className="text-xs text-slate-400 mt-1">Total sanctioned units</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 border-y border-r border-orange-50 shadow-sm bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-slate-500">Completion Rate</CardTitle>
                <div className="p-2 bg-orange-50 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-800">{isLoading ? "..." : stats.completionRate}%</div>
                <p className="text-xs text-slate-400 mt-1">Installation complete</p>
            </CardContent>
        </Card>
      </div>

      {/* Main Data Table */}
      <Card className="border border-slate-200 shadow-lg shadow-slate-200/50 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">Master Tracking Sheet</CardTitle>
                    <p className="text-sm text-slate-500">Auto-aggregated by Company & District from source data</p>
                </div>
                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600">
                    <PlayCircle className="h-3 w-3 mr-1 text-green-500" /> Live Data
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                <Table className="w-full text-sm text-left border-collapse">
                    <TableHeader className="bg-slate-50/80 sticky top-0 z-10 shadow-sm">
                        <TableRow className="border-b border-slate-200 hover:bg-transparent">
                            <TableHead className="h-12 px-4 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap bg-slate-50/90 backdrop-blur border-r border-slate-200/50 min-w-[150px]">Company</TableHead>
                            <TableHead className="h-12 px-4 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap bg-slate-50/90 backdrop-blur border-r border-slate-200/50 min-w-[120px]">District</TableHead>
                            <TableHead className="h-12 px-4 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap bg-slate-50/90 backdrop-blur border-r border-slate-200/50 min-w-[120px]">Installer</TableHead>
                            
                            {/* <TableHead className="h-12 px-4 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap bg-slate-50/90 backdrop-blur border-r border-slate-200/50 text-center min-w-[80px]">Capacity</TableHead> */}
                            <TableHead className="h-12 px-4 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap bg-slate-50/90 backdrop-blur border-r border-slate-200/50 text-center min-w-[80px]">Target</TableHead>
                            <TableHead className="h-12 px-4 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap bg-slate-50/90 backdrop-blur border-r border-slate-200/50 text-center min-w-[80px]">Sanction</TableHead>
                            <TableHead className="h-12 px-4 font-bold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap bg-slate-50/90 backdrop-blur border-r border-slate-200/50 text-center min-w-[80px]">Balance</TableHead>
                            
                            {/* Foundation Group */}
                            <TableHead className="h-12 px-2 font-bold text-blue-700 text-xs uppercase tracking-wider whitespace-nowrap bg-blue-50/50 border-r border-blue-100 text-center min-w-[100px]">Fnd. Dispatch</TableHead>
                            <TableHead className="h-12 px-2 font-bold text-blue-700 text-xs uppercase tracking-wider whitespace-nowrap bg-blue-50/50 border-r border-slate-200/50 text-center min-w-[100px]">Fnd. Complete</TableHead>

                            {/* Installation Group */}
                            <TableHead className="h-12 px-2 font-bold text-purple-700 text-xs uppercase tracking-wider whitespace-nowrap bg-purple-50/50 border-r border-purple-100 text-center min-w-[100px]">Inst. Dispatch</TableHead>
                            <TableHead className="h-12 px-2 font-bold text-purple-700 text-xs uppercase tracking-wider whitespace-nowrap bg-purple-50/50 border-r border-slate-200/50 text-center min-w-[100px]">Inst. Complete</TableHead>

                            <TableHead className="h-12 px-4 font-bold text-emerald-700 text-xs uppercase tracking-wider whitespace-nowrap bg-emerald-50/50 text-center min-w-[100px]">Payment Done</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                             Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse border-b border-slate-100">
                                    {Array.from({ length: 11 }).map((__, j) => (
                                        <TableCell key={j} className="p-3">
                                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                             ))
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-64 text-center text-red-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertCircle className="h-8 w-8" />
                                        <p>{error}</p>
                                        <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">Try Again</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-64 text-center text-slate-400">
                                    No data found in Project Main.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow key={row.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                                    <TableCell className="font-medium text-slate-800 border-r border-slate-100">{row.company}</TableCell>
                                    <TableCell className="text-slate-600 border-r border-slate-100">{row.district}</TableCell>
                                    <TableCell className="text-slate-600 border-r border-slate-100">{row.installer}</TableCell>
                                    
                                    {/* <TableCell className="text-slate-600 text-center border-r border-slate-100 font-mono text-xs">{row.capacity}</TableCell> */}
                                    
                                    <TableCell className="text-slate-400 text-center border-r border-slate-100 font-mono text-xs">-</TableCell> {/* Target Placeholder */}
                                    
                                    <TableCell className="text-blue-600 font-semibold text-center border-r border-slate-100 font-mono text-xs bg-blue-50/30">{row.sanction}</TableCell>
                                    <TableCell className="text-slate-400 text-center border-r border-slate-100 font-mono text-xs">-</TableCell> {/* Balance Placeholder */}
                                    
                                    <TableCell className="text-center border-r border-slate-100 text-slate-600 text-xs">{row.foundationDispatch}</TableCell>
                                    <TableCell className="text-center border-r border-slate-100 text-slate-600 text-xs bg-green-50/20">{row.foundationComplete}</TableCell>
                                    
                                    <TableCell className="text-center border-r border-slate-100 text-slate-600 text-xs">{row.installationDispatch}</TableCell>
                                    <TableCell className="text-center border-r border-slate-100 text-slate-600 text-xs bg-green-50/20">{row.installationComplete}</TableCell>
                                    
                                    <TableCell className="text-center font-bold text-emerald-600 bg-emerald-50/30">{row.paymentDone}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}