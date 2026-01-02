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
import { CreditCard, CheckCircle2, Loader2, Activity, IndianRupee, ClipboardCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function PaymentPage() {
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
  const [formData, setFormData] = useState({
    paymentDate: "",
    paymentAmount: "",
    gst: "",
    tds: "",
    sd: "",
    balance: "",
  });

  const fetchData = async () => {
    console.log("Fetching Payment Data...");
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
        jccAtHo: findCol(["ho", "date"]), // Display JCC HO Date in table

        // Payment Columns
        paymentDate: findCol(["payment", "date"]),
        paymentAmount: headers.findIndex((h, idx) => {
             const pdIdx = findCol(["payment", "date"]);
             return idx > pdIdx && h.includes("amount");
        }), 
        gst: findCol(["gst"]),
        tds: findCol(["tds"]),
        sd: findCol(["sd"]),
        balance: findCol(["balance"]),

        // Triggers
        actual8: (() => {
           const i = findCol(["actual", "8"]);
           if (i !== -1) return i;
           return findCol(["jcc", "status"]); 
        })(),
        actual9: (() => {
           const i = findCol(["actual", "9"]);
           if (i !== -1) return i;
           // Fallback to Payment Date as proxy if Actual9 missing
           return findCol(["payment", "date"]); 
        })(),
        planned9: findCol(["planned", "9"]), // Payment Planned
      };

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
          jccAtHo: getVal(colMap.jccAtHo),
          
          // Payment Data
          paymentDate: getVal(colMap.paymentDate),
          paymentAmount: getVal(colMap.paymentAmount),
          gst: getVal(colMap.gst),
          tds: getVal(colMap.tds),
          sd: getVal(colMap.sd),
          balance: getVal(colMap.balance),

          actual8: getVal(colMap.actual8),
          planned9: getVal(colMap.planned9),
          actual9: getVal(colMap.actual9),
          rowIndex: i + 1,
        }

        const isPlanned9 = item.planned9 && String(item.planned9).trim() !== "";
        const isPaymentDone = item.actual9 && String(item.actual9).trim() !== ""; 

        if (isPaymentDone) {
            history.push(item);
        } else if (isPlanned9) {
            // Planned9 present, Payment NOT Done -> Pending
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

  const handleActionClick = (item) => {
    setIsBulk(false);
    setSelectedItem(item);
    setIsSuccess(false);
    setFormData({
      paymentDate: item.paymentDate || "",
      paymentAmount: item.paymentAmount || "",
      gst: item.gst || "",
      tds: item.tds || "",
      sd: item.sd || "",
      balance: item.balance || "",
    });
    setIsDialogOpen(true);
  };

  const handleSelectAll = (checked) => {
      if (checked) {
          setSelectedRows(pendingItems.map((item) => item.serialNo));
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
      paymentDate: "",
      paymentAmount: "",
      gst: "",
      tds: "",
      sd: "",
      balance: "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedItem && (!isBulk || selectedRows.length === 0)) return;
    setIsSubmitting(true);

    try {
       const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
       const sheetId = import.meta.env.VITE_SHEET_ID;

       // 1. Identify Items to Process
       let itemsToProcess = [];
       if (isBulk) {
           itemsToProcess = pendingItems.filter(item => selectedRows.includes(item.serialNo));
       } else {
           itemsToProcess = [selectedItem];
       }

       // 2. Process Each Item
       const updatePromises = itemsToProcess.map(async (item) => {
          const rowUpdate = {};
          const addToUpdate = (key, val) => {
              const idx = columnMapping[key];
              if (idx !== undefined && idx >= 0) {
                  rowUpdate[idx] = val;
              }
          };

          addToUpdate("paymentDate", formData.paymentDate);
          addToUpdate("paymentAmount", formData.paymentAmount);
          addToUpdate("gst", formData.gst);
          addToUpdate("tds", formData.tds);
          addToUpdate("sd", formData.sd);
          addToUpdate("balance", formData.balance);
          
          // Mark as DONE (Actual9)
          const now = new Date();
          const timestamp =
            `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ` +
            `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
          
          addToUpdate("actual9", timestamp);

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
            Pending Payments
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500"
          >
            Payment History
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
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  Pending Payments
                </CardTitle>
                <div className="flex items-center gap-2">
                    {selectedRows.length >= 2 && (
                    <Button
                      onClick={handleBulkClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 transition-all duration-300 animate-in fade-in slide-in-from-right-4"
                      size="sm"
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Pay Selected ({selectedRows.length})
                    </Button>
                  )}
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1"
                  >
                    {pendingItems.length} Pending
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="overflow-x-auto">
                <Table className="[&_th]:text-center [&_td]:text-center">
                  <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                    <TableRow className="border-b border-blue-100 hover:bg-transparent">
                      <TableHead className="h-14 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap w-12">
                          Select
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
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
                        District
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Company
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Amount
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        JCC at HO
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
                           {Array.from({ length: 8 }).map((_, i) => (
                             <TableCell key={i}><div className="h-4 w-full bg-slate-200 rounded" /></TableCell>
                           ))}
                        </TableRow>
                      ))
                    ) : pendingItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No pending payment records found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingItems.map((item) => (
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
                              <CreditCard className="h-3.5 w-3.5" />
                              Pay
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
                            {item.district}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.company}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-800 font-medium">
                            ₹{item.paymentAmount || "0"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.jccAtHo || "-"}
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
              <div className="lg:hidden space-y-4 p-4 bg-slate-50">
               {isLoading ? (
                   <div className="text-center p-4 text-slate-500">Loading...</div>
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
                          Pending
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-t border-b py-3 my-2 border-slate-100">
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
                            Amount
                          </span>
                          <span className="font-medium text-slate-700">
                            ₹{item.amount || "0"}
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
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400 text-[10px] uppercase font-semibold">
                            District
                          </span>
                          <span className="font-medium text-slate-700">
                            {item.district}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={selectedRows.length >= 2}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleActionClick(item)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Process Payment
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
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-0.5 h-10 flex items-center">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  Payment History
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
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
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
                        District
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Payment Date
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Amount
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        GST
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        TDS
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        Balance
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
                           {Array.from({ length: 9 }).map((_, i) => (
                             <TableCell key={i}><div className="h-4 w-full bg-slate-200 rounded" /></TableCell>
                           ))}
                        </TableRow>
                      ))
                    ) : historyItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>No payment records found</p>
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
                          <TableCell className="whitespace-nowrap font-medium text-slate-800">
                            {item.beneficiaryName}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {item.district}
                          </TableCell>
                          <TableCell className="text-slate-600 bg-blue-50/30">
                            {item.paymentDate || "-"}
                          </TableCell>
                          <TableCell className="text-slate-800 font-medium bg-blue-50/30">
                            ₹{item.paymentAmount}
                          </TableCell>
                          <TableCell className="text-slate-600 bg-blue-50/30">
                            ₹{item.gst}
                          </TableCell>
                          <TableCell className="text-slate-600 bg-blue-50/30">
                            ₹{item.tds}
                          </TableCell>
                          <TableCell className="text-green-700 font-bold bg-green-50/50">
                            ₹{item.balance}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Paid
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4 bg-slate-50">
                {historyItems.map((item) => (
                  <Card
                    key={item.serialNo}
                    className="bg-white border text-sm shadow-sm"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-semibold text-blue-900">
                            #{item.serialNo}
                          </p>
                          <p className="text-base font-medium text-slate-800">
                            {item.beneficiaryName}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Paid
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 mt-2">
                        <div>
                          <span className="font-medium text-slate-500">
                            Amount:
                          </span>{" "}
                          ₹{item.paymentAmount}
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">
                            Date:
                          </span>{" "}
                          {item.paymentDate}
                        </div>
                        <div className="col-span-2">
                          <span className="font-bold text-green-700">
                            Balance: ₹{item.balance}
                          </span>
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

      {/* PAYMENT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent showCloseButton={!isSuccess} className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isSuccess ? "bg-transparent !shadow-none !border-none" : "bg-white"}`}>
        {isSuccess ? (
            <div className="flex flex-col items-center justify-center w-full p-8 text-center space-y-6 animate-in fade-in duration-300">
                <div className="rounded-full bg-white p-5 shadow-2xl shadow-green-900/20 ring-8 ring-white/10 animate-in zoom-in duration-500 ease-out relative">
                     <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping opacity-75"></div>
                    <IndianRupee className="h-16 w-16 text-green-600 scale-110" />
                </div>
                <h2 className="text-3xl font-bold text-white drop-shadow-md animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150 ease-out tracking-wide">
                    Payment Successful!
                </h2>
            </div>
        ) : (
            <>
          <DialogHeader className="p-6 pb-2 border-b border-blue-100 bg-blue-50/30">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="bg-blue-100 p-1.5 rounded-md">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </span>
              Process Payment
            </DialogTitle>
            <DialogDescription className="text-slate-500 ml-10">
              {isBulk ? (
                  <span>Applying changes to <span className="font-bold text-blue-700">{selectedRows.length} selected items</span>. All fields below will be updated for these items.</span>
              ) : (
                  <span>Enter payment details for <span className="font-semibold text-slate-700">{selectedItem?.beneficiaryName}</span></span>
              )}
            </DialogDescription>
          </DialogHeader>

          {(selectedItem || isBulk) && (
            <div className="grid gap-6 p-6">
              {/* BENEFICIARY DETAILS CARD - Hide in Bulk */}
              {!isBulk && selectedItem && (
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-100/50">
                  <span className="bg-white p-1 rounded shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  </span>
                  <h4 className="font-semibold text-blue-900">
                    Beneficiary Summary
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
                      Name
                    </span>
                    <p className="font-semibold text-slate-700">
                      {selectedItem.beneficiaryName}
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

              {/* PAYMENT INPUT FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">
                    Payment Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentDate: e.target.value })
                    }
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Amount</Label>
                  <Input
                    type="number"
                    value={formData.paymentAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentAmount: e.target.value,
                      })
                    }
                    placeholder="Enter Amount"
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">GST</Label>
                  <Input
                    type="number"
                    value={formData.gst}
                    onChange={(e) =>
                      setFormData({ ...formData, gst: e.target.value })
                    }
                    placeholder="Enter GST"
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">TDS</Label>
                  <Input
                    type="number"
                    value={formData.tds}
                    onChange={(e) =>
                      setFormData({ ...formData, tds: e.target.value })
                    }
                    placeholder="Enter TDS"
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">SD</Label>
                  <Input
                    type="number"
                    value={formData.sd}
                    onChange={(e) =>
                      setFormData({ ...formData, sd: e.target.value })
                    }
                    placeholder="Enter SD"
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Balance</Label>
                  <Input
                    type="number"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({ ...formData, balance: e.target.value })
                    }
                    placeholder="Enter Balance"
                    className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 pb-6 pr-6">
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
                    "Submit Payment"
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
