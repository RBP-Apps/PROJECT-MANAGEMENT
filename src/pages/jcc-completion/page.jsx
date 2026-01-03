import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, ClipboardCheck, Upload, FileCheck, Loader2, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function JccCompletionPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [isSuccess, setIsSuccess] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [columnMapping, setColumnMapping] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [isBulk, setIsBulk] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPendingItems = pendingItems.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredHistoryItems = historyItems.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const [formData, setFormData] = useState({
    jccReceivingDate: "",
    jccAgeing: "",
    jccCopy: null,
    invoiceDate: "",
    invoiceNo: "",
    jccCompletionDate: "",
    jccAgeingRbp: "",
  });

  // Helper to construct preview URLs
  const getPreviewUrl = (idOrLink) => {
    if (!idOrLink) return "";
    const idMatch = idOrLink.match(/[-\w]{25,}/);
    const fileId = idMatch ? idMatch[0] : idOrLink;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const fetchData = async () => {
    console.log("Fetching JCC Data...");
    try {
      const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
      const sheetId = import.meta.env.VITE_SHEET_ID;

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
        setPendingItems([]);
        setHistoryItems([]);
        setIsLoading(false);
        return;
      }

      const headerRowIndex = 5; 
      if (!rawRows[headerRowIndex]) {
        setIsLoading(false);
        return;
      }

      const rawHeaders = rawRows[headerRowIndex].map(h => String(h).trim());
      const headers = rawHeaders.map(h => h.toLowerCase());

      const findCol = (keys) =>
        headers.findIndex(h => keys.every(k => h.replace(/\s+/g, "").includes(k)));

      const colMap = {
        serialNo: findCol(["serial"]),
        regId: findCol(["reg", "id"]),
        beneficiaryName: findCol(["beneficiary", "name"]),
        fatherName: findCol(["father"]),
        village: findCol(["village"]),
        block: findCol(["block"]),
        district: findCol(["district"]),
        pumpType: findCol(["pump", "type"]),
        company: findCol(["company"]),
        amount: findCol(["amount"]), // Assuming amount column exists? Check sananction page or similar. Default to empty if not found.
        
        // JCC Specific Columns
        jccReceivingDate: findCol(["jcc", "receiving"]),
        jccCompletionDate: findCol(["jcc", "completion"]),
        // Distinguishing between JCC Ageing (Auto) and JCC Ageing (RBP)
        jccAgeing: findCol(["jcc", "ageing", "auto"]), 
        jccCopy: findCol(["jcc", "copy"]), 
        invoiceDate: findCol(["invoice", "date"]),
        invoiceNo: findCol(["invoice", "no"]),
        jccAgeingRbp: findCol(["jcc", "ageing", "rbp"]),

        // Triggers
        actual6: (() => {
           const i = findCol(["actual", "6"]);
           if (i !== -1) return i;
           return findCol(["insurance"]); 
        })(),
        planned7: findCol(["planned", "7"]), // JCC Planned
        actual7: (() => {
           const i = findCol(["actual", "7"]);
           if (i !== -1) return i;
           return findCol(["jcc"]); 
        })(),
      };
      
      // Fallback for amount if not found (often shared)
      if (colMap.amount === -1) colMap.amount = findCol(["total", "amount"]);

      setColumnMapping(colMap);

      const pending = [];
      const history = [];

      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || !row[colMap.regId]) continue;

        const getVal = (idx) => (idx !== -1 && row[idx] !== undefined) ? row[idx] : "";

        const item = {
          serialNo: getVal(colMap.serialNo),
          regId: getVal(colMap.regId),
          beneficiaryName: getVal(colMap.beneficiaryName),
          fatherName: getVal(colMap.fatherName),
          village: getVal(colMap.village),
          block: getVal(colMap.block),
          district: getVal(colMap.district),
          pumpType: getVal(colMap.pumpType),
          company: getVal(colMap.company),
          amount: getVal(colMap.amount),
          
          // History Data
          jccReceivingDate: getVal(colMap.jccReceivingDate),
          jccCompletionDate: getVal(colMap.jccCompletionDate),
          jccAgeing: getVal(colMap.jccAgeing),
          jccCopy: getVal(colMap.jccCopy),
          invoiceDate: getVal(colMap.invoiceDate),
          invoiceNo: getVal(colMap.invoiceNo),
          jccAgeingRbp: getVal(colMap.jccAgeingRbp),

          actual6: getVal(colMap.actual6),
          planned7: getVal(colMap.planned7),
          actual7: getVal(colMap.actual7),
          rowIndex: i + 1,
        }

        const isPlanned7 = item.planned7 && String(item.planned7).trim() !== "";
        const isJccDone = item.actual7 && String(item.actual7).trim() !== ""; 

        if (isJccDone) {
            history.push(item);
        } else if (isPlanned7) {
            // Planned7 present, JCC NOT Done -> Pending
            pending.push(item);
        }
      }

      setPendingItems(pending);
      setHistoryItems(history);

    } catch (e) {
      console.error("Fetch Data Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setTimeout(() => setIsLoading(false), 15000); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsDialogOpen(false);
        setTimeout(() => setIsSuccess(false), 300);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  // Calculate JCC Ageing when dates change
  useEffect(() => {
    if (formData.jccCompletionDate && formData.jccReceivingDate) {
      const completionDate = new Date(formData.jccCompletionDate);
      const receivingDate = new Date(formData.jccReceivingDate);
      const diffTime = Math.abs(
        completionDate.getTime() - receivingDate.getTime()
      );
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData((prev) => ({ ...prev, jccAgeing: `${diffDays} days` }));
    }
  }, [formData.jccCompletionDate, formData.jccReceivingDate]);

  const handleActionClick = (item) => {
    // alert("Debug: Button Clicked");
    console.log("Process JCC clicked for:", item);
    setIsSuccess(false);
    setIsBulk(false);
    try {
        setSelectedItem(item);
        setFormData({
            jccReceivingDate: item.jccReceivingDate || "",
            jccCompletionDate: item.jccCompletionDate || "",
            jccAgeing: item.jccAgeing || "",
            jccCopy: null, // Always reset file input
            invoiceDate: item.invoiceDate || "",
            invoiceNo: item.invoiceNo || "",
            jccAgeingRbp: item.jccAgeingRbp || "",
        });
        setIsDialogOpen(true);
    } catch(err) {
        console.error("Error opening dialog:", err);
    }
  };

  const handleSelectAll = (checked) => {
      if (checked) {
          setSelectedRows(filteredPendingItems.map((item) => item.serialNo));
      } else {
          setSelectedRows([]);
      }
  };

  const handleSelectRow = (serialNo, checked) => {
      if (checked) {
          setSelectedRows((prev) => [...prev, serialNo]);
      } else {
          setSelectedRows((prev) => prev.filter((id) => id !== serialNo));
      }
  };

  const handleBulkClick = () => {
    setIsBulk(true);
    setSelectedItem(null);
    setIsSuccess(false);
    setFormData({
      jccReceivingDate: "",
      jccAgeing: "",
      jccCopy: null,
      invoiceDate: "",
      invoiceNo: "",
      jccCompletionDate: "",
      jccAgeingRbp: "",
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, jccCopy: e.target.files[0].name });
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem && (!isBulk || selectedRows.length === 0)) return;
    setIsSubmitting(true);

    try {
       const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
       const sheetId = import.meta.env.VITE_SHEET_ID;

       // 1. Upload File (if exists) - Single upload for bulk
       let fileLink = formData.jccCopy; 
       const fileInput = document.getElementById("jcc-copy-file");
       
       if (fileInput && fileInput.files[0]) {
          const file = fileInput.files[0];
          const reader = new FileReader();
          
          fileLink = await new Promise((resolve, reject) => {
             reader.onload = async (e) => {
                const base64Data = e.target.result.split(",")[1];
                // Prefix filename with BULK_ if bulk operation
                const fileName = isBulk 
                    ? `BULK_${Date.now()}_${file.name}` 
                    : file.name;

                const uploadParams = new URLSearchParams({
                   action: "uploadFile",
                   fileName: fileName,
                   mimeType: file.type,
                   base64Data: base64Data,
                   folderId: import.meta.env.VITE_DRIVE_DOC_FOLDER_ID,
                });
                
                try {
                   const uploadRes = await fetch(scriptUrl, {
                      method: "POST",
                      body: uploadParams,
                   });
                   const uploadResult = await uploadRes.json();
                   if (uploadResult.success && uploadResult.fileUrl) {
                      resolve(uploadResult.fileUrl);
                   } else {
                      reject("Upload failed");
                   }
                } catch (err) {
                   reject(err);
                }
             };
             reader.readAsDataURL(file);
          });
       }

       // 2. Identify Items to Process
       let itemsToProcess = [];
       if (isBulk) {
           itemsToProcess = pendingItems.filter(item => selectedRows.includes(item.serialNo));
       } else {
           itemsToProcess = [selectedItem];
       }

       // 3. Process Each Item
       const updatePromises = itemsToProcess.map(async (item) => {
            const rowUpdate = {};
            const addToUpdate = (key, val) => {
                const idx = columnMapping[key];
                if (idx !== undefined && idx >= 0) {
                    rowUpdate[idx] = val;
                }
            };

            addToUpdate("jccReceivingDate", formData.jccReceivingDate);
            addToUpdate("jccCompletionDate", formData.jccCompletionDate);
            addToUpdate("jccAgeing", formData.jccAgeing);
            addToUpdate("invoiceDate", formData.invoiceDate);
            addToUpdate("invoiceNo", formData.invoiceNo);
            addToUpdate("jccAgeingRbp", formData.jccAgeingRbp);
            addToUpdate("jccCopy", fileLink); 
            
            // Mark as DONE (Actual7)
            const now = new Date();
            const timestamp =
              `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ` +
              `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
            
            addToUpdate("actual7", timestamp);

            // Send Update
            const updatePayload = new URLSearchParams({
               action: "update",
               sheet: "Project Main",
               sheetName: "Project Main",
               id: sheetId,
               rowIndex: item.rowIndex,
               rowData: JSON.stringify(rowUpdate),
            });

            const updateRes = await fetch(scriptUrl, {
               method: "POST",
               headers: { "Content-Type": "application/x-www-form-urlencoded" },
               body: updatePayload,
            });

            return updateRes.json();
       });

       const results = await Promise.all(updatePromises);
       
       // Check results
       const failed = results.filter(r => r.status === 'error' || r.result === 'error');
       if (failed.length > 0) {
           throw new Error(`${failed.length} updates failed.`);
       }

       await fetchData();
       setSelectedItem(null);
       setIsBulk(false);
       setSelectedRows([]);
       setIsSuccess(true);

    } catch (error) {
       console.error("Submission Error:", error);
       alert("Error submitting form: " + error.message);
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen animate-fade-in-up">


      <Tabs
        defaultValue="pending"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2 relative p-1 bg-slate-100/80 h-14 rounded-xl border border-slate-200">
          <div
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.5rem)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out ${
              activeTab === "history" ? "translate-x-full" : "translate-x-0"
            }`}
          />
          <TabsTrigger
            value="pending"
            className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500"
          >
            Pending Actions
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500"
          >
            History & Records
          </TabsTrigger>
        </TabsList>

        {/* ====================== PENDING TAB ====================== */}
        <TabsContent
          value="pending"
          className="mt-6 focus-visible:ring-0 focus-visible:outline-none animate-in fade-in-0 slide-in-from-left-4 duration-500 ease-out"
        >
          <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-3 flex flex-col md:flex-row items-center gap-4 md:gap-0 justify-between h-auto min-h-[3.5rem]">
              <div className="flex items-center gap-2 w-full md:w-auto justify-between">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  Pending JCC
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
                 
                 <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {selectedRows.length >= 2 && (
                    <Button
                      onClick={handleBulkClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 transition-all duration-300 animate-in fade-in slide-in-from-right-4 h-9"
                      size="sm"
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      JCC Selected ({selectedRows.length})
                    </Button>
                  )}
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1 h-9 flex items-center"
                  >
                    {filteredPendingItems.length} Pending
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="overflow-x-auto">
                <Table className="[&_th]:text-center [&_td]:text-center">
                  <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                    <TableRow className="border-b border-blue-100 hover:bg-transparent">
                      <TableHead className="h-14 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap w-12">
                          Select
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                        Action
                      </TableHead>

                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Reg ID
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Beneficiary Name
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Village
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Block
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        District
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Pump Type
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Company
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Amount
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index} className="animate-pulse">
                           <TableCell><div className="h-8 w-24 bg-slate-200 rounded-full mx-auto" /></TableCell>
                           {Array.from({ length: 9 }).map((_, i) => (
                             <TableCell key={i}><div className="h-4 w-full bg-slate-200 rounded" /></TableCell>
                           ))}
                        </TableRow>
                      ))
                    ) : filteredPendingItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <ClipboardCheck className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No pending JCC records found matching your search</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPendingItems.map((item) => (
                        <TableRow
                          key={item.serialNo}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
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
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              JCC
                            </Button>
                          </TableCell>

                          <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500 bg-slate-50 py-1 px-2 rounded-md mx-auto w-fit">
                            {item.regId}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-slate-800">
                            {item.beneficiaryName}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.village}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.block}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.district}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.pumpType}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.company}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-slate-700">
                            ₹{item.amount}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-yellow-50 text-yellow-700 border-yellow-200"
                            >
                              Pending
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4 p-4 bg-slate-50">
                {isLoading ? (
                   <div className="text-center p-4 text-slate-500">Loading...</div>
                ) : (
                filteredPendingItems.map((item) => (
                  <Card
                    key={item.serialNo}
                    className="bg-white border text-sm shadow-sm"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-600"
                          >
                            {item.serialNo}
                          </Badge>
                          <h4 className="font-semibold text-base text-slate-800">
                            {item.beneficiaryName}
                          </h4>
                          <p className="text-muted-foreground text-xs font-mono">
                            {item.regId}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                        >
                          Pending
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-t border-b py-3 my-2 border-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Father's Name
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.fatherName}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Village
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.village}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            District
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.district}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Company
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.company}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-between items-center bg-slate-50 p-2 rounded">
                          <span className="font-semibold text-slate-600">
                            Amount:
                          </span>
                          <span className="font-bold text-slate-800">
                            ₹{item.amount}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={selectedRows.length >= 2}
                        className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleActionClick(item)}
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Complete JCC
                      </Button>
                    </CardContent>
                  </Card>
                )))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====================== HISTORY TAB ====================== */}
        <TabsContent
          value="history"
          className="mt-6 focus-visible:ring-0 focus-visible:outline-none animate-in fade-in-0 slide-in-from-right-4 duration-500 ease-out"
        >
          <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-3 flex flex-col md:flex-row items-center gap-4 md:gap-0 justify-between h-auto min-h-[3.5rem]">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  JCC History
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
                 <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 h-9 flex items-center whitespace-nowrap"
                >
                  {filteredHistoryItems.length} Records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="[&_th]:text-center [&_td]:text-center">
                  <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                    <TableRow className="border-b border-blue-100 hover:bg-transparent">

                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Reg ID
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Beneficiary Name
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Village
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        District
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Company
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Amount
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        JCC Completion Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Invoice No
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        JCC Copy
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index} className="animate-pulse">
                           {Array.from({ length: 10 }).map((_, i) => (
                             <TableCell key={i}><div className="h-4 w-full bg-slate-200 rounded" /></TableCell>
                           ))}
                        </TableRow>
                      ))
                    ) : filteredHistoryItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <FileCheck className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>{historyItems.length === 0 ? "No JCC records yet." : "No history records found matching your search."}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistoryItems.map((item) => (
                        <TableRow
                          key={item.serialNo}
                          className="hover:bg-blue-50/30 transition-colors"
                        >

                          <TableCell>
                            <span className="font-mono text-xs text-slate-500 bg-slate-50 py-1 px-2 rounded-md">
                              {item.regId}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-slate-800">
                            {item.beneficiaryName}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.village}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.district}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.company}
                          </TableCell>
                          <TableCell className="text-slate-700 font-medium">
                            ₹{item.amount}
                          </TableCell>
                          <TableCell className="text-slate-600 bg-blue-50/30">
                            {item.jccCompletionDate}
                          </TableCell>
                          <TableCell className="font-medium text-blue-700 bg-blue-50/50">
                            {item.invoiceNo}
                          </TableCell>
                          <TableCell>
                            {item.jccCopy ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer border-blue-200 gap-1"
                                onClick={() => window.open(getPreviewUrl(item.jccCopy), "_blank")}
                              >
                                {item.jccCopy.includes("drive.google.com") ? "View Document" : "View"}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Completed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4 p-4 bg-slate-50">
                {filteredHistoryItems.map((item) => (
                  <Card
                    key={item.serialNo}
                    className="bg-white border text-sm shadow-sm"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-semibold text-blue-900">
                            {item.serialNo}
                          </p>
                          <p className="text-base font-medium text-slate-800">
                            {item.beneficiaryName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {item.district} • {item.village}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Completed
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 mt-2">
                        <div>
                          <span className="font-medium text-slate-500">
                            Completion:
                          </span>{" "}
                          {item.jccCompletionDate}
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">
                            Invoice:
                          </span>{" "}
                          <span className="text-blue-700 font-medium">
                            {item.invoiceNo}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-between items-center bg-slate-50 p-2 rounded mt-1">
                          <span className="font-medium text-slate-600">
                            Amount:
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹{item.amount}
                          </span>
                        </div>
                        {item.jccCopy && (
                          <div className="col-span-2">
                            <span className="font-medium text-slate-500">
                              Copy:
                            </span>{" "}
                            <span
                              className="text-blue-600 underline cursor-pointer"
                              onClick={() => window.open(getPreviewUrl(item.jccCopy), "_blank")}
                            >
                              View Document
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* JCC COMPLETION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent showCloseButton={!isSuccess} className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isSuccess ? "bg-transparent !shadow-none !border-none" : "bg-white"}`}>
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
          <DialogHeader className="p-6 pb-2 border-b border-blue-100 bg-blue-50/30">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="bg-blue-100 p-1.5 rounded-md">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
              </span>
              Enter JCC Completion Information
            </DialogTitle>
            <DialogDescription className="text-slate-500 ml-10">
              {isBulk ? (
                  <span>Applying changes to <span className="font-bold text-blue-700">{selectedRows.length} selected items</span>. All fields below will be updated for these items.</span>
              ) : (
                  <span>Enter Job Completion Certificate details for <span className="font-semibold text-slate-700">{selectedItem?.beneficiaryName}</span></span>
              )}
            </DialogDescription>
          </DialogHeader>

          {(selectedItem || isBulk) && (
            <div className="grid gap-6 p-6">
              {/* PREFILLED BENEFICIARY DETAILS CARD - Hide in Bulk */}
              {!isBulk && selectedItem && (
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-100/50">
                  <span className="bg-white p-1 rounded shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  </span>
                  <h4 className="font-semibold text-blue-900">
                    Beneficiary Details
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                      Serial No
                    </span>
                    <p className="font-semibold text-slate-700">
                      {selectedItem.serialNo}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                      Reg ID
                    </span>
                    <p className="font-semibold text-slate-700">
                      {selectedItem.regId}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                      Beneficiary Name
                    </span>
                    <p className="font-semibold text-slate-700">
                      {selectedItem.beneficiaryName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                      Father's Name
                    </span>
                    <p className="font-semibold text-slate-700">
                      {selectedItem.fatherName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                      Village
                    </span>
                    <p className="font-semibold text-slate-700">
                      {selectedItem.village}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                      Block
                    </span>
                    <p className="font-semibold text-slate-700">
                      {selectedItem.block}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                      District
                    </span>
                    <p className="font-semibold text-slate-700">
                      {selectedItem.district}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                      Pump Type
                    </span>
                    <p className="font-medium text-slate-700">
                      {selectedItem.pumpType}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                      Company
                    </span>
                    <p className="font-medium text-slate-700">
                      {selectedItem.company}
                    </p>
                  </div>
                </div>
              </div>
              )}

              {/* JCC INPUT FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    JCC Receiving Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.jccReceivingDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jccReceivingDate: e.target.value,
                      })
                    }
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    JCC Completion Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.jccCompletionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jccCompletionDate: e.target.value,
                      })
                    }
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    JCC Ageing (Auto)
                  </Label>
                  <Input
                    value={formData.jccAgeing}
                    readOnly
                    placeholder="Calculated automatically"
                    className="border-slate-200 bg-slate-50 text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    Invoice Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceDate: e.target.value })
                    }
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    Invoice No
                  </Label>
                  <Input
                    value={formData.invoiceNo}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceNo: e.target.value })
                    }
                    placeholder="Enter invoice number"
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    JCC Ageing (RBP)
                  </Label>
                  <Input
                    value={formData.jccAgeingRbp}
                    onChange={(e) =>
                      setFormData({ ...formData, jccAgeingRbp: e.target.value })
                    }
                    placeholder="Enter RBP ageing"
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700 font-medium">JCC Copy</Label>
                  <div className="flex flex-col gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="jcc-copy-file"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("jcc-copy-file")?.click()
                      }
                      className="border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 w-full h-24 flex flex-col gap-2 relative overflow-hidden group transition-all"
                    >
                      <div className="absolute inset-0 bg-blue-100/0 group-hover:bg-blue-100/20 transition-colors" />
                      <Upload className="h-6 w-6 relative z-10" />
                      <span className="relative z-10">
                        {formData.jccCopy
                          ? "Change JCC Copy"
                          : "Click to upload JCC Copy (PDF/Image/Word)"}
                      </span>
                    </Button>
                    {formData.jccCopy && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-md border border-green-200 whitespace-nowrap self-start">
                        <FileCheck className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {formData.jccCopy}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-slate-100 pb-6 pr-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="px-6 bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 px-8"
                >
                   {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Submit JCC"
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      </DialogContent>
      </Dialog>
    </div>
  );
}
