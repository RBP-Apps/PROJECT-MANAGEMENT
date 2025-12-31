import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { FileCheck, Upload, CheckCircle2 } from "lucide-react";

export default function SanctionPage() {
    const [pendingItems, setPendingItems] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("pending");
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Sheet Metadata
    const [sheetHeaders, setSheetHeaders] = useState({});
    const [columnMapping, setColumnMapping] = useState({});

    const [formData, setFormData] = useState({
        sanctionNo: "",
        sanctionDate: "",
        sanctionFile: null,
        sanctionFileObj: null,
        remarks: "", // This might map to 'otherRemark' or a specific sanction remark if it exists
    });

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
                setHistoryItems([]);
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

            if (headerRowIndex === -1 || !rawRows[headerRowIndex]) {
                console.error("Could not identify header row");
                setIsLoading(false);
                return;
            }

            const rawHeaders = rawRows[headerRowIndex].map(h => String(h).trim());
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
                company: findCol(['company']),
                installer: findCol(['installer']),
                otherRemark: findCol(['remark']),
                loiDocument: findCol(['loi', 'file']), // or 'loi document'
                mrNo: findCol(['mr', 'no']),
                mrDate: findCol(['mr', 'date']),
                amount: findCol(['amount']),
                paidBy: findCol(['paid', 'by']),
                beneficiaryShare: findCol(['share']),
                
                // Sanction Specifics
                sanctionNo: findCol(['sanction', 'no']),
                sanctionDate: findCol(['sanction', 'date']),
                sanctionFile: (() => {
                    const idx1 = findCol(['sanction', 'file']);
                    if (idx1 !== -1) return idx1;
                    const idx2 = findCol(['sanction', 'doc']);
                    if (idx2 !== -1) return idx2;
                    return findCol(['sanction', 'letter']);
                })(),

                // Logic Triggers
                planned2: findCol(['planned', '2']), // Pending Trigger
                actual2: findCol(['actual', '2']),   // History Trigger
                
                // Dependency Trigger
                actual1: findCol(['actual', '1']),   // Prerequisite for Sanction
            };

            const detectedHeaders = {};
            Object.keys(colMap).forEach(key => {
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
                    loiDocument: row[colMap.loiDocument] || "",
                    mrNo: row[colMap.mrNo] || "-",
                    mrDate: row[colMap.mrDate] || "-",
                    amount: row[colMap.amount] || "-",
                    paidBy: row[colMap.paidBy] || "-",
                    beneficiaryShare: row[colMap.beneficiaryShare] || "-",
                    
                    sanctionNo: row[colMap.sanctionNo] || "",
                    sanctionDate: row[colMap.sanctionDate] || "",
                    sanctionFile: row[colMap.sanctionFile] || "",
                    loiFileName: row[colMap.loiDocument] || "", // Alias for history table
                    
                    planned2: row[colMap.planned2],
                    actual2: row[colMap.actual2],
                    actual1: row[colMap.actual1], // Prerequisite
                    
                    rowIndex: i + 1
                };

                const isActual1 = item.actual1 && String(item.actual1).trim() !== "";
                const isPlanned2 = item.planned2 && String(item.planned2).trim() !== "";
                const isActual2 = item.actual2 && String(item.actual2).trim() !== "";

                // Logic: 
                // Pending: Current stage planned (Planned2), Current stage NOT done (!Actual2)
                // History: Current stage done (Actual2)
                
                if (isPlanned2 && !isActual2) {
                    parsedPending.push(item);
                } else if (isActual2) {
                    parsedHistory.push(item);
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
            sanctionNo: "",
            sanctionDate: "",
            sanctionFile: null,
            sanctionFileObj: null,
            remarks: "",
        });
        setIsDialogOpen(true);
    };

    const handleFileUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ 
                ...formData, 
                sanctionFile: e.target.files[0].name,
                sanctionFileObj: e.target.files[0]
            });
        }
    };

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    // ✅ Google Drive preview link (same as LOI-MR)
    const getPreviewUrl = (url) => {
    if (!url) return url;
    if (url.includes("/preview")) return url;

    const match = url.match(/[-\w]{25,}/);
    if (!match) return url;

    return `https://drive.google.com/file/d/${match[0]}/preview`;
    };

    const handleSubmit = async () => {
        if (!selectedItem) return;
        setIsSubmitting(true);

        try {
            const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL;
            const sheetId = import.meta.env.VITE_SHEET_ID;

            if (!scriptUrl) throw new Error("Script URL missing");

            // ✅ STEP 1: Prepare sparse row update (ONLY required columns)
            const rowUpdate = {};

            const addToUpdate = (key, value) => {
            const idx = columnMapping[key];
            if (idx !== undefined && idx >= 0 && value !== undefined && value !== null && value !== "") {
                rowUpdate[idx] = value;
            }
            };

            // Sanction fields
            addToUpdate('sanctionNo', formData.sanctionNo ? `'${formData.sanctionNo}` : "");
            addToUpdate('sanctionDate', formData.sanctionDate);

            // Actual2 timestamp (Google Sheet safe format)
            const now = new Date();
            const timestamp =
            `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ` +
            `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

            addToUpdate('actual2', timestamp);

             const payload = {
                action: 'update',
                sheet: 'Project Main',
                sheetName: 'Project Main',
                id: sheetId,
                rowIndex: selectedItem.rowIndex,
                rowData: JSON.stringify(rowUpdate),
            };

            let finalFileUrl = "";

            // ✅ STEP 1: Upload Sanction File (same as LOI-MR)
            if (formData.sanctionFileObj) {
            const base64 = await getBase64(formData.sanctionFileObj);

            const uploadBody = new URLSearchParams({
                action: "uploadFile",
                base64Data: base64,
                fileName: formData.sanctionFileObj.name,
                mimeType: formData.sanctionFileObj.type,
                folderId: import.meta.env.VITE_DRIVE_DOC_FOLDER_ID,
            });

            const upRes = await fetch(scriptUrl, {
                method: "POST",
                body: uploadBody,
            });

            const upResult = await upRes.json();
            if (!upResult.success || !upResult.fileUrl) {
                throw new Error("Sanction file upload failed");
            }

            finalFileUrl = upResult.fileUrl;
            }

            // ✅ STEP 2: Sheet update AFTER upload
            addToUpdate("sanctionNo", formData.sanctionNo ? `'${formData.sanctionNo}` : "");
            addToUpdate("sanctionDate", formData.sanctionDate);



            // ✅ Save Drive link into sheet
            if (finalFileUrl) {
            addToUpdate("sanctionFile", finalFileUrl);
            }

            // ✅ STEP 3: Final update call
            // ✅ STEP 3: Final update call
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
                if (textResult.includes("undefined") || textResult.trim() === "") {
                    // optimistically assume success
                    await fetchData();
                    setIsSuccess(true);
                    return;
                }
                alert("Server Error: " + textResult);
                return;
            }

            if (result.status === 'success' || result.success === true) {
                await fetchData();
                setIsSuccess(true);
            } else {
                alert("Update Failed: " + (result.message || result.error));
            }

        } catch (error) {
            console.error("Submission error:", error);
            alert("Failed to submit data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">
            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 relative p-1 bg-slate-100/80 h-14 rounded-xl border border-slate-200">
                    <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.5rem)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out ${activeTab === 'history' ? 'translate-x-full' : 'translate-x-0'}`} />
                    <TabsTrigger value="pending" className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500">
                        Pending Sanctions
                    </TabsTrigger>
                    <TabsTrigger value="history" className="z-10 h-full data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none transition-colors duration-200 text-base font-medium text-slate-500">
                        Sanction History
                    </TabsTrigger>
                </TabsList>

                {/* PENDING TAB */}
                <TabsContent value="pending" className="mt-6 focus-visible:outline-hidden animate-in fade-in-0 slide-in-from-left-4 duration-500 ease-out">
                    <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-0.5 h-10 flex items-center">
                            <div className="flex items-center justify-between w-full">
                                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                                    <div className="p-1 bg-blue-100 rounded-lg">
                                        <FileCheck className="h-4 w-4 text-blue-600" />
                                    </div>
                                    Pending for Sanction
                                </CardTitle>
                                <Badge variant="outline" 
                                    className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1">
                                    {pendingItems.length} Pending
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="hidden md:block overflow-x-auto">
                                <Table className="[&_th]:text-center [&_td]:text-center">
                                    <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                                        <TableRow className="border-b border-blue-100 hover:bg-transparent">
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
                                                    <TableCell><div className="h-4 w-32 bg-slate-200 rounded mx-auto"></div></TableCell>
                                                    <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                                                    <TableCell><div className="h-4 w-16 bg-slate-200 rounded mx-auto"></div></TableCell>
                                                    <TableCell><div className="h-4 w-24 bg-slate-200 rounded mx-auto"></div></TableCell>
                                                    <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                                                    <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                                                    <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                                                    <TableCell><div className="h-4 w-20 bg-slate-200 rounded mx-auto"></div></TableCell>
                                                </TableRow>
                                            ))
                                        ) : pendingItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={21} className="h-32 text-center text-muted-foreground">
                                                    No pending items found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pendingItems.map((item) => (
                                                <TableRow key={item.serialNo} className="hover:bg-blue-50/50 transition-colors">
                                                    <TableCell>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => handleActionClick(item)}
                                                            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 shadow-xs text-xs font-semibold h-8 px-4 rounded-full flex items-center gap-2 transition-all duration-300 mx-auto"
                                                        >
                                                            <FileCheck className="h-3.5 w-3.5" />
                                                            Sanction
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
                                                    <TableCell className="text-slate-600">{item.company}</TableCell>
                                                    <TableCell className="text-slate-600">{item.installer}</TableCell>
                                                    <TableCell className="text-slate-500 italic">{item.otherRemark || "-"}</TableCell>
                                                    <TableCell>
                                                        {item.loiDocument ? (
                                                            item.loiDocument.startsWith('http') ? (
                                                                <a
                                                                    href={getPreviewUrl(item.loiDocument)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 underline text-xs flex items-center justify-center gap-1"
                                                                    >
                                                                    <Upload className="h-4 w-4" />
                                                                    Preview
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-600 text-xs">{item.loiDocument}</span>
                                                            )
                                                        ) : ("-")}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600">{item.mrNo}</TableCell>
                                                    <TableCell className="text-slate-600">{item.mrDate}</TableCell>
                                                    <TableCell className="font-medium text-slate-800">₹{item.amount}</TableCell>
                                                    <TableCell className="text-slate-600">{item.paidBy}</TableCell>
                                                    <TableCell className="text-slate-600">{item.beneficiaryShare || "-"}</TableCell>
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
                <TabsContent value="history" className="mt-6 focus-visible:outline-hidden animate-in fade-in-0 slide-in-from-right-4 duration-500 ease-out">
                    <Card className="border border-blue-100 shadow-xl shadow-blue-100/20 bg-white/80 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="border-b border-blue-50 bg-blue-50/30 px-6 py-0.5 h-10 flex items-center">
                            <div className="flex items-center justify-between w-full">
                                <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                                    <div className="p-1 bg-blue-100 rounded-lg">
                                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                    </div>
                                    Sanctioned History
                                </CardTitle>
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                                    {historyItems.length} Records
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="hidden md:block overflow-x-auto">
                                <Table className="[&_th]:text-center [&_td]:text-center">
                                    <TableHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
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
                                            <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Sanction No</TableHead>
                                            <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Sanction Date</TableHead>
                                            <TableHead className="h-14 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Sanction Doc</TableHead>
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
                                        ) : historyItems.length === 0 ? (
                                            <TableRow>
                                            <TableCell colSpan={28} className="h-48 text-center text-slate-500 bg-slate-50/30">
                                                No foundation history found.
                                            </TableCell>
                                            </TableRow>
                                        ) : (
                            historyItems.map((item) => (
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
                                                    <TableCell className="text-slate-600">{item.installer}</TableCell>
                                                    <TableCell className="text-slate-500 italic">{item.otherRemark || "-"}</TableCell>
                                                    <TableCell>
                                                        {item.loiFileName ? (
                                                            item.loiFileName.startsWith('http') ? (
                                                                <a
                                                                    href={getPreviewUrl(item.loiFileName)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 underline text-xs flex items-center justify-center gap-1"
                                                                    >
                                                                    <Upload className="h-4 w-4" />
                                                                    View Document
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-600 text-xs">{item.loiFileName}</span>
                                                            )
                                                        ) : ("-")}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600">{item.mrNo}</TableCell>
                                                    <TableCell className="text-slate-600">{item.mrDate}</TableCell>
                                                    <TableCell className="font-medium text-slate-800">₹{item.amount}</TableCell>
                                                    <TableCell className="text-slate-600">{item.paidBy}</TableCell>
                                                    <TableCell className="text-slate-600">{item.beneficiaryShare || "-"}</TableCell>
                                                    <TableCell className="bg-blue-50/50">
                                                        {item.sanctionNo ? (
                                                            <span className="text-blue-600 underline text-xs cursor-pointer font-medium hover:text-blue-800">
                                                                {item.sanctionNo}
                                                            </span>
                                                        ) : ("-")}
                                                    </TableCell>
                                                    <TableCell className="bg-blue-50/50 text-blue-700 font-mono text-xs">{item.sanctionDate}</TableCell>
                                                    <TableCell>
                                                        {item.sanctionFile ? (
                                                            item.sanctionFile.startsWith('http') ? (
                                                                <a
                                                                    href={getPreviewUrl(item.sanctionFile)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 underline text-xs flex items-center justify-center gap-1"
                                                                    >
                                                                    <Upload className="h-4 w-4" />
                                                                    View Document
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-600 text-xs">{item.sanctionFile}</span>
                                                            )
                                                        ) : ("-")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-green-100 text-green-800 shadow-sm border border-green-200">
                                                            Sanctioned
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
            </Tabs>

                {/* SANCTION DIALOG WITH PREFILLED INFO */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isSuccess ? "bg-transparent shadow-none border-none" : ""}`}>
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center w-full p-8 text-center space-y-6 animate-in fade-in duration-300">
                            <div className="rounded-full bg-white p-5 shadow-2xl shadow-white/20 ring-8 ring-white/10 animate-in zoom-in duration-500 ease-out">
                                <CheckCircle2 className="h-16 w-16 text-green-600 scale-110" />
                            </div>
                            <h2 className="text-3xl font-bold text-white drop-shadow-md animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150 ease-out tracking-wide">
                                Approved Successfully!
                            </h2>
                        </div>
                    ) : (
                        <>
                        <DialogHeader className="p-6 pb-2 border-b border-blue-100 bg-blue-50/30">
                            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
                                <span className="bg-blue-100 p-1.5 rounded-md">
                                    <FileCheck className="h-4 w-4 text-blue-600" />
                                </span>
                                Process Sanction Order
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 ml-10">
                                 Processing sanction for <span className="font-semibold text-slate-700">{selectedItem?.beneficiaryName}</span> <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600 border border-slate-200">{selectedItem?.serialNo}</span>
                            </DialogDescription>
                        </DialogHeader>

                        {selectedItem && (
                            <div className="p-6 space-y-6">
                                {/* PREFILLED BENEFICIARY DETAILS CARD */}
                                <div className="rounded-xl border border-blue-100 bg-linear-to-br from-blue-50/50 to-cyan-50/30 p-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2 border-b border-blue-100 pb-2">
                                        <span className="bg-white p-1 rounded shadow-sm">
                                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                        </span>
                                        BENEFICIARY DETAILS
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-1">Reg ID</span>
                                            <div className="font-medium text-slate-700 font-mono bg-white/50 px-2 py-1 rounded border border-blue-100/50 inline-block">
                                                {selectedItem.regId}
                                            </div>
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
                                            <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-1">Pump Type</span>
                                            <Badge variant="secondary" className="bg-white text-blue-700 border-blue-200 shadow-sm font-medium">
                                                {selectedItem.pumpType}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-blue-900/60 block mb-1">Company</span>
                                            <p className="font-medium text-slate-700 font-mono text-xs">{selectedItem.company}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* SANCTION INPUT FORM */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-5 w-1 bg-cyan-500 rounded-full"></div>
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Sanction Details</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-700">Sanction Number</Label>
                                            <Input 
                                                value={formData.sanctionNo} 
                                                onChange={(e) => setFormData({ ...formData, sanctionNo: e.target.value })} 
                                                placeholder="Enter sanction serial no"
                                                className="h-10 border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 transition-all bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-700">Sanction Date</Label>
                                            <Input 
                                                type="date" 
                                                value={formData.sanctionDate} 
                                                onChange={(e) => setFormData({ ...formData, sanctionDate: e.target.value })} 
                                                className="h-10 border-slate-200 focus:border-cyan-400 focus-visible:ring-cyan-100 transition-all bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-sm font-medium text-slate-700">Sanction Document</Label>
                                             <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer group border-blue-100/50 hover:border-blue-200" onClick={() => document.getElementById("sanction-file")?.click()}>
                                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                                    <Upload className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                                                        {formData.sanctionFile ? formData.sanctionFile : "Click to Upload Sanction Document"}
                                                    </span>
                                                    <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, DOCX up to 10MB</p>
                                                </div>
                                                <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" id="sanction-file"/>
                                             </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="h-10 px-6 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-800">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSubmit} disabled={isSubmitting} className="h-10 px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all">
                                        {isSubmitting ? "Processing..." : "Approve & Sanction"}
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
