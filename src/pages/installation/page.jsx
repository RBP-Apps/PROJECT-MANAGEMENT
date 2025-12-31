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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wrench, Upload, FileCheck, Pencil, Loader2, CheckCircle2 } from "lucide-react";

export default function InstallationPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [isSuccess, setIsSuccess] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetHeaders, setSheetHeaders] = useState({});
  const [columnMapping, setColumnMapping] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    installationMaterialAgeing: "",
    installationMaterialReceivingDate: "",
    installationChallanLink: null,
    installationStatus: "",
    installationCompletionDate: "",
    insPhotoOkDate: "",
  });
  const getPreviewUrl = (url) => {
    if (!url) return url;
    if (url.includes("/preview")) return url;

    const match = url.match(/[-\w]{25,}/);
    if (!match) return url;

    return `https://drive.google.com/file/d/${match[0]}/preview`;
  };
  const fetchData = async () => {
    setIsLoading(true);
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

      // ✅ FIXED HEADER ROW (Row 6 in Google Sheet)
      const headerRowIndex = 5;

      if (headerRowIndex === -1 || !rawRows[headerRowIndex]) {
        console.error("Header row not found");
        setIsLoading(false);
        return;
      }
      const rawHeaders = rawRows[headerRowIndex].map(h => String(h).trim());
      const headers = rawHeaders.map(h => h.toLowerCase());

      const findCol = (keys) =>
        headers.findIndex(h =>
          keys.every(k => h.replace(/\s+/g, "").includes(k))
        );

      // 🔹 COLUMN MAPPING (Foundation + Installation)
      const colMap = {
        serialNo: findCol(["serial"]),
        regId: findCol(["reg", "id"]),
        beneficiaryName: findCol(["beneficiary", "name"]),
        fatherName: findCol(["father"]),
        village: findCol(["village"]),
        block: findCol(["block"]),
        district: findCol(["district"]),
        category: findCol(["category"]),
        pumpSource: findCol(["pump", "source"]),
        pumpType: findCol(["pump", "type"]),
        company: findCol(["company"]),
        installer: findCol(["installer"]),
        otherRemark: findCol(["remark"]),
        loiFileName: findCol(["loi"]),
        mrNo: findCol(["mr", "no"]),
        mrDate: findCol(["mr", "date"]),
        amount: findCol(["amount"]),
        paidBy: findCol(["paid", "by"]),
        beneficiaryShare: findCol(["share"]),

        sanctionNo: findCol(["sanction", "no"]),
        sanctionDate: findCol(["sanction", "date"]),

        fdMaterialAgeing: findCol(["fd", "ageing"]),
        fdMaterialReceivingDate: findCol(["fd", "receiving"]),
        
        // Foundation Challan - Prioritize specific "FD Challan" or first "Challan" found
        challanLink: (() => {
             const i = findCol(["fd", "challan"]);
             if (i !== -1) return i;
             return findCol(["challan"]); // Likely the first one
        })(),
        
        foundationStatus: findCol(["foundation", "status"]),
        foundationCompletionDate: (() => {
          const i = findCol(["foundation", "completion"]);
          if (i !== -1) return i;
          return findCol(["fd", "completion"]);
        })(),
        fdPhotoOkDate: findCol(["fd", "photo"]),

        // 🔹 TRIGGERS
        actual3: findCol(["actual", "3"]), // Foundation Done
        planned4: findCol(["planned", "4"]), // Installation Planned
        actual4: findCol(["actual", "4"]), // Installation Done

        // 🔹 INSTALLATION COLUMNS (Restored & Robust)
        installationMaterialAgeing: (() => {
           const i = findCol(["im", "ageing"]);
           if (i !== -1) return i;
           const j = findCol(["ins", "ageing"]);
           if (j !== -1) return j;
           return findCol(["installation", "ageing"]);
        })(),
        installationMaterialReceivingDate: (() => {
           const i = findCol(["im", "receiving"]);
           if (i !== -1) return i;
           const j = findCol(["ins", "receiving"]);
           if (j !== -1) return j;
           return findCol(["installation", "receiving"]);
        })(),
        installationStatus: findCol(["installation", "status"]),
        
        // Installation Challan - Must be distinct from Foundation Challan
        installationChallanLink: (() => {
           // 1. Try specific "Ins Challan"
           const insSpecific = findCol(["ins", "challan"]);
           if (insSpecific !== -1) return insSpecific;

           // 2. Try generic "Challan Link" but ensure it's NOT the foundation one
           // Find ALL columns matching "challan"
           const allChallanIndices = headers.map((h, i) => 
               h.includes("challan") ? i : -1
           ).filter(i => i !== -1);

           // If we have multiple, assume the *last* one or the one closest to Installation Status is correct
           // Or, simply, if we found a foundation challan earlier, pick the next one.
           // However, simple logic: Pick the one that is NOT the same as the Foundation one we found above.
           
           const fdChallanIndex = findCol(["fd", "challan"]) !== -1 ? findCol(["fd", "challan"]) : findCol(["challan"]);
           
           const otherChallan = allChallanIndices.find(i => i !== fdChallanIndex);
           if (otherChallan !== undefined) return otherChallan;
           
           return -1;
        })(),

        installationCompletionDate: (() => {
           const i = findCol(["ic", "date"]);
           if (i !== -1) return i;
           return findCol(["installation", "completion"]);
        })(),
        insPhotoOkDate: findCol(["ins", "photo"]),
      };

      console.log("Detected Columns:", colMap); // Debugging
      setColumnMapping(colMap);

      const pending = [];
      const history = [];

      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || !row[colMap.regId]) continue;

        const item = {
          serialNo: row[colMap.serialNo],
          regId: row[colMap.regId],
          beneficiaryName: row[colMap.beneficiaryName],
          fatherName: row[colMap.fatherName],
          village: row[colMap.village],
          block: row[colMap.block],
          district: row[colMap.district],
          category: row[colMap.category],
          pumpSource: row[colMap.pumpSource],
          pumpType: row[colMap.pumpType],
          company: row[colMap.company],
          installer: row[colMap.installer],
          otherRemark: row[colMap.otherRemark],
          loiFileName: row[colMap.loiFileName],
          mrNo: row[colMap.mrNo],
          mrDate: row[colMap.mrDate],
          amount: row[colMap.amount],
          paidBy: row[colMap.paidBy],
          beneficiaryShare: row[colMap.beneficiaryShare],
          sanctionNo: row[colMap.sanctionNo],
          sanctionDate: row[colMap.sanctionDate],

          fdMaterialAgeing: row[colMap.fdMaterialAgeing],
          fdMaterialReceivingDate: row[colMap.fdMaterialReceivingDate],
          challanLink: row[colMap.challanLink],
          foundationStatus: row[colMap.foundationStatus],
          foundationCompletionDate: row[colMap.foundationCompletionDate] || "",
          fdPhotoOkDate: row[colMap.fdPhotoOkDate],

          // 🔹 INSTALLATION DATA
          installationMaterialAgeing: row[colMap.installationMaterialAgeing],
          installationMaterialReceivingDate: row[colMap.installationMaterialReceivingDate],
          installationChallanLink: row[colMap.installationChallanLink],
          installationStatus: row[colMap.installationStatus],
          installationCompletionDate: row[colMap.installationCompletionDate],
          insPhotoOkDate: row[colMap.insPhotoOkDate],

          actual3: row[colMap.actual3],
          planned4: row[colMap.planned4],
          actual4: row[colMap.actual4],

          rowIndex: i + 1,
        };

        const isInstallationDone = item.actual4 && String(item.actual4).trim() !== "";
        const isPlanned4 = item.planned4 && String(item.planned4).trim() !== "";

        // 🔹 FILTER LOGIC
        if (isInstallationDone) {
          history.push(item);
        } else if (isPlanned4) {
          pending.push(item);
        }
      }

      setPendingItems(pending);
      setHistoryItems(history);

    } catch (err) {
      console.error("Installation fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchData();
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

  // Local storage logic removed as per request

  const handleActionClick = (item) => {
    setSelectedItem(item);
    setIsSuccess(false);
    setFormData({
      installationMaterialAgeing: "",
      installationMaterialReceivingDate: "",
      installationChallanLink: null,
      installationStatus: "",
      installationCompletionDate: "",
      insPhotoOkDate: "",
    });
    setIsDialogOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        installationChallanLink: e.target.files[0].name,
        installationChallanFileObj: e.target.files[0],
      });
    }
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
      const sheetId = import.meta.env.VITE_SHEET_ID;
      const driveFolderId = import.meta.env.VITE_DRIVE_DOC_FOLDER_ID;

      if (!scriptUrl) throw new Error("Script URL missing");

      // Sparse update object
      const rowUpdate = {};

      const addToUpdate = (key, value) => {
        const idx = columnMapping[key];
        if (idx !== undefined && idx >= 0 && value !== undefined && value !== null && value !== "") {
          rowUpdate[idx] = value;
        }
      };

      // Fields edited in this page
      addToUpdate("installationMaterialAgeing", formData.installationMaterialAgeing);
      addToUpdate("installationMaterialReceivingDate", formData.installationMaterialReceivingDate);
      addToUpdate("installationStatus", formData.installationStatus);
      addToUpdate("installationCompletionDate", formData.installationCompletionDate);
      addToUpdate("insPhotoOkDate", formData.insPhotoOkDate);

      // Actual4 timestamp (Installation Done) - VITAL FOR HISTORY TAB
      const now = new Date();
      const timestamp =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")} ` +
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      addToUpdate("actual4", timestamp);

      let finalFileUrl = "";

      // Upload Challan File if exists
      if (formData.installationChallanFileObj) {
        try {
          const base64 = await getBase64(formData.installationChallanFileObj);
          
          const uploadBody = new URLSearchParams({
            action: "uploadFile",
            base64Data: base64,
            fileName: `${selectedItem.beneficiaryName}_${formData.installationChallanFileObj.name}`,
            mimeType: formData.installationChallanFileObj.type,
            folderId: driveFolderId || "1pqyJUlUD0zwnojUvNezJgxzim8gjUfmM",
          });

          const upRes = await fetch(scriptUrl, { method: "POST", body: uploadBody });
          const upResult = await upRes.json();

          if (upResult.success && upResult.fileUrl) {
               finalFileUrl = upResult.fileUrl;
          } else {
              console.error("File upload failed", upResult);
              alert("Warning: File upload failed, but proceeding with data update. " + (upResult.message || ""));
          }
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          alert("Warning: File upload error. Proceeding with text data only.");
        }
      }

      if (finalFileUrl) {
        addToUpdate("installationChallanLink", finalFileUrl);
      } else if (formData.installationChallanLink && !formData.installationChallanFileObj) {
        // If preserving existing link (if any logic allowed editing without re-upload, though currently reset)
         // console.log("Keeping string link");
      }

      // Final update call
      const updatePayload = new URLSearchParams({
        action: "update",
        sheetName: "Project Main",
        id: sheetId,
        rowIndex: selectedItem.rowIndex,
        rowData: JSON.stringify(rowUpdate),
      });

      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: updatePayload.toString(),
      });

      const textResult = await response.text();
      let result;
      try {
        result = JSON.parse(textResult);
      } catch (e) {
        console.error("JSON Parse Error", textResult);
        // Optimistic success if result is weird but likely worked
        if (textResult.includes("success") || textResult.trim().length < 50) {
           result = { status: "success" };
           await fetchData(); // Optimistic data fetch
           setIsSuccess(true);
           return;
        } else {
           throw new Error("Invalid server response");
        }
      }

      if (result.status === "success" || result.success === true) {
        await fetchData(); // Refresh data to move item to History tab
        setIsSuccess(true);
      } else {
        alert("Update Failed: " + (result.message || result.error));
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit data: " + error.message);
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
            Pending Installation
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500"
          >
            Installation History
          </TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent
          value="pending"
          className="mt-6 focus-visible:ring-0 focus-visible:outline-none animate-in fade-in-0 slide-in-from-left-4 duration-500 ease-out"
        >
          <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-0.5 h-10 flex items-center">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <Wrench className="h-4 w-4 text-blue-600" />
                  </div>
                  Pending Installation
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
                        Category
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Pump Source
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
                        Other Remark
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        LOI Document
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        MR No
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        MR Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Amount
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Paid By
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Beneficiary Share
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Sanction No
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Sanction Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        FD Material Ageing
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        FD Material Receiving Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Challan Link
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Foundation Status
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Foundation Completion Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        FD Photo OK Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={`install-skel-${index}`} className="animate-pulse">
                          {Array.from({ length: 29 }).map((__, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded mx-auto"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : pendingItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={29}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <Wrench className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No pending installation requests found</p>
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
                              <Wrench className="h-3.5 w-3.5" />
                              Install
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
                            {item.category}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.pumpSource}
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
                          <TableCell className="whitespace-nowrap text-slate-500 italic">
                            {item.otherRemark || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.loiFileName ? (
                              item.loiFileName.startsWith("http") ? (
                                <a
                                  href={getPreviewUrl(item.loiFileName)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline text-xs flex items-center justify-center gap-1"
                                >
                                  <FileCheck className="h-4 w-4" />
                                  View Document
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">
                                  {item.loiFileName}
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.mrNo}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.mrDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-slate-700">
                            ₹{item.amount}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.paidBy}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-500">
                            {item.beneficiaryShare || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">
                            {item.sanctionNo ? (
                              <span className="font-mono bg-orange-50 px-2 py-0.5 rounded border border-orange-100 text-orange-700">
                                {item.sanctionNo}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.sanctionDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.fdMaterialAgeing}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.fdMaterialReceivingDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.challanLink ? (
                              item.challanLink.startsWith("http") ? (
                                <a
                                  href={getPreviewUrl(item.challanLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 underline text-xs flex items-center justify-center gap-1"
                                >
                                  <FileCheck className="h-4 w-4" />
                                  View Challan
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">
                                  {item.challanLink}
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-green-700">
                            {item.foundationStatus}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.foundationCompletionDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.fdPhotoOkDate}
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

              {/* Mobile View */}
              <div className="md:hidden space-y-4 p-4 bg-slate-50">
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
                            Sanction No
                          </span>
                          <span className="font-medium text-orange-600 font-mono">
                            {item.sanctionNo || "-"}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md"
                        onClick={() => handleActionClick(item)}
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Process Installation
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
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
                  Installation History
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
                        Category
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Pump Source
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
                        Other Remark
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        LOI Document
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        MR No
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        MR Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Amount
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Paid By
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Beneficiary Share
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Sanction No
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Sanction Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        FD Material Ageing
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        FD Material Receiving Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        FD Challan Link
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Foundation Status
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Foundation Completion Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        FD Photo OK Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-blue-50/20">
                        Ins. Ageing
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-blue-50/20">
                        Ins. Material Received
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-blue-50/20">
                        Ins. Challan Link
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-blue-50/20">
                        Ins. Status
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-blue-50/20">
                        Ins. Completion Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap bg-blue-50/20">
                        Ins. Photo OK Date
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
                          {Array.from({ length: 34 }).map((__, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded mx-auto"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : historyItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={34}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <FileCheck className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No installation history found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyItems.map((item) => (
                        <TableRow
                          key={item.serialNo}
                          className="hover:bg-blue-50/30 transition-colors"
                        >

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
                            {item.category}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.pumpSource}
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
                          <TableCell className="whitespace-nowrap text-slate-500 italic">
                            {item.otherRemark || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.loiFileName ? (
                              item.loiFileName.startsWith("http") ? (
                                <a
                                  href={getPreviewUrl(item.loiFileName)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline text-xs flex items-center justify-center gap-1 hover:text-blue-800"
                                >
                                  <FileCheck className="h-4 w-4" />
                                  View Document
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">{item.loiFileName}</span>
                              )
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.mrNo}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.mrDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-slate-700">
                            ₹{item.amount}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.paidBy}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-500">
                            {item.beneficiaryShare || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.sanctionNo ? (
                              <span className="font-mono bg-orange-50 px-2 py-0.5 rounded border border-orange-100 text-orange-700">
                                {item.sanctionNo}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.sanctionDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.fdMaterialAgeing}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.fdMaterialReceivingDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.challanLink ? (
                              item.challanLink.startsWith("http") ? (
                                <a
                                  href={getPreviewUrl(item.challanLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 underline text-xs flex items-center justify-center gap-1 hover:text-green-800"
                                >
                                  <FileCheck className="h-4 w-4" />
                                  View Challan
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">{item.challanLink}</span>
                              )
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-green-700 font-medium">
                            {item.foundationStatus}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.foundationCompletionDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.fdPhotoOkDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-blue-50/50 text-blue-700 font-medium">
                            {item.installationMaterialAgeing}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-blue-50/50 text-slate-600">
                            {item.installationMaterialReceivingDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-blue-50/50">
                            {item.installationChallanLink ? (
                              item.installationChallanLink.startsWith("http") ? (
                                <a
                                  href={getPreviewUrl(item.installationChallanLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline text-xs flex items-center justify-center gap-1 hover:text-blue-800"
                                >
                                  <FileCheck className="h-4 w-4" />
                                  View Challan
                                </a>
                              ) : (
                                <span className="text-slate-600 text-xs">{item.installationChallanLink}</span>
                              )
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-blue-50/50 text-blue-700 font-bold">
                            {item.installationStatus}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-blue-50/50 text-slate-600">
                            {item.installationCompletionDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-blue-50/50 text-slate-600">
                            {item.insPhotoOkDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200">
                              Installed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4 p-4 bg-slate-50">
                {historyItems.map((item) => (
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
                        <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-xs">
                          Installed
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-t border-b py-3 my-2 border-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Status
                          </span>
                          <span className="font-medium text-blue-700">
                            {item.installationStatus}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Completed On
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.installationCompletionDate}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Ins Ageing
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.installationMaterialAgeing}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Material Rcvd
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.installationMaterialReceivingDate}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-[10px] uppercase block mb-1 font-semibold">
                            Challan Document
                          </span>
                          {item.installationChallanLink ? (
                            <span className="text-blue-600 underline cursor-pointer flex items-center gap-1">
                              <FileCheck className="h-3 w-3" />
                              {item.installationChallanLink} (File)
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">
                              No document
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* INSTALLATION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isSuccess ? "bg-transparent shadow-none border-none" : ""}`}>
        {isSuccess ? (
            <div className="flex flex-col items-center justify-center w-full p-8 text-center space-y-6 animate-in fade-in duration-300">
                <div className="rounded-full bg-white p-5 shadow-2xl shadow-white/20 ring-8 ring-white/10 animate-in zoom-in duration-500 ease-out">
                    <CheckCircle2 className="h-16 w-16 text-green-600 scale-110" />
                </div>
                <h2 className="text-3xl font-bold text-white drop-shadow-md animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150 ease-out tracking-wide">
                    Installed Successfully!
                </h2>
            </div>
        ) : (
            <>
          <DialogHeader className="p-6 pb-2 border-b border-blue-100 bg-blue-50/30">
            <DialogTitle className="text-xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="bg-blue-100 p-1.5 rounded-md">
                <Wrench className="h-4 w-4 text-blue-600" />
              </span>
              Process Installation Work
            </DialogTitle>
            <DialogDescription className="text-slate-500 ml-10">
              Update installation details for{" "}
              <span className="font-semibold text-slate-700">
                {selectedItem?.beneficiaryName}
              </span>{" "}
              <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                {selectedItem?.serialNo}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {selectedItem && (
              <>
                {/* PREFILLED BENEFICIARY DETAILS CARD */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    Beneficiary Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">
                        Serial No
                      </span>
                      <p className="font-medium text-slate-800">
                        {selectedItem.serialNo}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">
                        Reg ID
                      </span>
                      <p className="font-medium text-slate-800 font-mono">
                        {selectedItem.regId}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">
                        Beneficiary Name
                      </span>
                      <p className="font-medium text-slate-800">
                        {selectedItem.beneficiaryName}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">
                        Father's Name
                      </span>
                      <p className="font-medium text-slate-800">
                        {selectedItem.fatherName}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">
                        Village/Block
                      </span>
                      <p className="font-medium text-slate-800">
                        {selectedItem.village}, {selectedItem.block}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">
                        Pump Type
                      </span>
                      <p className="font-medium text-blue-700 bg-blue-50 inline-block px-2 py-0.5 rounded text-xs border border-blue-100">
                        {selectedItem.pumpType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* INSTALLATION INPUT FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Installation Material Ageing
                    </Label>
                    <Input
                      value={formData.installationMaterialAgeing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installationMaterialAgeing: e.target.value,
                        })
                      }
                      placeholder="e.g. 30 days"
                      className="h-10 border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Installation Material Receiving Date
                    </Label>
                    <Input
                      type="date"
                      value={formData.installationMaterialReceivingDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installationMaterialReceivingDate: e.target.value,
                        })
                      }
                      className="h-10 border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 transition-all"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Challan Link
                    </Label>
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() =>
                        document
                          .getElementById("installation-challan-file")
                          ?.click()
                      }
                    >
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="installation-challan-file"
                      />
                      <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-cyan-700 transition-colors">
                          {formData.installationChallanLink
                            ? "Change Challan Document"
                            : "Upload Challan Document"}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          SVG, PNG, JPG or PDF (max. 10MB)
                        </p>
                      </div>
                      {formData.installationChallanLink && (
                        <Badge
                          variant="secondary"
                          className="mt-2 bg-cyan-50 text-cyan-700 border-cyan-200"
                        >
                          <FileCheck className="h-3 w-3 mr-1" />
                          {formData.installationChallanLink}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Installation Status
                    </Label>
                    <Select
                      value={formData.installationStatus}
                      onValueChange={(value) =>
                        setFormData({ ...formData, installationStatus: value })
                      }
                    >
                      <SelectTrigger className="h-10 border-slate-200 focus:border-cyan-400 focus:ring-cyan-100">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="Completed"
                          className="text-slate-700 focus:bg-cyan-50 focus:text-cyan-700 cursor-pointer"
                        >
                          Completed
                        </SelectItem>
                        <SelectItem
                          value="In Progress"
                          className="text-slate-700 focus:bg-cyan-50 focus:text-cyan-700 cursor-pointer"
                        >
                          In Progress
                        </SelectItem>
                        <SelectItem
                          value="Pending"
                          className="text-slate-700 focus:bg-cyan-50 focus:text-cyan-700 cursor-pointer"
                        >
                          Pending
                        </SelectItem>
                        <SelectItem
                          value="On Hold"
                          className="text-slate-700 focus:bg-cyan-50 focus:text-cyan-700 cursor-pointer"
                        >
                          On Hold
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Installation Completion Date
                    </Label>
                    <Input
                      type="date"
                      value={formData.installationCompletionDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installationCompletionDate: e.target.value,
                        })
                      }
                      className="h-10 border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 transition-all"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Ins Photo OK Date
                    </Label>
                    <Input
                      type="date"
                      value={formData.insPhotoOkDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insPhotoOkDate: e.target.value,
                        })
                      }
                      className="h-10 border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSubmitting}
                    className="h-10 px-6 text-slate-600 hover:text-slate-800 hover:bg-slate-100/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="h-10 px-6 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md transition-all hover:shadow-lg min-w-[150px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      "Complete Installation"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}
      </DialogContent>
      </Dialog>
    </div>
  );
}
