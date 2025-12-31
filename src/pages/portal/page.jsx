import { useState, useEffect } from "react";
import { Card, CardContent, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
export default function PortalPage() {
    const [open, setOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
            const sheetId = import.meta.env.VITE_SHEET_ID;

            if (!scriptUrl || !sheetId) {
                throw new Error("Configuration missing: Check .env for Script URL and Sheet ID");
            }

            // Using both 'sheet' and 'sheetName' parameters for compatibility consistency
            const params = new URLSearchParams({
                action: 'read',
                sheet: 'Project Main', 
                sheetName: 'Project Main',
                id: sheetId.trim()
            });

            const response = await fetch(`${scriptUrl}?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const result = await response.json();
            
            // Handle App Script response wrapper
            if (result.success === false) {
                 throw new Error(result.error || "Sheet API returned an error");
            }

            const rawRows = Array.isArray(result) ? result : (result.data || []);
            console.log("Raw Rows received:", rawRows); // Debug log for user

            if (rawRows.length === 0) {
                setHistory([]);
                return;
            }

            // Robust Header Detection: Look for specific columns in the first 10 rows
            let headerRowIndex = -1;
            const targetColumns = ["regid", "beneficiaryname", "village"]; // Key columns to identify header row

            for(let i=0; i < Math.min(rawRows.length, 10); i++) {
                const row = rawRows[i];
                if (!Array.isArray(row)) continue;
                
                // Check if this row contains our target columns
                const normalizedRow = row.map(c => String(c).toLowerCase().replace(/\s+/g, ''));
                const matchCount = targetColumns.filter(col => normalizedRow.includes(col)).length;
                
                if (matchCount >= 2) { // logic: if at least 2 key columns are found, it's the header
                    headerRowIndex = i;
                    console.log("Header row found at index:", i);
                    break;
                }
            }

            // Fallback: If not found, assume Row 6 (Index 5) as per screenshot
            if (headerRowIndex === -1 && rawRows.length > 5) {
                console.warn("Could not auto-detect header row. Falling back to Index 5 (Row 6).");
                headerRowIndex = 5;
            } else if (headerRowIndex === -1) {
                 throw new Error("Could not identify header row in Sheet");
            }

            const headers = rawRows[headerRowIndex].map(h => String(h).trim().toLowerCase());
            console.log("Headers used:", headers);

            // Helper to fuzzy find column index
            // We search for key words like 'reg' and 'id' for 'Reg ID'
            const findCol = (keywords) => {
                 return headers.findIndex(h => keywords.every(k => h.includes(k)));
            }

            const colMap = {
                serialNo: findCol(['serial']),
                regId: findCol(['reg', 'id']),
                beneficiaryName: findCol(['beneficiary', 'name']),
                fatherName: findCol(['father']),
                village: findCol(['village']),
                block: findCol(['block']),
                district: findCol(['district']),
                category: findCol(['category']),
                pumpSource: findCol(['pump', 'source']),
                pumpType: findCol(['pump', 'type']),
                company: findCol(['company'])
            };

            console.log("Column Mapping:", colMap);

            const parsedData = [];
            
            // Iterate data rows (skip headers)
            for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
                const row = rawRows[i];
                if (!row || row.length === 0) continue;

                // Basic validation: ensure we have data at the Reg ID index
                if (colMap.regId === -1 || !row[colMap.regId]) continue;

                parsedData.push({
                    serialNo: row[colMap.serialNo] || "-",
                    regId: row[colMap.regId] || "-",
                    beneficiaryName: row[colMap.beneficiaryName] || "-",
                    fatherName: row[colMap.fatherName] || "-",
                    village: row[colMap.village] || "-",
                    block: row[colMap.block] || "-",
                    district: row[colMap.district] || "-",
                    category: row[colMap.category] || "-",
                    pumpSource: row[colMap.pumpSource] || "-",
                    pumpType: row[colMap.pumpType] || "-",
                    company: row[colMap.company] || "-"
                });
            }

            console.log("Parsed Data:", parsedData);
            setHistory(parsedData);
            setIsLoaded(true);

        } catch (err) {
            console.error("Fetch Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // (Removed localStorage save logic as we are now syncing from Sheet)

    const [searchTerm, setSearchTerm] = useState("");

    const filteredHistory = history.filter((item) =>
      Object.values(item).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    const [formData, setFormData] = useState({
        regId: "",
        beneficiaryName: "",
        fatherName: "",
        village: "",
        block: "",
        district: "",
        category: "",
        pumpSource: "",
        pumpType: "",
        company: "",
    });
    const generateSerialNo = () => {
        // Simple auto-increment based on history length + timestamp for uniqueness
        const timestamp = Date.now().toString().slice(-6);
        const count = history.length + 1;
        return `SR${count.toString().padStart(4, "0")}-${timestamp}`;
    };
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    const handleSubmit = () => {
        const newEntry = {
            ...formData,
            serialNo: generateSerialNo(),
        };
        setHistory([newEntry, ...history]); // Add to top
        setOpen(false);
        // Reset form
        setFormData({
            regId: "",
            beneficiaryName: "",
            fatherName: "",
            village: "",
            block: "",
            district: "",
            category: "",
            pumpSource: "",
            pumpType: "",
            company: "",
        });
    };
    return (<div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">

      {/* Search and Add Button Removed as per request, Form preserved below */}
      <Dialog open={open} onOpenChange={setOpen}>
          {/* Trigger removed */}
          <DialogContent className="max-w-2xl max-h-[75vh] md:max-h-[80vh] flex flex-col p-6 overflow-visible">
            <DialogHeader className="shrink-0">
              <DialogTitle className="bg-linear-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent pb-1">
                Beneficiary Registration
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="regId" className="text-sm font-medium text-slate-700">
                    Reg ID
                  </Label>
                  <Input id="regId" name="regId" value={formData.regId} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="Enter Reg ID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Category
                  </Label>
                  <Input id="category" name="category" value={formData.category} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="Enter Category" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="beneficiaryName" className="text-sm font-medium text-slate-700">
                    Beneficiary Name
                  </Label>
                  <Input id="beneficiaryName" name="beneficiaryName" value={formData.beneficiaryName} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="Enter Beneficiary Name" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="fatherName" className="text-sm font-medium text-slate-700">
                    Father's Name
                  </Label>
                  <Input id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="Enter Father's Name" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="village" className="text-sm font-medium text-slate-700">
                    Village
                  </Label>
                  <Input id="village" name="village" value={formData.village} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="Village Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block" className="text-sm font-medium text-slate-700">
                    Block
                  </Label>
                  <Input id="block" name="block" value={formData.block} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="Block Name" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="district" className="text-sm font-medium text-slate-700">
                    District
                  </Label>
                  <Input id="district" name="district" value={formData.district} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="District Name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pumpSource" className="text-sm font-medium text-slate-700">
                    Pump Source
                  </Label>
                  <Input id="pumpSource" name="pumpSource" value={formData.pumpSource} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="Source" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pumpType" className="text-sm font-medium text-slate-700">
                    Pump Type
                  </Label>
                  <Input id="pumpType" name="pumpType" value={formData.pumpType} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="Type" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company" className="text-sm font-medium text-slate-700">
                    Company
                  </Label>
                  <Input id="company" name="company" value={formData.company} onChange={handleInputChange} className="h-10 text-sm focus-visible:ring-blue-100" placeholder="Company Name" />
                </div>
              </div>
            </div>
            <div className="flex justify-end items-center gap-3 mt-4 pt-4 border-t shrink-0 bg-slate-50/50 -mx-6 px-6 -mb-4 pb-4">
              <Button variant="outline" onClick={() => setOpen(false)} className="h-10 min-w-[100px]">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 h-10 min-w-[100px] shadow-sm">
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      <Card className="border border-blue-200 shadow-lg overflow-hidden">
        <CardContent className="pt-6">
            {/* Desktop Table View */}
              <div className="hidden md:block border rounded-lg min-h-[60px] overflow-hidden max-h-[70vh] overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <Table>
                  <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-blue-50 shadow-sm">
                    <TableRow className="border-b border-blue-200 hover:bg-transparent">
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center w-[100px]">
                        Serial No
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">
                        Reg ID
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center min-w-[150px]">
                        Beneficiary Name
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center min-w-[150px]">
                        Father's Name
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">
                        Village
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">
                        Block
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">
                        District
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">
                        Category
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">
                        Pump Source
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">
                        Pump Type
                      </TableHead>
                      <TableHead className="h-10 px-4 py-3 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">
                        Company
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`} className="animate-pulse">
                          <TableCell><div className="h-4 w-8 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-16 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-32 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-24 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-12 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-16 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-16 bg-slate-200 rounded mx-auto"></div></TableCell>
                          <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                        </TableRow>
                      ))
                    ) : filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-32 text-center text-muted-foreground bg-slate-50/50">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <Search className="h-8 w-8 text-slate-300 mb-2" />
                                <p>No matching records found.</p>
                            </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((item) => (
                        <TableRow key={item.serialNo} className="hover:bg-blue-50/30 transition-colors">
                          <TableCell className="font-medium text-center text-sm text-slate-600">
                            {item.serialNo}
                          </TableCell>
                          <TableCell className="text-center text-sm">{item.regId}</TableCell>
                          <TableCell className="text-center font-medium text-slate-800 text-sm">{item.beneficiaryName}</TableCell>
                          <TableCell className="text-center text-slate-600 text-sm">{item.fatherName}</TableCell>
                          <TableCell className="text-center text-slate-600 text-sm">{item.village}</TableCell>
                          <TableCell className="text-center text-slate-600 text-sm">{item.block}</TableCell>
                          <TableCell className="text-center text-slate-600 text-sm">{item.district}</TableCell>
                          <TableCell className="text-center text-slate-600 text-sm">{item.category}</TableCell>
                          <TableCell className="text-center text-slate-600 text-sm">{item.pumpSource}</TableCell>
                          <TableCell className="text-center text-slate-600 text-sm">{item.pumpType}</TableCell>
                          <TableCell className="text-center text-slate-600 text-sm">{item.company}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <Card key={`skeleton-mobile-${index}`} className="p-4 border-l-4 border-slate-200 shadow-sm animate-pulse">
                            <div className="space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-10 bg-slate-200 rounded"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-10 bg-slate-200 rounded"></div>
                                    <div className="h-10 bg-slate-200 rounded"></div>
                                    <div className="h-10 bg-slate-200 rounded"></div>
                                    <div className="h-10 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground bg-slate-50/50 rounded-lg border border-dashed border-gray-200">
                      <p className="mb-4 text-sm">No records found.</p>
                      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                          + Add New
                      </Button>
                  </div>
                ) : (
                  filteredHistory.map((item) => (<Card key={item.serialNo} className="p-4 border-l-4 border-l-cyan-500 shadow-sm">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-semibold text-cyan-800">
                          Serial No:
                        </span>
                        <span className="font-mono text-xs">
                          {item.serialNo}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-x-4 gap-y-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Reg ID
                            </span>
                            <span className="font-medium">{item.regId}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Beneficiary Name
                            </span>
                            <span className="font-medium">
                              {item.beneficiaryName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Father's Name
                            </span>
                            <span className="font-medium">
                              {item.fatherName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Village
                            </span>
                            <span className="font-medium">{item.village}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-2">
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Block
                            </span>
                            <span className="font-medium">{item.block}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs block">
                              District
                            </span>
                            <span className="font-medium">{item.district}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Category
                            </span>
                            <span className="font-medium">{item.category}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Pump Source
                            </span>
                            <span className="font-medium">
                              {item.pumpSource}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Pump Type
                            </span>
                            <span className="font-medium">{item.pumpType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs block">
                              Company
                            </span>
                            <span className="font-medium">{item.company}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>)))}
              </div>

        </CardContent>
      </Card>
    </div>);
}
