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
import { Hammer, Upload, FileCheck, Pencil, CheckCircle2 } from "lucide-react";

export default function FoundationPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [isSuccess, setIsSuccess] = useState(false);
  const [pendingItems, setPendingItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    fdMaterialAgeing: "",
    fdMaterialReceivingDate: "",
    challanLink: null,
    foundationStatus: "",
    foundationCompletionDate: "",
    fdPhotoOkDate: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [sheetHeaders, setSheetHeaders] = useState({});
  const [columnMapping, setColumnMapping] = useState({});

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

      // Header Detection Logic
      let headerRowIndex = -1;
      const targetColumns = ["regid", "beneficiaryname", "village"];

      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        const row = rawRows[i];
        if (!Array.isArray(row)) continue;
        const normalizedRow = row.map((c) =>
          String(c).toLowerCase().replace(/\s+/g, "")
        );
        if (
          targetColumns.filter((col) => normalizedRow.includes(col)).length >= 2
        ) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1 && rawRows.length > 5) headerRowIndex = 5;

      if (headerRowIndex === -1 || !rawRows[headerRowIndex]) {
        console.error("Could not identify header row");
        setIsLoading(false);
        return;
      }

      const rawHeaders = rawRows[headerRowIndex].map((h) => String(h).trim());
      const headers = rawHeaders.map((h) => h.toLowerCase());
      const findCol = (keywords) =>
        headers.findIndex((h) => keywords.every((k) => h.includes(k)));

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
        loiDocument: findCol(["loi", "file"]),
        mrNo: findCol(["mr", "no"]),
        mrDate: findCol(["mr", "date"]),
        amount: findCol(["amount"]),
        paidBy: findCol(["paid", "by"]),
        beneficiaryShare: findCol(["share"]),

        // Sanction Specifics
        sanctionNo: findCol(["sanction", "no"]),
        sanctionDate: findCol(["sanction", "date"]),

        // Foundation Specifics
        fdMaterialAgeing: findCol(["fd", "material", "ageing"]),
        fdMaterialReceivingDate: findCol(["fd", "material", "receiving"]),
        challanLink: findCol(["challan"]),
        foundationStatus: (() => {
            const i = findCol(["foundation", "status"]);
            if (i !== -1) return i;
            return findCol(["fd", "status"]);
        })(),
        foundationCompletionDate: (() => {
            const i = findCol(["foundation", "completion"]);
            if (i !== -1) return i;
            return findCol(["fd", "completion"]);
        })(),
        fdPhotoOkDate: findCol(["fd", "photo"]),

        // Triggers
        actual2: findCol(["actual", "2"]), // Sanction Done
        
        // Data Preservation (To avoid overwriting)
        planned1: findCol(["planned", "1"]),
        actual1: findCol(["actual", "1"]),
        delay1: findCol(["delay", "1"]),
        planned2: findCol(["planned", "2"]),
        delay2: findCol(["delay", "2"]),
        
        planned3: findCol(["planned", "3"]), // Foundation Planned
        actual3: findCol(["actual", "3"]), // Foundation Done
        delay3: findCol(["delay", "3"]),
      };

      const detectedHeaders = {};
      Object.keys(colMap).forEach((key) => {
        if (colMap[key] !== -1) {
          detectedHeaders[key] = rawHeaders[colMap[key]];
        }
      });
      setSheetHeaders(detectedHeaders);
      setColumnMapping(colMap);

      const parsedPending = [];
      const parsedHistory = [];

      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        if (colMap.regId === -1 || !row[colMap.regId]) continue;

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
          installer: row[colMap.installer] || "-",
          otherRemark: row[colMap.otherRemark] || "",
          loiFileName: row[colMap.loiDocument] || "",
          mrNo: row[colMap.mrNo] || "-",
          mrDate: row[colMap.mrDate] || "-",
          amount: row[colMap.amount] || "-",
          paidBy: row[colMap.paidBy] || "-",
          beneficiaryShare: row[colMap.beneficiaryShare] || "-",

          sanctionNo: row[colMap.sanctionNo] || "",
          sanctionDate: row[colMap.sanctionDate] || "",

          fdMaterialAgeing: row[colMap.fdMaterialAgeing] || "",
          fdMaterialReceivingDate: row[colMap.fdMaterialReceivingDate] || "",
          challanLink: row[colMap.challanLink] || "",
          foundationStatus: row[colMap.foundationStatus] || "",
          foundationCompletionDate: row[colMap.foundationCompletionDate] || "",
          fdPhotoOkDate: row[colMap.fdPhotoOkDate] || "",

          actual2: row[colMap.actual2],
          
          planned1: row[colMap.planned1],
          actual1: row[colMap.actual1],
          delay1: row[colMap.delay1],
          planned2: row[colMap.planned2],
          delay2: row[colMap.delay2],
          
          planned3: row[colMap.planned3],
          actual3: row[colMap.actual3],
          delay3: row[colMap.delay3],

          rowIndex: i + 1,
        };

        const isPlanned3 = item.planned3 && String(item.planned3).trim() !== "";
        const isActual3 = item.actual3 && String(item.actual3).trim() !== "";

        // Filter Logic:
        // Pending: Foundation Planned (Planned3) AND Foundation NOT Done (!Actual3)
        // History: Foundation Done (Actual3)

        if (isActual3) {
             parsedHistory.push(item);
        } else if (isPlanned3) {
             parsedPending.push(item);
        }
      }

      setPendingItems(parsedPending);
      setHistoryItems(parsedHistory);
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setIsLoading(false);
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

  const handleActionClick = (item) => {
    setSelectedItem(item);
    setIsSuccess(false);
    setFormData({
      fdMaterialAgeing: "",
      fdMaterialReceivingDate: "",
      challanLink: null,
      foundationStatus: "",
      foundationCompletionDate: "",
      fdPhotoOkDate: "",
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        challanLink: e.target.files[0].name,
        challanFileObj: e.target.files[0],
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

  // ✅ Google Drive preview link helper
  const getPreviewUrl = (url) => {
    if (!url) return url;
    if (url.includes("/preview")) return url;

    const match = url.match(/[-\w]{25,}/);
    if (!match) return url;

    return `https://drive.google.com/file/d/${match[0]}/preview`;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
      const sheetId = import.meta.env.VITE_SHEET_ID;

      if (!scriptUrl) throw new Error("Script URL missing");

      // ✅ STEP 1: Sparse update object
      const rowUpdate = {};

      const addToUpdate = (key, value) => {
        const idx = columnMapping[key];
        if (idx !== undefined && idx >= 0 && value !== undefined && value !== null && value !== "") {
          rowUpdate[idx] = value;
        }
      };

      // ✅ ONLY fields edited in this page
      addToUpdate("fdMaterialAgeing", formData.fdMaterialAgeing);
      addToUpdate("fdMaterialReceivingDate", formData.fdMaterialReceivingDate);
      addToUpdate("foundationStatus", formData.foundationStatus);
      addToUpdate("foundationCompletionDate", formData.foundationCompletionDate);
      addToUpdate("fdPhotoOkDate", formData.fdPhotoOkDate);

      // ✅ Actual3 timestamp (Foundation Done)
      const now = new Date();
      const timestamp =
        `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(
          now.getDate()
        ).padStart(2, "0")} ` +
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      addToUpdate("actual3", timestamp);

      let finalFileUrl = "";

      // ✅ STEP 2: Upload Challan File if exists
      if (formData.challanFileObj) {
        const base64 = await getBase64(formData.challanFileObj);

        // Use the env variable for folder ID, fallback to the hardcoded one if needed, 
        // but prefer the env var as per other pages.
        const DRIVE_FOLDER_ID = import.meta.env.VITE_DRIVE_DOC_FOLDER_ID; 

        if (!DRIVE_FOLDER_ID) {
            console.error("VITE_DRIVE_DOC_FOLDER_ID is missing in .env");
            // You might want to throw an error or alert here
        }

        const uploadBody = new URLSearchParams({
          action: "uploadFile",
          base64Data: base64,
          fileName: formData.challanFileObj.name,
          mimeType: formData.challanFileObj.type,
          folderId: DRIVE_FOLDER_ID || "1pqyJUlUD0zwnojUvNezJgxzim8gjUfmM", // Fallback only if env is missing
        });

        const upRes = await fetch(scriptUrl, { method: "POST", body: uploadBody });
        const upResult = await upRes.json();

        if (upResult.success && upResult.fileUrl) {
             finalFileUrl = upResult.fileUrl;
        } else {
            throw new Error("File upload failed");
        }
      }

      // ✅ STEP 3: Add link to update object
      if (finalFileUrl) {
        addToUpdate("challanLink", finalFileUrl);
      }

      // ✅ STEP 4: Final update call
      const updatePayload = new URLSearchParams({
        action: "update",
        sheetName: "Project Main", // Ensure this matches the sheet name expected by Apps Script
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
        if (textResult.includes("undefined") || textResult.trim() === "") {
           // Optimistic success
          await fetchData();
          setIsSuccess(true);
          return;
        }
        alert("Server Error: " + textResult);
        return;
      }

      if (result.status === "success" || result.success === true) {
        await fetchData();
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
            Pending Actions
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500"
          >
            History & Records
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
                    <Hammer className="h-4 w-4 text-blue-600" />
                  </div>
                  Pending Foundation
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
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={`pending-skeleton-${index}`} className="animate-pulse">
                          {Array.from({ length: 23 }).map((__, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded mx-auto"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : pendingItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={23}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <Hammer className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No pending foundation requests found</p>
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
                              <Hammer className="h-3.5 w-3.5" />
                              Process
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
                              item.loiFileName.startsWith('http') ? (
                                <a
                                  href={getPreviewUrl(item.loiFileName)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline text-xs flex items-center justify-center gap-1"
                                >
                                  <FileCheck className="h-4 w-4" />
                                  Preview
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
                        {/* ... other mobile fields ... */}
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
                        <Hammer className="h-4 w-4 mr-2" />
                        Process Foundation
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
                  Foundation History
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
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
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
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                        Challan Link
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Foundation Status
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        FD Completion Date
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
                        <TableRow key={`history-skeleton-${index}`} className="animate-pulse">
                          {Array.from({ length: 28 }).map((__, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded mx-auto"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : historyItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={28} className="h-48 text-center text-slate-500 bg-slate-50/30">
                          No foundation history found.
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
                              item.loiFileName.startsWith('http') ? (
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
                          <TableCell className="whitespace-nowrap bg-green-50/50 text-green-700 font-medium">
                            {item.fdMaterialAgeing}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-green-50/30 text-slate-700">
                            {item.fdMaterialReceivingDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-blue-50/30">
                            {item.challanLink ? (
                              item.challanLink.startsWith('http') ? (
                                <a
                                  href={getPreviewUrl(item.challanLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline text-xs flex items-center justify-center gap-1"
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
                          <TableCell className="whitespace-nowrap bg-green-50/50 text-green-700 font-bold">
                            {item.foundationStatus}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-green-50/30 text-slate-700">
                            {item.foundationCompletionDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-green-50/30 text-slate-700">
                            {item.fdPhotoOkDate}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200">
                              Completed
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
                          Completed
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-t border-b py-3 my-2 border-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Status
                          </span>
                          <span className="font-medium text-green-700">
                            {item.foundationStatus}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Completed On
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.foundationCompletionDate}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            FD Ageing
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.fdMaterialAgeing}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            Material Rcvd
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.fdMaterialReceivingDate}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-[10px] uppercase block mb-1 font-semibold">
                            Challan Document
                          </span>
                          {item.challanLink && item.challanLink.startsWith('http') ? (
                             <a
                                href={getPreviewUrl(item.challanLink)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline cursor-pointer flex items-center gap-1"
                              >
                                <FileCheck className="h-3 w-3" />
                                View Challan (File)
                              </a>
                          ) : (
                            <span className="text-gray-400 italic">
                              {item.challanLink ? item.challanLink : "No document"}
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

      {/* FOUNDATION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isSuccess ? "bg-transparent shadow-none border-none" : ""}`}>
        {isSuccess ? (
            <div className="flex flex-col items-center justify-center w-full p-8 text-center space-y-6 animate-in fade-in duration-300">
                <div className="rounded-full bg-white p-5 shadow-2xl shadow-white/20 ring-8 ring-white/10 animate-in zoom-in duration-500 ease-out">
                    <CheckCircle2 className="h-16 w-16 text-green-600 scale-110" />
                </div>
                <h2 className="text-3xl font-bold text-white drop-shadow-md animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150 ease-out tracking-wide">
                    Completed Foundation Successfully!
                </h2>
            </div>
        ) : (
            <>
          <DialogHeader className="p-6 pb-2 border-b border-blue-100 bg-blue-50/30">
            <DialogTitle className="text-xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="bg-blue-100 p-1.5 rounded-md">
                <Hammer className="h-4 w-4 text-blue-600" />
              </span>
              Process Foundation Work
            </DialogTitle>
            <DialogDescription className="text-slate-500 ml-10">
              Update foundation details for{" "}
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

                {/* FOUNDATION INPUT FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      FD Material Ageing
                    </Label>
                    <Input
                      value={formData.fdMaterialAgeing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fdMaterialAgeing: e.target.value,
                        })
                      }
                      placeholder="e.g. 30 days"
                      className="h-10 border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      FD Material Receiving Date
                    </Label>
                    <Input
                      type="date"
                      value={formData.fdMaterialReceivingDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fdMaterialReceivingDate: e.target.value,
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
                        document.getElementById("challan-file")?.click()
                      }
                    >
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="challan-file"
                      />
                      <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium text-slate-700 group-hover:text-cyan-700 transition-colors">
                          {formData.challanLink
                            ? "Change Document"
                            : "Click to upload Challan"}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          SVG, PNG, JPG or PDF (max. 10MB)
                        </p>
                      </div>
                      {formData.challanLink && (
                        <Badge
                          variant="secondary"
                          className="mt-2 bg-cyan-50 text-cyan-700 border-cyan-200"
                        >
                          <FileCheck className="h-3 w-3 mr-1" />
                          {formData.challanLink}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Foundation Status
                    </Label>
                    <Select
                      value={formData.foundationStatus}
                      onValueChange={(value) =>
                        setFormData({ ...formData, foundationStatus: value })
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
                      FD Completion Date
                    </Label>
                    <Input
                      type="date"
                      value={formData.foundationCompletionDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          foundationCompletionDate: e.target.value,
                        })
                      }
                      className="h-10 border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 transition-all"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-slate-700">
                      FD Photo OK Date
                    </Label>
                    <Input
                      type="date"
                      value={formData.fdPhotoOkDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fdPhotoOkDate: e.target.value,
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
                    className="h-10 px-6 text-slate-600 hover:text-slate-800 hover:bg-slate-100/50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="h-10 px-6 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md transition-all hover:shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Complete Foundation"}
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
