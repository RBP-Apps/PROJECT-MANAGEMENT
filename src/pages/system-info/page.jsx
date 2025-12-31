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
import { Info, Pencil, CheckCircle2, FileText, Upload, Settings, Loader2 } from "lucide-react";

export default function SystemInfoPage() {
  const [pendingItems, setPendingItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoaded, setIsLoaded] = useState(false);

  // Form state for processing
  const [formData, setFormData] = useState({
    moduleMake: "",
    moduleSerialNo1: "",
    moduleSerialNo2: "",
    moduleSerialNo3: "",
    moduleSerialNo4: "",
    moduleSerialNo5: "",
    moduleSerialNo6: "",
    moduleSerialNo7: "",
    moduleSerialNo8: "",
    moduleSerialNo9: "",
    controllerMake: "",
    controllerNo: "",
    rmsNo: "",
    pumpMake: "",
    pumpSerialNo: "",
    motorSerialNo: "",
    structureMake: "",
    photoPrint: "",
  });

  const [isLoading, setIsLoading] = useState(true);

  // State (no changes to existing state vars needed, just logic)

  const [columnMapping, setColumnMapping] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    console.log("Fetching System Info Data...");
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
        setIsLoaded(true);
        return;
      }

      const headerRowIndex = 5; 
      if (!rawRows[headerRowIndex]) {
        console.error("Header row missing");
        setIsLoading(false);
        setIsLoaded(true);
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
        moduleMake: findCol(["module", "make"]),
        moduleSerialNo1: findCol(["module", "sno1"]), 
        moduleSerialNo2: findCol(["module", "sno2"]),
        moduleSerialNo3: findCol(["module", "sno3"]),
        moduleSerialNo4: findCol(["module", "sno4"]),
        moduleSerialNo5: findCol(["module", "sno5"]),
        moduleSerialNo6: findCol(["module", "sno6"]),
        moduleSerialNo7: findCol(["module", "sno7"]),
        moduleSerialNo8: findCol(["module", "sno8"]),
        moduleSerialNo9: findCol(["module", "sno9"]),
        controllerMake: findCol(["controller", "make"]),
        controllerNo: findCol(["controller", "no"]),
        rmsNo: findCol(["rms", "no"]),
        pumpMake: findCol(["pump", "make"]),
        pumpSerialNo: findCol(["pump", "serial"]),
        motorSerialNo: findCol(["motor", "serial"]),
        structureMake: findCol(["strucutre", "make"]), 
        
        // Robust finders
        actual4: (() => {
           const i = findCol(["actual", "4"]);
           if (i !== -1) return i;
           return findCol(["installation", "done"]); 
        })(),
        planned5: findCol(["planned", "5"]), // System Info Planned
        actual5: (() => {
           const i = findCol(["actual", "5"]);
           if (i !== -1) return i;
           return findCol(["system", "info"]); 
        })(),
      };
      
      console.log("Col Map:", colMap);
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

          moduleMake: getVal(colMap.moduleMake),
          controllerMake: getVal(colMap.controllerMake),
          pumpMake: getVal(colMap.pumpMake),
          structureMake: getVal(colMap.structureMake),
          
          actual4: getVal(colMap.actual4),
          planned5: getVal(colMap.planned5),
          actual5: getVal(colMap.actual5),
          rowIndex: i + 1,
        }

        const isPlanned5 = item.planned5 && String(item.planned5).trim() !== "";
        const isSystemInfoDone = item.actual5 && String(item.actual5).trim() !== ""; 

        if (isSystemInfoDone) {
            history.push(item);
        } else if (isPlanned5) {
            pending.push(item);
        }
      }

      setPendingItems(pending);
      setHistoryItems(history);

    } catch (e) {
      console.error("Fetch Data Error:", e);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  };

  const handleActionClick = (item) => {
    console.log("Opening Process Dialog for:", item);
    setIsSuccess(false);
    setSelectedItem(item);
    setFormData({
      moduleMake: item.moduleMake || "",
      moduleSerialNo1: item.moduleSerialNo1 || "",
      moduleSerialNo2: item.moduleSerialNo2 || "",
      moduleSerialNo3: item.moduleSerialNo3 || "",
      moduleSerialNo4: item.moduleSerialNo4 || "",
      moduleSerialNo5: item.moduleSerialNo5 || "",
      moduleSerialNo6: item.moduleSerialNo6 || "",
      moduleSerialNo7: item.moduleSerialNo7 || "",
      moduleSerialNo8: item.moduleSerialNo8 || "",
      moduleSerialNo9: item.moduleSerialNo9 || "",
      controllerMake: item.controllerMake || "",
      controllerNo: item.controllerNo || "",
      rmsNo: item.rmsNo || "",
      pumpMake: item.pumpMake || "",
      pumpSerialNo: item.pumpSerialNo || "",
      motorSerialNo: item.motorSerialNo || "",
      structureMake: item.structureMake || "",
      photoPrint: "",
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
       // setFormData({ ...formData, photoPrint: e.target.files[0].name });
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    try {
      const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
      const sheetId = import.meta.env.VITE_SHEET_ID;

      const rowUpdate = {};

      const addToUpdate = (key, value) => {
        const idx = columnMapping[key];
        if (idx !== undefined && idx >= 0 && value !== undefined && value !== null) {
          let finalValue = value;
          // Force Google Sheets to treat strings with leading zeros as text
          if (typeof value === "string" && value.startsWith("0") && value.length > 1 && !isNaN(value)) {
             finalValue = "'" + value;
          }
          rowUpdate[idx] = finalValue;
        }
      };

      // Add System Info Fields to Update
      addToUpdate("moduleMake", formData.moduleMake);
      addToUpdate("moduleSerialNo1", formData.moduleSerialNo1);
      addToUpdate("moduleSerialNo2", formData.moduleSerialNo2);
      addToUpdate("moduleSerialNo3", formData.moduleSerialNo3);
      addToUpdate("moduleSerialNo4", formData.moduleSerialNo4);
      addToUpdate("moduleSerialNo5", formData.moduleSerialNo5);
      addToUpdate("moduleSerialNo6", formData.moduleSerialNo6);
      addToUpdate("moduleSerialNo7", formData.moduleSerialNo7);
      addToUpdate("moduleSerialNo8", formData.moduleSerialNo8);
      addToUpdate("moduleSerialNo9", formData.moduleSerialNo9);
      
      addToUpdate("controllerMake", formData.controllerMake);
      addToUpdate("controllerNo", formData.controllerNo);
      addToUpdate("rmsNo", formData.rmsNo);
      addToUpdate("pumpMake", formData.pumpMake);
      addToUpdate("pumpSerialNo", formData.pumpSerialNo);
      addToUpdate("motorSerialNo", formData.motorSerialNo);
      addToUpdate("structureMake", formData.structureMake);

      // Generate Actual5 Timestamp
      const now = new Date();
      const timestamp =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")} ` +
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      addToUpdate("actual5", timestamp);

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
        // Handle weird GAS responses
        if (textResult.includes("success")) {
           result = { status: "success" };
        } else {
           throw new Error("Invalid Server Response");
        }
      }

      if (result.status === "success" || result.success === true) {
        await fetchData(); 
        setSelectedItem(null);
        setIsSubmitting(false); 
        setIsSuccess(true);
      } else {
        alert("Failed to save: " + (result.message || "Unknown error"));
        setIsSubmitting(false);
      }

    } catch (error) {
      console.error("Submission Error:", error);
      alert("Error submitting data. Please try again.");
      setIsSubmitting(false);
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

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">
      <Tabs
        defaultValue="pending"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
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
            Pending System Info
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500"
          >
            System Info History
          </TabsTrigger>
        </TabsList>

        {/* ====================== PENDING TAB ====================== */}
        <TabsContent
          value="pending"
          className="mt-6 focus-visible:ring-0 focus-visible:outline-none animate-in fade-in-0 slide-in-from-left-4 duration-500 ease-out"
        >
          <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-0.5 h-10 flex items-center">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <Settings className="h-4 w-4 text-blue-600" />
                  </div>
                  Pending System Information
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
              <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] relative">
                <Table className="[&_th]:text-center [&_td]:text-center [&_td]:align-middle">
                  <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 sticky top-0 z-10">
                    <TableRow className="border-b border-blue-100 hover:bg-transparent">
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap w-32">
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
                         Install Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={`pending-skel-${index}`} className="animate-pulse">
                          {Array.from({ length: 11 }).map((__, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded mx-auto"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : pendingItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <Settings className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No pending system info tasks</p>
                            <p className="text-xs text-slate-400">
                             Completed installations will appear here.
                            </p>
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
                              size="sm"
                              className="h-8 px-4 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 transition-all duration-300 shadow-sm text-xs font-semibold flex items-center gap-2 mx-auto"
                              onClick={() => handleActionClick(item)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Process
                            </Button>
                          </TableCell>

                          <TableCell className="text-slate-600 font-mono text-xs">
                            {item.regId}
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">
                            {item.beneficiaryName}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.fatherName}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.village}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.block}
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
                          <TableCell>
                             <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                                Installed
                             </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4 bg-slate-50">
                {pendingItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                    <p>No pending tasks found.</p>
                  </div>
                ) : (
                  pendingItems.map((item) => (
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
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                          >
                            Pending Info
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-t border-b py-3 my-2 border-slate-100">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-semibold">
                              Village
                            </span>
                            <p className="font-medium text-slate-700">
                              {item.village}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-semibold">
                              District
                            </span>
                            <p className="font-medium text-slate-700">
                              {item.district}
                            </p>
                          </div>
                           <div>
                            <span className="text-slate-400 text-[10px] uppercase font-semibold">
                              Company
                            </span>
                            <p className="font-medium text-slate-700">
                              {item.company}
                            </p>
                          </div>
                           <div>
                            <span className="text-slate-400 text-[10px] uppercase font-semibold">
                              Pump Type
                            </span>
                            <p className="font-medium text-slate-700">
                              {item.pumpType}
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md"
                          onClick={() => handleActionClick(item)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Update Info
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
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
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  </div>
                  System Information History
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
              <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] relative">
                <Table className="[&_th]:text-center [&_td]:text-center [&_td]:align-middle">
                  <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 sticky top-0 z-10">
                    <TableRow className="border-b border-blue-100 hover:bg-transparent">

                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Reg ID
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Beneficiary
                      </TableHead>
                       <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Village
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Module Make
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Controller Make
                      </TableHead>
                       <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Pump Make
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Structure Make
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
                          {Array.from({ length: 8 }).map((__, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded mx-auto"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : historyItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No processed records yet.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyItems.map((item) => (
                        <TableRow
                          key={item.serialNo}
                          className="hover:bg-blue-50/30 transition-colors"
                        >

                          <TableCell className="whitespace-nowrap font-mono text-xs text-slate-600">
                            {item.regId}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-slate-800">
                            {item.beneficiaryName}
                          </TableCell>
                           <TableCell className="whitespace-nowrap text-slate-600">
                            {item.village}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.moduleMake || "-"}
                          </TableCell>
                           <TableCell className="whitespace-nowrap text-slate-600">
                            {item.controllerMake || "-"}
                          </TableCell>
                           <TableCell className="whitespace-nowrap text-slate-600">
                            {item.pumpMake || "-"}
                          </TableCell>
                           <TableCell className="whitespace-nowrap text-slate-600">
                            {item.structureMake || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Processed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

               {/* Mobile View History */}
              <div className="md:hidden space-y-4 p-4 bg-slate-50">
                {historyItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                    <p>No processed records yet.</p>
                  </div>
                ) : (
                  historyItems.map((item) => (
                    <Card
                      key={item.serialNo}
                      className="bg-white border text-sm shadow-sm"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="font-bold text-blue-900 block text-xs tracking-wider">
                              {item.serialNo}
                            </span>
                            <h4 className="font-semibold text-base text-slate-800">
                              {item.beneficiaryName}
                            </h4>
                          </div>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Processed
                          </Badge>
                        </div>

                         <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-b py-3 my-2 border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-[10px] uppercase font-semibold">
                              Module Make
                            </span>
                            <span className="font-medium text-slate-700">
                               {item.moduleMake || "-"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-400 text-[10px] uppercase font-semibold">
                              Controller
                            </span>
                            <span className="font-medium text-slate-700">
                               {item.controllerMake || "-"}
                            </span>
                          </div>
                         </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====================== PROCESSING DIALOG ====================== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isSuccess ? "bg-transparent shadow-none border-none" : "bg-white"}`}>
        {isSuccess ? (
            <div className="flex flex-col items-center justify-center w-full p-8 text-center space-y-6 animate-in fade-in duration-300">
                <div className="rounded-full bg-white p-5 shadow-2xl shadow-white/20 ring-8 ring-white/10 animate-in zoom-in duration-500 ease-out">
                    <CheckCircle2 className="h-16 w-16 text-green-600 scale-110" />
                </div>
                <h2 className="text-3xl font-bold text-white drop-shadow-md animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150 ease-out tracking-wide">
                    Saved Successfully!
                </h2>
            </div>
        ) : (
            <>
          <DialogHeader className="p-6 pb-2 border-b border-blue-100 bg-blue-50/30">
            <DialogTitle className="text-xl font-bold bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="bg-blue-100 p-1.5 rounded-md">
                <Settings className="h-4 w-4 text-blue-600" />
              </span>
              Update System Information
            </DialogTitle>
            <DialogDescription className="text-slate-500 ml-10">
              Update technical details for{" "}
               <span className="font-semibold text-slate-700">
                {selectedItem?.beneficiaryName}
              </span>{" "}
              <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600 border border-slate-200">
                {selectedItem?.serialNo}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="grid gap-6 p-6">
              
               <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-l-4 border-cyan-500 pl-3 uppercase tracking-wide flex items-center gap-2">
                  Technical Specifications
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                   {/* Modules */}
                   <div className="space-y-2 lg:col-span-3">
                      <Label className="text-sm font-medium text-slate-700">Module Make</Label>
                      <Input
                        value={formData.moduleMake}
                        onChange={(e) => setFormData({...formData, moduleMake: e.target.value})}
                        placeholder="e.g. Adani/Tata"
                        className="h-10 border-slate-200 focus:border-cyan-400"
                      />
                   </div>

                   {/* Module Serial Numbers 1-9 */}
                   {[1,2,3,4,5,6,7,8,9].map(num => (
                       <div key={num} className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Module Serial No {num}</Label>
                           <Input
                             value={formData[`moduleSerialNo${num}`]}
                             onChange={(e) => setFormData({...formData, [`moduleSerialNo${num}`]: e.target.value})}
                             placeholder={`Serial No ${num}`}
                             className="h-10 border-slate-200 focus:border-cyan-400"
                           />
                       </div>
                   ))}

                   {/* Other Components */}
                   <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Controller Make</Label>
                      <Input
                        value={formData.controllerMake}
                        onChange={(e) => setFormData({...formData, controllerMake: e.target.value})}
                         className="h-10 border-slate-200 focus:border-cyan-400"
                      />
                   </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Controller No</Label>
                      <Input
                        value={formData.controllerNo}
                        onChange={(e) => setFormData({...formData, controllerNo: e.target.value})}
                         className="h-10 border-slate-200 focus:border-cyan-400"
                      />
                   </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">RMS No</Label>
                      <Input
                        value={formData.rmsNo}
                        onChange={(e) => setFormData({...formData, rmsNo: e.target.value})}
                         className="h-10 border-slate-200 focus:border-cyan-400"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Pump Make</Label>
                      <Input
                        value={formData.pumpMake}
                        onChange={(e) => setFormData({...formData, pumpMake: e.target.value})}
                         className="h-10 border-slate-200 focus:border-cyan-400"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Pump Serial No</Label>
                      <Input
                        value={formData.pumpSerialNo}
                        onChange={(e) => setFormData({...formData, pumpSerialNo: e.target.value})}
                         className="h-10 border-slate-200 focus:border-cyan-400"
                      />
                   </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Motor Serial No</Label>
                      <Input
                        value={formData.motorSerialNo}
                        onChange={(e) => setFormData({...formData, motorSerialNo: e.target.value})}
                         className="h-10 border-slate-200 focus:border-cyan-400"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Structure Make</Label>
                      <Input
                        value={formData.structureMake}
                        onChange={(e) => setFormData({...formData, structureMake: e.target.value})}
                         className="h-10 border-slate-200 focus:border-cyan-400"
                      />
                   </div>
                </div>
               </div>

              <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="h-10 px-6 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-10 px-8 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save System Info"
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
