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
import { Shield, FileCheck, Upload, Loader2, CheckCircle2 } from "lucide-react";

export default function InsurancePage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [isSuccess, setIsSuccess] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    policyNo: "",
    policyDate: "",
    insuranceCompany: "",
    insuranceForm: null,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [columnMapping, setColumnMapping] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Added this

  // Helper to construct preview URLs
  const getPreviewUrl = (idOrLink) => {
    if (!idOrLink) return "";
    const idMatch = idOrLink.match(/[-\w]{25,}/);
    const fileId = idMatch ? idMatch[0] : idOrLink;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const fetchData = async () => {
    console.log("Fetching Insurance Data...");
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
        console.warn("No rows found in sheet");
        setPendingItems([]);
        setHistoryItems([]);
        setIsLoading(false);
        return;
      }

      const headerRowIndex = 5; 
      if (!rawRows[headerRowIndex]) {
        console.error("Header row missing");
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
        installer: (() => {
          let i = findCol(["installer"]);
          if (i === -1) i = findCol(["agency"]);
          if (i === -1) i = findCol(["firm"]);
          return i;
        })(),
        installationCompletionDate: (() => {
           let i = findCol(["install", "date"]);
           if (i === -1) i = findCol(["completion", "date"]);
           if (i === -1) i = findCol(["commissioning", "date"]);
           return i;
        })(),

        // Policy Info in History
        // Policy Info in History
        policyNo: findCol(["policy", "no"]),
        policyDate: findCol(["policy", "date"]),
        insuranceCompany: (() => {
           let i = findCol(["insurance", "company"]);
           if (i === -1) i = findCol(["ins", "comp"]);
           if (i === -1) i = findCol(["insurance", "name"]);
           return i;
        })(),
        insuranceForm: (() => {
           let i = findCol(["insurance", "form"]);
           if (i === -1) i = findCol(["insurance", "pdf"]);
           return i;
        })(),
        
        // Triggers
        actual5: (() => {
           const i = findCol(["actual", "5"]);
           if (i !== -1) return i;
           return findCol(["system", "info"]); 
        })(),
        planned6: findCol(["planned", "6"]), // Insurance Planned
        actual6: (() => {
           const i = findCol(["actual", "6"]);
           if (i !== -1) return i;
           return findCol(["insurance"]); 
        })(),
      };
      
      console.log("Insurance Col Map:", colMap);
      setColumnMapping(colMap);

      const pending = [];
      const history = [];

      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || !row[colMap.regId]) continue;

        // Safely access fields
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
          installer: getVal(colMap.installer),
          installationCompletionDate: getVal(colMap.installationCompletionDate),

          // For History
          policyNo: getVal(colMap.policyNo),
          policyDate: getVal(colMap.policyDate),
          insuranceCompany: getVal(colMap.insuranceCompany),
          insuranceForm: getVal(colMap.insuranceForm),
          
          actual5: getVal(colMap.actual5),
          planned6: getVal(colMap.planned6),
          actual6: getVal(colMap.actual6),
          rowIndex: i + 1,
        }

        const isPlanned6 = item.planned6 && String(item.planned6).trim() !== "";
        const isInsuranceDone = item.actual6 && String(item.actual6).trim() !== ""; 

        if (isInsuranceDone) {
            history.push(item);
        } else if (isPlanned6) {
            // Planned6 present, Insurance NOT Done -> Pending
            pending.push(item);
        }
      }

      console.log("Found Pending Insurance:", pending.length);
      console.log("Found History Insurance:", history.length);

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

  const handleActionClick = (item) => {
    // alert("Debug: Button Clicked"); 
    console.log("Process Insurance clicked for:", item);
    setIsSuccess(false);
    try {
      setSelectedItem(item);
      setFormData({
        policyNo: item.policyNo || "",
        policyDate: item.policyDate || "",
        insuranceCompany: item.insuranceCompany || "",
        insuranceForm: null,
      });
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error in handleActionClick:", error);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, insuranceForm: e.target.files[0].name });
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
       const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
       const sheetId = import.meta.env.VITE_SHEET_ID;

       // 1. Upload File (if exists)
       let fileLink = formData.insuranceForm; 
       const fileInput = document.getElementById("insurance-form-file");
       
       if (fileInput && fileInput.files[0]) {
          const file = fileInput.files[0];
          const reader = new FileReader();
          
          fileLink = await new Promise((resolve, reject) => {
             reader.onload = async (e) => {
                const base64Data = e.target.result.split(",")[1];
                const uploadParams = new URLSearchParams({
                   action: "uploadFile",
                   fileName: file.name,
                   mimeType: file.type,
                   base64Data: base64Data,
                   folderId: import.meta.env.VITE_DRIVE_DOC_FOLDER_ID,
                });
                
                try {
                   const uploadRes = await fetch(`${scriptUrl}`, {
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

       // 2. Prepare Row Update
       const rowUpdate = {};
       const addToUpdate = (key, val) => {
          const idx = columnMapping[key];
          if (idx !== undefined && idx >= 0) {
              rowUpdate[idx] = val;
          }
       };

       addToUpdate("policyNo", "'" + formData.policyNo); // Preserve leading zeros
       addToUpdate("policyDate", formData.policyDate);
       addToUpdate("insuranceCompany", formData.insuranceCompany); 
       addToUpdate("insuranceForm", fileLink);
       
       const now = new Date();
       const timestamp =
         `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ` +
         `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
       
       addToUpdate("actual6", timestamp);

       // 3. Send Update
       const updatePayload = new URLSearchParams({
          action: "update",
          sheet: "Project Main", // Added this to match Sanction page
          sheetName: "Project Main",
          id: sheetId,
          rowIndex: selectedItem.rowIndex,
          rowData: JSON.stringify(rowUpdate),
       });

       const updateRes = await fetch(scriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: updatePayload,
       });

       const textResult = await updateRes.text();
       let updateResult;

       try {
          updateResult = JSON.parse(textResult);
       } catch (e) {
          console.warn("JSON Parse Error:", textResult);
          // If response is not JSON, it might be an HTML error or success message
          if (textResult.toLowerCase().includes("success")) {
             updateResult = { status: "success" };
          } else {
             throw new Error("Invalid server response: " + textResult.substring(0, 100));
          }
       }

       if (updateResult.status === "success" || updateResult.success) {
          await fetchData(); 
          setIsSuccess(true);
       } else {
          throw new Error("Update failed: " + JSON.stringify(updateResult));
       }

    } catch (error) {
       console.error("Submission Error:", error);
       alert("Error submitting form: " + error.message);
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">


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
          className="mt-6 focus-visible:ring-0 focus-visible:outline-none"
        >
          <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-0.5 h-10 flex items-center">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  Pending Insurance
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1"
                >
                  {pendingItems.length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="[&_th]:text-center [&_td]:text-center">
                  <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                    <TableRow className="border-b border-blue-100 hover:bg-transparent">
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
                        Father's Name
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
                        Installer
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Installation Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={`pending-skel-${index}`} className="animate-pulse">
                          {Array.from({ length: 13 }).map((__, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded mx-auto"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : pendingItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={13}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <Shield className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No pending insurance requests found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingItems.map((item) => (
                        <TableRow
                          key={item.serialNo}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActionClick(item)}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 shadow-xs text-xs font-semibold h-8 px-4 rounded-full flex items-center gap-2 transition-all duration-300 mx-auto"
                            >
                              <Shield className="h-3.5 w-3.5" />
                              Insure
                            </Button>
                          </TableCell>

                          <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500 bg-slate-50 py-1 px-2 rounded-md mx-auto w-fit">
                            {item.regId}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-slate-800">
                            {item.beneficiaryName}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.fatherName}
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
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.installer}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.installationCompletionDate || "-"}
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
                {pendingItems.map((item) => (
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
                            Pump Type
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.pumpType}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md"
                        onClick={() => handleActionClick(item)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Process Insurance
                      </Button>
                    </CardContent>
                  </Card>
                ))}
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
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-0.5 h-10 flex items-center">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  Insurance History
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1"
                >
                  {historyItems.length} Records
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
                        Beneficiary
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
                        Policy No
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Insurance Co.
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Policy Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Document
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={`history-skel-${index}`} className="animate-pulse">
                          {Array.from({ length: 10 }).map((__, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded mx-auto"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : historyItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <FileCheck className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No insurance records yet.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyItems.map((item) => (
                        <TableRow
                          key={item.serialNo}
                          className="hover:bg-blue-50/30 transition-colors"
                        >

                          <TableCell>
                            <span className="font-mono text-xs text-slate-500 bg-slate-50 py-1 px-2 rounded-md">
                              {item.regId}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-slate-800">
                                {item.beneficiaryName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.village}, {item.block}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.district}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.pumpType}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.company}
                          </TableCell>
                          <TableCell className="font-medium text-blue-700 bg-blue-50/50">
                            {item.policyNo}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.insuranceCompany}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.policyDate}
                          </TableCell>
                          <TableCell>
                            {item.insuranceForm ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer border-blue-200 gap-1"
                                onClick={() => window.open(getPreviewUrl(item.insuranceForm), "_blank")}
                              >
                                {item.insuranceForm.includes("drive.google.com") ? "View Document" : item.insuranceForm}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                              Insured
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
                {historyItems.map((item) => (
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
                        <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                          Insured
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 mt-2">
                        <div>
                          <span className="font-medium text-slate-500">
                            Pump:
                          </span>{" "}
                          {item.pumpType}
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">
                            Company:
                          </span>{" "}
                          {item.company}
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">
                            Policy No:
                          </span>{" "}
                          <span className="text-blue-700 font-medium">
                            {item.policyNo}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">
                            Ins. Co:
                          </span>{" "}
                          {item.insuranceCompany}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-slate-500">
                            Policy Date:
                          </span>{" "}
                          {item.policyDate}
                        </div>
                        {item.insuranceForm && (
                          <div className="col-span-2">
                            <span className="font-medium text-slate-500">
                              Form:
                            </span>{" "}
                            <span className="text-blue-600 underline">
                              {item.insuranceForm}
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

      {/* INSURANCE DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isSuccess ? "bg-transparent shadow-none border-none" : "bg-white"}`}>
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
                <Shield className="h-4 w-4 text-blue-600" />
              </span>
              Enter Insurance Information
            </DialogTitle>
            <DialogDescription className="text-slate-500 ml-10">
              Enter insurance policy details for{" "}
              <span className="font-semibold text-slate-700">
                {selectedItem?.beneficiaryName}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="grid gap-6 p-6">
              {/* Beneficiary Details Card */}
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-100/50">
                  <span className="bg-white p-1 rounded shadow-sm">
                    <Shield className="h-4 w-4 text-blue-500" />
                  </span>
                  <h4 className="font-semibold text-blue-900">
                    Beneficiary Details
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                  {[
                    { label: "Serial No", value: selectedItem.serialNo },
                    { label: "Reg ID", value: selectedItem.regId },
                    { label: "Beneficiary Name", value: selectedItem.beneficiaryName },
                    { label: "Father's Name", value: selectedItem.fatherName },
                    { label: "Village", value: selectedItem.village },
                    { label: "District", value: selectedItem.district },
                    { label: "Pump Type", value: selectedItem.pumpType },
                    { label: "Company", value: selectedItem.company },
                  ].map((field, i) => (
                    <div key={i}>
                      <span className="text-xs font-medium text-blue-600/70 uppercase tracking-wider block mb-1">
                        {field.label}
                      </span>
                      <p className="font-semibold text-slate-700">
                        {field.value || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Policy No</Label>
                  <Input
                    value={formData.policyNo}
                    onChange={(e) =>
                      setFormData({ ...formData, policyNo: e.target.value })
                    }
                    placeholder="Enter policy number"
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Policy Date</Label>
                  <Input
                    type="date"
                    value={formData.policyDate}
                    onChange={(e) =>
                      setFormData({ ...formData, policyDate: e.target.value })
                    }
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700 font-medium">
                    Insurance Company
                  </Label>
                  <Input
                    value={formData.insuranceCompany}
                    onChange={(e) =>
                      setFormData({ ...formData, insuranceCompany: e.target.value })
                    }
                    placeholder="Enter company name"
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-700 font-medium">
                    Insurance Form (PDF/Image)
                  </Label>
                  <div className="flex flex-col gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="insurance-form-file"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("insurance-form-file")?.click()
                      }
                      className="border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 w-full h-24 flex flex-col gap-2 relative overflow-hidden group transition-all"
                    >
                      <div className="absolute inset-0 bg-blue-100/0 group-hover:bg-blue-100/20 transition-colors" />
                      <Upload className="h-6 w-6 relative z-10" />
                      <span className="relative z-10">
                        {formData.insuranceForm
                          ? "Change File"
                          : "Click to upload form"}
                      </span>
                    </Button>
                    {formData.insuranceForm && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-md border border-green-200 animate-in fade-in slide-in-from-left-2">
                        <FileCheck className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {formData.insuranceForm}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
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
                    "Submit Insurance"
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
