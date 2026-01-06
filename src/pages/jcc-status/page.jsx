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
import {
  FileCheck,
  CheckCircle2,
  Upload,
  Activity,
  Loader2,
  ClipboardCheck,
  Search,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function JccStatusPage() {
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

  const [filters, setFilters] = useState({
    regId: "",
    village: "",
    block: "",
    district: "",
    pumpType: "",
    company: "",
  });

  const getUniquePendingValues = (field) => {
    const values = pendingItems
      .map((item) => item[field])
      .filter((v) => v && v !== "-");
    return [...new Set(values)].sort();
  };

  const getUniqueHistoryValues = (field) => {
    const values = historyItems
      .map((item) => item[field])
      .filter((v) => v && v !== "-");
    return [...new Set(values)].sort();
  };

  // const filteredPendingItems = pendingItems.filter((item) =>
  //   Object.values(item).some((value) =>
  //     String(value).toLowerCase().includes(searchTerm.toLowerCase())
  //   )
  // );

  // const filteredHistoryItems = historyItems.filter((item) =>
  //   Object.values(item).some((value) =>
  //     String(value).toLowerCase().includes(searchTerm.toLowerCase())
  //   )
  // );

  const filteredPendingItems = pendingItems.filter((item) => {
    const matchesSearch = Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesFilters =
      (!filters.regId || item.regId === filters.regId) &&
      (!filters.village || item.village === filters.village) &&
      (!filters.block || item.block === filters.block) &&
      (!filters.district || item.district === filters.district) &&
      (!filters.pumpType || item.pumpType === filters.pumpType) &&
      (!filters.company || item.company === filters.company);

    return matchesSearch && matchesFilters;
  });

  const filteredHistoryItems = historyItems.filter((item) => {
    const matchesSearch = Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesFilters =
      (!filters.regId || item.regId === filters.regId) &&
      (!filters.village || item.village === filters.village) &&
      (!filters.block || item.block === filters.block) &&
      (!filters.district || item.district === filters.district) &&
      (!filters.pumpType || item.pumpType === filters.pumpType) &&
      (!filters.company || item.company === filters.company);

    return matchesSearch && matchesFilters;
  });

  const [formData, setFormData] = useState({
    jccAtDo: "",
    doJccReceivingFile: null,
    doAgeing: "",
    jccAtRo: "",
    roAgeing: "",
    jccAtZo: "",
    zoAgeing: "",
    jccAtHo: "",
    hoAgeing: "",
  });

  // Helper to construct preview URLs
  const getPreviewUrl = (idOrLink) => {
    if (!idOrLink) return "";
    const idMatch = idOrLink.match(/[-\w]{25,}/);
    const fileId = idMatch ? idMatch[0] : idOrLink;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  const fetchData = async () => {
    console.log("Fetching JCC Status Data...");
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

      const rawHeaders = rawRows[headerRowIndex].map((h) => String(h).trim());
      const headers = rawHeaders.map((h) => h.toLowerCase());

      const findCol = (keys) =>
        headers.findIndex((h) =>
          keys.every((k) => h.replace(/\s+/g, "").includes(k))
        );

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
        jccCertificateNo: findCol(["invoice", "no"]), // Using Invoice No as JCC Cert No placeholder if needed, or explicitly look for JCC Cert
        jccDate: findCol(["jcc", "completion"]), // Use Completion Date as JCC Date reference

        // JCC Status Columns
        jccAtDo: findCol(["jcc", "at", "do"]),
        doJccReceivingFile: findCol(["do", "jcc", "receiving"]),
        doAgeing: findCol(["do", "ageing"]),
        jccAtRo: findCol(["ro", "date"]), // Matches "RO (Date)"
        roAgeing: findCol(["ro", "ageing"]),
        jccAtZo: findCol(["zo", "date"]), // Matches "ZO (Date)"
        zoAgeing: findCol(["zo", "ageing"]),
        jccAtHo: findCol(["ho", "date"]), // Matches "HO (Date)"
        hoAgeing: findCol(["ho", "ageing"]),

        // Triggers
        actual7: (() => {
          const i = findCol(["actual", "7"]);
          if (i !== -1) return i;
          // Fallback to JCC Completion Date as proxy if Actual7 missing
          return findCol(["jcc", "completion"]);
        })(),
        planned8: findCol(["planned", "8"]), // JCC Status Planned
        actual8: (() => {
          const i = findCol(["actual", "8"]);
          if (i !== -1) return i;
          return findCol(["jcc", "status"]);
        })(),
      };

      // Fine tune JCC Cert No if specific column exists
      const jccCertIdx = findCol(["jcc", "cert"]);
      if (jccCertIdx !== -1) colMap.jccCertificateNo = jccCertIdx;

      setColumnMapping(colMap);

      const pending = [];
      const history = [];

      for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || !row[colMap.regId]) continue;

        const getVal = (idx) =>
          idx !== -1 && row[idx] !== undefined ? row[idx] : "";

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
          jccCertificateNo: getVal(colMap.jccCertificateNo),
          jccDate: getVal(colMap.jccDate),

          // Status Data
          jccAtDo: getVal(colMap.jccAtDo),
          doJccReceivingFile: getVal(colMap.doJccReceivingFile),
          doAgeing: getVal(colMap.doAgeing),
          jccAtRo: getVal(colMap.jccAtRo),
          roAgeing: getVal(colMap.roAgeing),
          jccAtZo: getVal(colMap.jccAtZo),
          zoAgeing: getVal(colMap.zoAgeing),
          jccAtHo: getVal(colMap.jccAtHo),
          hoAgeing: getVal(colMap.hoAgeing),

          actual7: getVal(colMap.actual7),
          planned8: getVal(colMap.planned8),
          actual8: getVal(colMap.actual8),
          rowIndex: i + 1,
        };

        const isPlanned8 = item.planned8 && String(item.planned8).trim() !== "";
        const isStatusDone = item.actual8 && String(item.actual8).trim() !== "";

        if (isStatusDone) {
          history.push(item);
        } else if (isPlanned8) {
          // Planned8 present, Status NOT Done -> Pending
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
      jccAtDo: item.jccAtDo || "",
      doJccReceivingFile: item.doJccReceivingFile || null,
      doAgeing: item.doAgeing || "",
      jccAtRo: item.jccAtRo || "",
      roAgeing: item.roAgeing || "",
      jccAtZo: item.jccAtZo || "",
      zoAgeing: item.zoAgeing || "",
      jccAtHo: item.jccAtHo || "",
      hoAgeing: item.hoAgeing || "",
    });
    setIsDialogOpen(true);
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
      jccAtDo: "",
      doJccReceivingFile: null,
      doAgeing: "",
      jccAtRo: "",
      roAgeing: "",
      jccAtZo: "",
      zoAgeing: "",
      jccAtHo: "",
      hoAgeing: "",
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        doJccReceivingFile: e.target.files[0].name,
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem && (!isBulk || selectedRows.length === 0)) return;
    setIsSubmitting(true);

    try {
      const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
      const sheetId = import.meta.env.VITE_SHEET_ID;

      // 1. Upload File (if exists) - Single upload for bulk
      let fileLink = formData.doJccReceivingFile;

      const fileInput = document.getElementById("do-jcc-receiving-file");

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
        itemsToProcess = pendingItems.filter((item) =>
          selectedRows.includes(item.serialNo)
        );
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

        addToUpdate("jccAtDo", formData.jccAtDo);
        addToUpdate("doJccReceivingFile", fileLink);
        addToUpdate("doAgeing", formData.doAgeing);
        addToUpdate("jccAtRo", formData.jccAtRo);
        addToUpdate("roAgeing", formData.roAgeing);
        addToUpdate("jccAtZo", formData.jccAtZo);
        addToUpdate("zoAgeing", formData.zoAgeing);
        addToUpdate("jccAtHo", formData.jccAtHo);
        addToUpdate("hoAgeing", formData.hoAgeing);

        // Mark as DONE (Actual8)
        const now = new Date();
        const timestamp =
          `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(
            2,
            "0"
          )}/${String(now.getDate()).padStart(2, "0")} ` +
          `${String(now.getHours()).padStart(2, "0")}:${String(
            now.getMinutes()
          ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

        addToUpdate("actual8", timestamp);

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
      const failed = results.filter(
        (r) => r.status === "error" || r.result === "error"
      );
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
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  Pending Status Updates
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
                      Status Selected ({selectedRows.length})
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

            {/* Filter Dropdowns */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-blue-50">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: "regId", label: "Reg ID" },
                  { key: "village", label: "Village" },
                  { key: "block", label: "Block" },
                  { key: "district", label: "District" },
                  { key: "pumpType", label: "Pump Type" },
                  { key: "company", label: "Company" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-slate-600">{label}</Label>
                    <select
                      value={filters[key]}
                      onChange={(e) =>
                        setFilters({ ...filters, [key]: e.target.value })
                      }
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">All</option>
                      {getUniquePendingValues(key).map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    regId: "",
                    village: "",
                    block: "",
                    district: "",
                    pumpType: "",
                    company: "",
                  })
                }
                className="mt-3 text-xs"
              >
                Clear All Filters
              </Button>
            </div>

            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="overflow-x-auto">
                <Table className="[&_th]:text-center [&_td]:text-center">
                  <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                    <TableRow className="border-b border-blue-100 hover:bg-transparent">
                      <TableHead className="h-14 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap w-12">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={
                              filteredPendingItems.length > 0 &&
                              selectedRows.length ===
                                filteredPendingItems.length
                            }
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all rows"
                            className="checkbox-3d border-slate-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-5 w-5 shadow-sm transition-all duration-300 ease-out"
                          />
                        </div>
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
                        Company
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        JCC Cert No
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        JCC Date
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
                          <TableCell>
                            <div className="h-8 w-24 bg-slate-200 rounded-full mx-auto" />
                          </TableCell>
                          {Array.from({ length: 9 }).map((_, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded" />
                            </TableCell>
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
                              <Activity className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>
                              No pending JCC status records found matching your
                              search
                            </p>
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
                                onCheckedChange={(checked) =>
                                  handleSelectRow(item.serialNo, checked)
                                }
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
                              <FileCheck className="h-3.5 w-3.5" />
                              Status
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
                            {item.company}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.jccCertificateNo || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-slate-600">
                            {item.jccDate || "-"}
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
                  <div className="text-center p-4 text-slate-500">
                    Loading...
                  </div>
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
                          <div className="col-span-2">
                            <span className="font-medium text-slate-600">
                              JCC Cert:
                            </span>{" "}
                            <span className="text-slate-800">
                              {item.jccCertificateNo || "-"}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          disabled={selectedRows.length >= 2}
                          className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleActionClick(item)}
                        >
                          <FileCheck className="h-4 w-4 mr-2" />
                          Update Status
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
            <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-3 flex flex-col md:flex-row items-center gap-4 md:gap-0 justify-between h-auto min-h-[3.5rem]">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  JCC Status History
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

            {/* Filter Dropdowns */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-blue-50">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: "regId", label: "Reg ID" },
                  { key: "village", label: "Village" },
                  { key: "block", label: "Block" },
                  { key: "district", label: "District" },
                  { key: "pumpType", label: "Pump Type" },
                  { key: "company", label: "Company" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-slate-600">{label}</Label>
                    <select
                      value={filters[key]}
                      onChange={(e) =>
                        setFilters({ ...filters, [key]: e.target.value })
                      }
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">All</option>
                      {getUniqueHistoryValues(key).map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    regId: "",
                    village: "",
                    block: "",
                    district: "",
                    pumpType: "",
                    company: "",
                  })
                }
                className="mt-3 text-xs"
              >
                Clear All Filters
              </Button>
            </div>

            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="overflow-x-auto">
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
                        JCC Cert No
                      </TableHead>
                      <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        JCC at DO
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
                          {Array.from({ length: 9 }).map((_, i) => (
                            <TableCell key={i}>
                              <div className="h-4 w-full bg-slate-200 rounded" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredHistoryItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-48 text-center text-slate-500 bg-slate-50/30"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <FileCheck className="h-6 w-6 text-slate-400" />
                            </div>
                            <p>
                              {historyItems.length === 0
                                ? "No JCC status records yet."
                                : "No history records found matching your search."}
                            </p>
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
                          <TableCell className="text-slate-600">
                            {item.jccCertificateNo || "-"}
                          </TableCell>
                          <TableCell className="text-slate-600 bg-blue-50/30">
                            {item.jccAtDo || "-"}
                          </TableCell>
                          <TableCell className="text-slate-600 bg-blue-50/30">
                            {item.jccAtHo || "-"}
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
                            #{item.serialNo}
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
                            JCC at DO:
                          </span>{" "}
                          {item.jccAtDo || "-"}
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">
                            JCC at HO:
                          </span>{" "}
                          {item.jccAtHo || "-"}
                        </div>
                        {item.doJccReceivingFile && (
                          <div className="col-span-2">
                            <span className="font-medium text-slate-500">
                              DO File:
                            </span>{" "}
                            <span
                              className="text-blue-600 underline cursor-pointer"
                              onClick={() =>
                                window.open(
                                  getPreviewUrl(item.doJccReceivingFile),
                                  "_blank"
                                )
                              }
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

      {/* JCC STATUS DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          showCloseButton={!isSuccess}
          className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
            isSuccess ? "bg-transparent !shadow-none !border-none" : "bg-white"
          }`}
        >
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
                    <Activity className="h-4 w-4 text-blue-600" />
                  </span>
                  Enter JCC Status Information
                </DialogTitle>
                <DialogDescription className="text-slate-500 ml-10">
                  {isBulk ? (
                    <span>
                      Applying changes to{" "}
                      <span className="font-bold text-blue-700">
                        {selectedRows.length} selected items
                      </span>
                      . All fields below will be updated for these items.
                    </span>
                  ) : (
                    <span>
                      Enter JCC status details for{" "}
                      <span className="font-semibold text-slate-700">
                        {selectedItem?.beneficiaryName}
                      </span>
                    </span>
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

                  {/* JCC STATUS INPUT FORM */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        JCC at DO (Date)
                      </Label>
                      <Input
                        type="date"
                        value={formData.jccAtDo}
                        onChange={(e) =>
                          setFormData({ ...formData, jccAtDo: e.target.value })
                        }
                        className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        DO JCC Receiving (File)
                      </Label>
                      <div className="flex flex-col gap-3">
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="do-jcc-receiving-file"
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            document
                              .getElementById("do-jcc-receiving-file")
                              ?.click()
                          }
                          className="border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 w-full h-24 flex flex-col gap-2 relative overflow-hidden group transition-all"
                        >
                          <div className="absolute inset-0 bg-blue-100/0 group-hover:bg-blue-100/20 transition-colors" />
                          <Upload className="h-6 w-6 relative z-10" />
                          <span className="relative z-10">
                            {formData.doJccReceivingFile
                              ? "Change File"
                              : "Click to upload DO File"}
                          </span>
                        </Button>
                        {formData.doJccReceivingFile && (
                          <div className="flex items-center gap-2 p-1.5 bg-green-50 text-green-700 rounded-md border border-green-200 text-xs self-start">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="font-medium truncate max-w-[200px]">
                              {formData.doJccReceivingFile}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        DO Ageing
                      </Label>
                      <Input
                        value={formData.doAgeing}
                        onChange={(e) =>
                          setFormData({ ...formData, doAgeing: e.target.value })
                        }
                        placeholder="Enter DO Ageing"
                        className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        JCC at RO (Date)
                      </Label>
                      <Input
                        type="date"
                        value={formData.jccAtRo}
                        onChange={(e) =>
                          setFormData({ ...formData, jccAtRo: e.target.value })
                        }
                        className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        RO Ageing
                      </Label>
                      <Input
                        value={formData.roAgeing}
                        onChange={(e) =>
                          setFormData({ ...formData, roAgeing: e.target.value })
                        }
                        placeholder="Enter RO Ageing"
                        className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        JCC at ZO (Date)
                      </Label>
                      <Input
                        type="date"
                        value={formData.jccAtZo}
                        onChange={(e) =>
                          setFormData({ ...formData, jccAtZo: e.target.value })
                        }
                        className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        ZO Ageing
                      </Label>
                      <Input
                        value={formData.zoAgeing}
                        onChange={(e) =>
                          setFormData({ ...formData, zoAgeing: e.target.value })
                        }
                        placeholder="Enter ZO Ageing"
                        className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        JCC at HO (Date)
                      </Label>
                      <Input
                        type="date"
                        value={formData.jccAtHo}
                        onChange={(e) =>
                          setFormData({ ...formData, jccAtHo: e.target.value })
                        }
                        className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        HO Ageing
                      </Label>
                      <Input
                        value={formData.hoAgeing}
                        onChange={(e) =>
                          setFormData({ ...formData, hoAgeing: e.target.value })
                        }
                        placeholder="Enter HO Ageing"
                        className="border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 bg-white"
                      />
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
                        "Submit Status"
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
