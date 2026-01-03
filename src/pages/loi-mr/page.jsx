import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pencil, FileCheck, Upload, CheckCircle2, Search } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoiMrPage() {
  const [pendingItems, setPendingItems] = useState([])
  const [historyItems, setHistoryItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedRows, setSelectedRows] = useState([])
  const [isBulk, setIsBulk] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPendingItems = pendingItems.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const filteredHistoryItems = historyItems.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(filteredPendingItems.map(item => item.serialNo))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (serialNo, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, serialNo])
    } else {
      setSelectedRows(prev => prev.filter(id => id !== serialNo))
    }
  }

  // Form state for processing
  const [formData, setFormData] = useState({
    beneficiaryName: "",
    company: "",
    installer: "",
    otherRemark: "",
    loiFileName: null,
    loiFileObj: null, // Store actual file data
    mrNo: "",
    mrDate: "",
    amount: "",
    paidBy: "",
    beneficiaryShare: "",
  })

  // Dynamic Dropdown Options
  const [installerOptions, setInstallerOptions] = useState([])
  const [beneficiaryShareOptions, setBeneficiaryShareOptions] = useState([])
  
  // Store exact header names from sheet for submission
  const [sheetHeaders, setSheetHeaders] = useState({})
  const [columnMapping, setColumnMapping] = useState({}) // Defined here

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null)

  // Fetch data from sheet
  const fetchData = async () => {
    setIsLoading(true);
    try {
        const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
        const sheetId = import.meta.env.VITE_SHEET_ID;

        if (!scriptUrl || !sheetId) {
            console.error("Configuration missing");
            setIsLoading(false);
            return;
        }

        const params = new URLSearchParams({
            action: 'read',
            sheet: 'Project Main',
            sheetName: 'Project Main',
            id: sheetId.trim()
        });

        const response = await fetch(`${scriptUrl}?${params.toString()}`);
        if (!response.ok) throw new Error("Network Error");
        
        const result = await response.json();
        const rawRows = Array.isArray(result) ? result : (result.data || []);

        if (rawRows.length === 0) {
            setPendingItems([]);
            setIsLoading(false);
            return;
        }

        // Header Detection Logic
        let headerRowIndex = -1;
        const targetColumns = ["regid", "beneficiaryname", "village"];
        
        for(let i=0; i < Math.min(rawRows.length, 10); i++) {
            const row = rawRows[i];
            if (!Array.isArray(row)) continue;
            const normalizedRow = row.map(c => String(c).toLowerCase().replace(/\s+/g, ''));
            if (targetColumns.filter(col => normalizedRow.includes(col)).length >= 2) {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1 && rawRows.length > 5) headerRowIndex = 5;

        // CRITICAL FIX: If header still not found, prevent crash
        if (headerRowIndex === -1 || !rawRows[headerRowIndex]) {
            console.error("Could not identify header row");
            setIsLoading(false);
            return;
        }

        const rawHeaders = rawRows[headerRowIndex].map(h => String(h).trim()); // Original case headers
        const headers = rawHeaders.map(h => h.toLowerCase());
        const findCol = (keywords) => headers.findIndex(h => keywords.every(k => h.includes(k)));

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
            planned1: findCol(['planned', '1']), // Changed from 'pending' to 'planned 1'
            actual1: findCol(['actual', '1']),
            delay1: findCol(['delay', '1']), // Added delay1
            company: findCol(['company']),
            installer: findCol(['installer']),
            loiFileName: findCol(['loi', 'file']),
            mrNo: findCol(['mr', 'no']),
            mrDate: findCol(['mr', 'date']),
            amount: findCol(['amount']),
            paidBy: findCol(['paid', 'by']),
            beneficiaryShare: findCol(['share']),
            otherRemark: findCol(['remark'])
        };

        // Store actual header names for submission
        const detectedHeaders = {};
        Object.keys(colMap).forEach(key => {
            if (colMap[key] !== -1) {
                detectedHeaders[key] = rawHeaders[colMap[key]];
            }
        });
        setSheetHeaders(detectedHeaders);
        setColumnMapping(colMap); // Store indices for handleSubmit

        const parsedPending = [];
        const parsedHistory = [];

        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length === 0) continue;
            
            if (colMap.regId === -1 || !row[colMap.regId]) continue;
            
            // Map row data
            const item = {
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
                company: row[colMap.company] || "-",
                installer: row[colMap.installer] || "",
                loiFileName: row[colMap.loiFileName] || "",
                mrNo: row[colMap.mrNo] || "",
                mrDate: row[colMap.mrDate] || "",
                amount: row[colMap.amount] || "",
                paidBy: row[colMap.paidBy] || "",
                beneficiaryShare: row[colMap.beneficiaryShare] || "",
                otherRemark: row[colMap.otherRemark] || "",
                actual1: row[colMap.actual1] || "",
                planned1: row[colMap.planned1] || "",
                rowIndex: i + 1 
            };

            const isPlannedFilled = item.planned1 && String(item.planned1).trim() !== "";
            const isActualEmpty = !item.actual1 || String(item.actual1).trim() === "";

            if (isPlannedFilled && isActualEmpty) {
                parsedPending.push(item);
            } else if (item.actual1 && String(item.actual1).trim() !== "") {
                parsedHistory.push(item);
            }

        }

        setPendingItems(parsedPending);
setHistoryItems(parsedHistory); // History tab will be empty logic-wise
        setIsLoaded(true);

    } catch (e) {
        console.error("Error fetching data:", e);
    } finally {
        setIsLoading(false);
    }
  };

  // Fetch Master Data for Dropdowns
  const fetchMasterData = async () => {
    try {
        const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
        const sheetId = import.meta.env.VITE_SHEET_ID;

        if (!scriptUrl || !sheetId) return;

        const params = new URLSearchParams({
            action: 'read',
            sheet: 'Master Drop-Down',
            sheetName: 'Master Drop-Down',
            id: sheetId.trim()
        });

        const response = await fetch(`${scriptUrl}?${params.toString()}`);
        if (!response.ok) return;
        
        const result = await response.json();
        const rawRows = Array.isArray(result) ? result : (result.data || []);

        if (rawRows.length < 2) return; // Need at least header + 1 row

        // Find headers
        const headers = rawRows[0].map(h => String(h).trim().toLowerCase());
        const installerColIdx = headers.findIndex(h => h.includes('installer'));
        // Check for both likely spellings of beneficiary
        const shareColIdx = headers.findIndex(h => h.includes('share') && (h.includes('beneficiary') || h.includes('benificiary')));

        if (installerColIdx === -1 && shareColIdx === -1) return;

        const installers = new Set();
        const shares = new Set();

        for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row) continue;

            if (installerColIdx !== -1 && row[installerColIdx]) {
                installers.add(String(row[installerColIdx]).trim());
            }
            if (shareColIdx !== -1 && row[shareColIdx]) {
                shares.add(String(row[shareColIdx]).trim());
            }
        }

        setInstallerOptions(Array.from(installers).filter(Boolean).sort());
        setBeneficiaryShareOptions(Array.from(shares).filter(Boolean).sort());

    } catch (e) {
        console.error("Error fetching master data:", e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMasterData();
  }, [])

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsDialogOpen(false);
        setTimeout(() => setIsSuccess(false), 300);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const handleActionClick = (item) => {
    setSelectedItem(item)
    setIsBulk(false)
    setIsSuccess(false)
    setFormData({
      beneficiaryName: item.beneficiaryName,
      company: item.company,
      installer: "",
      otherRemark: "",
      loiFileName: null,
      loiFileObj: null,
      mrNo: "",
      mrDate: "",
      amount: "",
      paidBy: "",
      beneficiaryShare: "",
    })
    setIsDialogOpen(true)
  }

  const handleBulkClick = () => {
    if (selectedRows.length < 2) return
    setSelectedItem(null)
    setIsBulk(true)
    setIsSuccess(false)
    setFormData({
      beneficiaryName: "Multiple Beneficiaries",
      company: "Multiple Companies",
      installer: "",
      otherRemark: "",
      loiFileName: null,
      loiFileObj: null,
      mrNo: "",
      mrDate: "",
      amount: "",
      paidBy: "",
      beneficiaryShare: "",
    })
    setIsDialogOpen(true)
  }

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ 
        ...formData, 
        loiFileName: file.name,
        loiFileObj: file
      })
    }
  }

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  // ✅ Format date as YYYY-MM-DD HH:mm:ss (Google Sheet friendly)
  const formatDateTime = (date) => {
    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
          `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  // ✅ Convert Drive download link to preview link
  const getPreviewUrl = (url) => {
    if (!url) return url;

    // Already preview
    if (url.includes("/preview")) return url;

    // Extract Google Drive File ID
    const match = url.match(/[-\w]{25,}/);
    if (!match) return url;

    const fileId = match[0];
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const handleSubmit = async () => {
    if (!selectedItem && !isBulk) return;
    setIsSubmitting(true);

    try {
      const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
      const sheetId = import.meta.env.VITE_SHEET_ID;

      let finalFileUrl = "";

      // 1. Upload File (Once for all if bulk)
      if (formData.loiFileObj) {
        const base64 = await getBase64(formData.loiFileObj);

        const uploadBody = new URLSearchParams({
          action: "uploadFile",
          base64Data: base64,
          fileName: formData.loiFileObj.name,
          mimeType: formData.loiFileObj.type,
          folderId: import.meta.env.VITE_DRIVE_DOC_FOLDER_ID,
        });

        const DRIVE_FOLDER_ID = import.meta.env.VITE_DRIVE_DOC_FOLDER_ID;

        if (!DRIVE_FOLDER_ID) {
          throw new Error("Drive Folder ID missing in .env");
        }

        const upRes = await fetch(scriptUrl, {
          method: "POST",
          body: uploadBody,
        });

        const upResult = await upRes.json();

        if (!upResult.success || !upResult.fileUrl) {
          throw new Error("File upload failed");
        }

        finalFileUrl = upResult.fileUrl; // ✅ Drive link
      }

      // 2. Prepare Data Update
      const itemsToProcess = isBulk 
        ? pendingItems.filter(item => selectedRows.includes(item.serialNo))
        : [selectedItem];

      const updatePromises = itemsToProcess.map(async (item) => {
        const rowUpdate = {};
        const addToUpdate = (key, value) => {
            const idx = columnMapping[key];
            if (idx !== undefined && idx >= 0 && value !== "") {
                rowUpdate[idx] = value;
            }
        };

        addToUpdate('installer', formData.installer);
        addToUpdate('beneficiaryShare', formData.beneficiaryShare);
        addToUpdate('mrNo', formData.mrNo ? `'${formData.mrNo}` : "");
        addToUpdate('mrDate', formData.mrDate);
        addToUpdate('amount', formData.amount);
        addToUpdate('paidBy', formData.paidBy);
        addToUpdate('otherRemark', formData.otherRemark);
        addToUpdate('actual1', formatDateTime(new Date()));
        
        if (finalFileUrl) addToUpdate('loiFileName', finalFileUrl);

        const payload = new URLSearchParams({
            action: 'update',
            sheetName: 'Project Main',
            id: sheetId,
            rowIndex: item.rowIndex,
            rowData: JSON.stringify(rowUpdate)
        });

        return fetch(scriptUrl, {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: payload.toString()
        });
      });

      await Promise.all(updatePromises);

      setIsSuccess(true);
      fetchData();
      if (isBulk) setSelectedRows([]); // Clear selection after bulk process

    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen animate-fade-in-up">
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 relative p-1 bg-slate-100/80 h-14 rounded-xl border border-slate-200">
          <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.5rem)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out ${activeTab === 'history' ? 'translate-x-full' : 'translate-x-0'}`} />
          <TabsTrigger value="pending" className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500">
            Pending LOI & MR
          </TabsTrigger>
          <TabsTrigger value="history" className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500">
            Processed History
          </TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent value="pending" className="mt-6 focus-visible:outline-hidden">
          <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-3 flex flex-col md:flex-row items-center gap-4 md:gap-0 justify-between h-auto min-h-[3.5rem]">
              <div className="flex items-center gap-2 w-full md:w-auto justify-between">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  Pending LOI & MR
                </CardTitle>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                 <div className="relative w-full md:w-100">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white border-black focus-visible:ring-blue-200 h-9 transition-all hover:border-blue-200"
                    />
                 </div>
                 
                 <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  {selectedRows.length >= 2 && (
                    <Button 
                      onClick={handleBulkClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 transition-all duration-300 animate-in fade-in slide-in-from-right-4 h-9"
                      size="sm"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Process Selected ({selectedRows.length})
                    </Button>
                  )}
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1 h-9 flex items-center">
                    {filteredPendingItems.length} Pending
                  </Badge>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <Table className="[&_th]:text-center [&_td]:text-center">
                  <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-blue-50 shadow-sm">
                    <TableRow className="border-b border-blue-100 hover:bg-transparent">
                      <TableHead className="h-14 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap w-12">
                        Select
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap w-32">Action</TableHead>

                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Reg ID</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Father's Name</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Village</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Block</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">District</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Category</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Pump Source</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Pump Type</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Company</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, index) => (
                            <TableRow key={`skeleton-${index}`} className="animate-pulse">
                                <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-12 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-24 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-32 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-28 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-24 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-24 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-24 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-16 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-24 bg-slate-200 rounded mx-auto"></div></TableCell>
                                <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                            </TableRow>
                        ))
                    ) : filteredPendingItems.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={13} className="h-32 text-center text-muted-foreground">
                                No pending items found matching your search.
                            </TableCell>
                        </TableRow>
                    ) : (
                      filteredPendingItems.map((item) => (
                        <TableRow key={item.serialNo} className="hover:bg-blue-50/50 transition-colors">
                          <TableCell className="px-4">
                            <div className="flex justify-center">
                              <Checkbox 
                                checked={selectedRows.includes(item.serialNo)}
                                onCheckedChange={(checked) => handleSelectRow(item.serialNo, checked)}
                                aria-label={`Select row ${item.serialNo}`}
                                className="checkbox-3d border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-5 w-5 shadow-sm transition-all duration-300 ease-out active:scale-75 hover:scale-110 data-[state=checked]:scale-110"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActionClick(item)}
                              disabled={selectedRows.length >= 2}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 shadow-xs text-xs font-semibold h-8 px-4 rounded-full flex items-center gap-2 transition-all duration-300 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Process
                            </Button>
                          </TableCell>

                          <TableCell className="text-slate-600 font-mono text-xs">{item.regId}</TableCell>
                          <TableCell className="font-medium text-slate-800">{item.beneficiaryName}</TableCell>
                          <TableCell className="text-slate-600">{item.fatherName}</TableCell>
                          <TableCell className="text-slate-600">{item.village}</TableCell>
                          <TableCell className="text-slate-600">{item.block}</TableCell>
                          <TableCell className="text-slate-600">{item.district}</TableCell>
                          <TableCell className="text-slate-600">{item.category}</TableCell>
                          <TableCell className="text-slate-600">{item.pumpSource}</TableCell>
                          <TableCell className="text-slate-600">{item.pumpType}</TableCell>
                          <TableCell className="text-slate-600 font-medium">{item.company}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="mt-6 focus-visible:outline-hidden">
          <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-3 flex flex-col md:flex-row items-center gap-4 md:gap-0 justify-between h-auto min-h-[3.5rem]">
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    <div className="p-1 bg-blue-100 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </div>
                    Processed History
                  </CardTitle>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                     <div className="relative w-full md:w-100">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white border-black focus-visible:ring-blue-200 h-9 transition-all hover:border-blue-200"
                        />
                     </div>
                     <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 h-9 flex items-center whitespace-nowrap">
                        {filteredHistoryItems.length} Records
                     </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="hidden md:block overflow-x-auto max-h-[70vh] overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <Table className="[&_th]:text-center [&_td]:text-center">
                  <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-blue-50 shadow-sm">
                    <TableRow className="border-b border-blue-100 hover:bg-transparent">

                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Reg ID</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Father's Name</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Village</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Block</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">District</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Category</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Pump Source</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Pump Type</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Company</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Installer</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Other Remark</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">LOI Document</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">MR No</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">MR Date</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Amount</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Paid By</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Beneficiary Share</TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={`history-skeleton-${index}`} className="animate-pulse">
                          {Array.from({ length: 28 }).map((__, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded mx-auto"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredHistoryItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={28} className="h-48 text-center text-slate-500 bg-slate-50/30">
                          {historyItems.length === 0 ? "No foundation history found." : "No history records found matching your search."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistoryItems.map((item) => (
                        <TableRow key={item.serialNo} className="hover:bg-blue-50/30 transition-colors">

                          <TableCell className="text-slate-600 font-mono text-xs">{item.regId}</TableCell>
                          <TableCell className="font-medium text-slate-800">{item.beneficiaryName}</TableCell>
                          <TableCell className="text-slate-600">{item.fatherName}</TableCell>
                          <TableCell className="text-slate-600">{item.village}</TableCell>
                          <TableCell className="text-slate-600">{item.block}</TableCell>
                          <TableCell className="text-slate-600">{item.district}</TableCell>
                          <TableCell className="text-slate-600">{item.category}</TableCell>
                          <TableCell className="text-slate-600">{item.pumpSource}</TableCell>
                          <TableCell className="text-slate-600">{item.pumpType}</TableCell>
                          <TableCell className="text-slate-600">{item.company}</TableCell>
                          <TableCell className="text-slate-600">{item.installer || "-"}</TableCell>
                          <TableCell className="text-slate-500 italic">{item.otherRemark || "-"}</TableCell>
                          <TableCell>
                            {item.loiFileName ? (
                              item.loiFileName.startsWith('http') ? (
                                <a 
                                  href={getPreviewUrl(item.loiFileName)}
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 underline text-xs cursor-pointer hover:text-blue-800 flex items-center justify-center gap-1"
                                >
                                  <Upload className="h-4 w-4" />
                                  View Document
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs flex items-center justify-center gap-1">
                                  <FileCheck className="h-4 w-4" />
                                  {item.loiFileName}
                                </span>
                              )
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600">{item.mrNo || "-"}</TableCell>
                          <TableCell className="text-slate-600">{item.mrDate || "-"}</TableCell>
                          <TableCell className="font-medium text-slate-800">₹{item.amount || "0"}</TableCell>
                          <TableCell className="text-slate-600">{item.paidBy || "-"}</TableCell>
                          <TableCell className="text-slate-600">{item.beneficiaryShare || "-"}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 shadow-sm border border-green-200">Processing Complete</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        {/* PROCESSING DIALOG */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent showCloseButton={!isSuccess} className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isSuccess ? "bg-transparent !shadow-none !border-none" : ""}`}>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center w-full p-8 text-center space-y-6 animate-in fade-in duration-300">
                <div className="rounded-full bg-white p-5 shadow-2xl shadow-white/20 ring-8 ring-white/10 animate-in zoom-in duration-500 ease-out">
                  <CheckCircle2 className="h-16 w-16 text-green-600 scale-110" />
                </div>
                <h2 className="text-3xl font-bold text-white drop-shadow-md animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150 ease-out tracking-wide">
                  Submitted Successfully!
                </h2>
              </div>
            ) : (
              <>
            {/* Header Content */}
            <DialogHeader className="p-6 pb-2 border-b border-blue-100 bg-blue-50/30">
                <DialogTitle className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                    <span className="bg-blue-100 p-1.5 rounded-md">
                        <Pencil className="h-4 w-4 text-blue-600" />
                    </span>
                    {isBulk ? `Batch Process Items` : `Process LOI & MR`}
                </DialogTitle>
                <DialogDescription className="text-slate-500 ml-10">
                     {isBulk ? (
                        <span>Applying changes to <span className="font-bold text-blue-700">{selectedRows.length} selected items</span>. All fields below will be updated for these items.</span>
                     ) : (
                        <span>Processing application for <span className="font-semibold text-slate-700">{selectedItem?.beneficiaryName}</span> <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600 border border-slate-200">{selectedItem?.serialNo}</span></span>
                     )}
                </DialogDescription>
            </DialogHeader>

            {(selectedItem || isBulk) && (
              <div className="p-6 space-y-6">
                {/* Beneficiary Info - Read Only (Hide in Bulk Mode) */}
                {!isBulk && selectedItem && (
                  <div className="rounded-xl border border-blue-100 bg-linear-to-br from-blue-50/50 to-blue-50/30 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2 border-b border-blue-100 pb-2">
                      <span className="bg-white p-1 rounded shadow-sm">
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      </span>
                      BENEFICIARY DETAILS
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-1">Reg ID</span>
                        <div className="font-medium text-slate-700 font-mono bg-white/50 px-2 py-1 rounded border border-blue-100/50 inline-block">{selectedItem.regId}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-1">Father's Name</span>
                        <p className="font-medium text-slate-700">{selectedItem.fatherName}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-1">Village & Block</span>
                        <p className="font-medium text-slate-700">{selectedItem.village}, {selectedItem.block}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-1">District</span>
                        <p className="font-medium text-slate-700">{selectedItem.district}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-1">Category</span>
                        <p className="font-medium text-slate-700">{selectedItem.category}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-1">Pump Type</span>
                        <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 shadow-sm font-medium">
                          {selectedItem.pumpType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-1 bg-blue-500 rounded-full"></div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Processing Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Beneficiary Name</Label>
                      <Input
                        value={formData.beneficiaryName}
                        readOnly
                        className="bg-slate-100/50 border-slate-200 text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Company</Label>
                      <Input
                        value={formData.company}
                        readOnly
                        className="bg-slate-100/50 border-slate-200 text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Installer Name</Label>
                      <Select value={formData.installer} onValueChange={(v) => setFormData({ ...formData, installer: v })}>
                        <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-blue-100">
                          <SelectValue placeholder="Select Installer" />
                        </SelectTrigger>
                        <SelectContent>
                          {installerOptions.length > 0 ? (
                            installerOptions.map((opt) => (
                              <SelectItem key={opt} className="focus:bg-blue-50 focus:text-blue-900" value={opt}>
                                {opt}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-slate-500 text-center">Loading...</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>





                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">MR No</Label>
                      <Input
                        value={formData.mrNo}
                        onChange={(e) => setFormData({ ...formData, mrNo: e.target.value })}
                        placeholder="e.g. MR/2025/001"
                        className="border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">MR Date</Label>
                      <Input
                        type="date"
                        value={formData.mrDate}
                        onChange={(e) => setFormData({ ...formData, mrDate: e.target.value })}
                        className="border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Amount (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500">₹</span>
                        <Input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="0.00"
                          className="pl-7 border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Paid By</Label>
                      <Input
                        value={formData.paidBy}
                        onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                        placeholder="Enter payer name"
                        className="border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Beneficiary Share</Label>
                      <Select value={formData.beneficiaryShare} onValueChange={(v) => setFormData({ ...formData, beneficiaryShare: v })}>
                        <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-blue-100">
                          <SelectValue placeholder="Select Share" />
                        </SelectTrigger>
                        <SelectContent>
                          {beneficiaryShareOptions.length > 0 ? (
                            beneficiaryShareOptions.map((opt) => (
                              <SelectItem key={opt} className="focus:bg-blue-50 focus:text-blue-900" value={opt}>
                                {opt}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-slate-500 text-center">Loading...</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-slate-700">LOI Document</Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer group border-blue-100/50 hover:border-blue-200" onClick={() => document.getElementById("loi-upload")?.click()}>
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                             <Upload className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="text-center">
                             <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                                 {formData.loiFileName ? formData.loiFileName : 'Click to Upload LOI Document'}
                             </span>
                             <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, DOCX up to 10MB</p>
                        </div>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="loi-upload"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-slate-700">Other Remark</Label>
                      <Input
                        value={formData.otherRemark}
                        onChange={(e) => setFormData({ ...formData, otherRemark: e.target.value })}
                        placeholder="Any notes..."
                        className="border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10 px-6 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-800">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="h-10 px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 transition-all">
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            )}
            </>
          )} 
          </DialogContent>
        </Dialog>
    </div>
  )
}
