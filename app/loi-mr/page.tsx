"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil } from "lucide-react"

interface Beneficiary {
  serialNo: string
  regId: string
  beneficiaryName: string
  fatherName: string
  village: string
  block: string
  district: string
  category: string
  pumpSource: string
  pumpType: string
  company: string
}

interface ProcessedRecord extends Beneficiary {
  installer: string
  otherRemark: string
  loiFileName: string | null
  mrNo: string
  mrDate: string
  amount: string
  paidBy: string
  beneficiaryShare: string
  processedAt: string
}

export default function LoiMrPage() {
  const [pendingItems, setPendingItems] = useState<Beneficiary[]>([])
  const [historyItems, setHistoryItems] = useState<ProcessedRecord[]>([])
  const [selectedItem, setSelectedItem] = useState<Beneficiary | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state for processing
  const [formData, setFormData] = useState({
    beneficiaryName: "",
    company: "",
    installer: "",
    otherRemark: "",
    loiFileName: null as string | null,
    mrNo: "",
    mrDate: "",
    amount: "",
    paidBy: "",
    beneficiaryShare: "",
  })

  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const pending = localStorage.getItem("beneficiaryHistory")
    const processed = localStorage.getItem("loiMrHistory")

    if (pending) {
      try {
        setPendingItems(JSON.parse(pending))
      } catch (e) {
        console.error("Error loading pending items")
      }
    }

    if (processed) {
      try {
        setHistoryItems(JSON.parse(processed))
      } catch (e) {
        console.error("Error loading history")
      }
    }

    setIsLoaded(true)
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("loiMrHistory", JSON.stringify(historyItems))
    }
  }, [historyItems, isLoaded])

  const handleActionClick = (item: Beneficiary) => {
    setSelectedItem(item)
    setFormData({
      beneficiaryName: item.beneficiaryName,
      company: item.company,
      installer: "",
      otherRemark: "",
      loiFileName: null,
      mrNo: "",
      mrDate: "",
      amount: "",
      paidBy: "",
      beneficiaryShare: "",
    })
    setIsDialogOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, loiFileName: e.target.files[0].name })
    }
  }

  const handleSubmit = () => {
    if (!selectedItem) return

    const newRecord: ProcessedRecord = {
      ...selectedItem,
      ...formData,
      processedAt: new Date().toISOString(),
    }

    // Move from pending to history
    setPendingItems((prev) => prev.filter((i) => i.serialNo !== selectedItem.serialNo))
    setHistoryItems((prev) => [newRecord, ...prev])

    // Update portal history (remove from pending source if needed)
    localStorage.setItem(
      "beneficiaryHistory",
      JSON.stringify(pendingItems.filter((i) => i.serialNo !== selectedItem.serialNo))
    )

    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-full mx-auto">


      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ====================== PENDING TAB ====================== */}
        <TabsContent value="pending" className="mt-6">
          <Card className="border border-blue-100 shadow-lg bg-white">

            <CardContent className="pt-6">
              {pendingItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No pending items. Add beneficiaries in the Portal first.
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                        <TableRow className="border-b border-blue-200">
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap w-32">Action</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Serial No</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Reg ID</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Father's Name</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Village</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Block</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">District</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Category</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Pump Source</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Pump Type</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Company</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingItems.map((item) => (
                          <TableRow key={item.serialNo}>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActionClick(item)}
                                className="flex items-center gap-1"
                              >
                                <Pencil className="h-4 w-4" />
                                Process
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{item.serialNo}</TableCell>
                            <TableCell>{item.regId}</TableCell>
                            <TableCell>{item.beneficiaryName}</TableCell>
                            <TableCell>{item.fatherName}</TableCell>
                            <TableCell>{item.village}</TableCell>
                            <TableCell>{item.block}</TableCell>
                            <TableCell>{item.district}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.pumpSource}</TableCell>
                            <TableCell>{item.pumpType}</TableCell>
                            <TableCell>{item.company}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                Pending
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {pendingItems.map((item) => (
                      <Card key={item.serialNo} className="bg-white border text-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="font-bold text-blue-900 block text-xs tracking-wider">#{item.serialNo}</span>
                              <h4 className="font-semibold text-base">{item.beneficiaryName}</h4>
                              <p className="text-muted-foreground text-xs">{item.regId}</p>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                              Pending
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-b py-3 my-2 border-gray-100">
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Father's Name</span>
                              <span className="font-medium">{item.fatherName}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Company</span>
                              <span className="font-medium">{item.company}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Village</span>
                              <span className="font-medium">{item.village}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">District</span>
                              <span className="font-medium">{item.district}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Pump Type</span>
                              <span className="font-medium">{item.pumpType}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Category</span>
                              <span className="font-medium">{item.category}</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActionClick(item)}
                            className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Process Application
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====================== HISTORY TAB ====================== */}
        <TabsContent value="history" className="mt-6">
          <Card className="border border-purple-100 shadow-lg bg-white">

            <CardContent className="pt-6">
              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No processed records yet.
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                        <TableRow className="border-b border-blue-200">
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Serial No</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Reg ID</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Father's Name</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Village</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Block</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">District</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Category</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Pump Source</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Pump Type</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Company</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Installer</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Other Remark</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">LOI Document</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">MR No</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">MR Date</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Amount</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Paid By</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Beneficiary Share</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyItems.map((item) => (
                          <TableRow key={item.serialNo}>
                            <TableCell className="font-medium whitespace-nowrap">{item.serialNo}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.regId}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.beneficiaryName}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.fatherName}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.village}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.block}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.district}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.category}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.pumpSource}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.pumpType}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.company}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.installer || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.otherRemark || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {item.loiFileName ? (
                                <span className="text-blue-600 underline text-xs cursor-pointer">
                                  {item.loiFileName}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{item.mrNo || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.mrDate || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">₹{item.amount || "0"}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.paidBy || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.beneficiaryShare || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge className="bg-green-100 text-green-800">Processed</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View History */}
                  <div className="md:hidden space-y-4">
                    {historyItems.map((item) => (
                      <Card key={item.serialNo} className="bg-white border text-sm shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="font-bold text-blue-900 block text-xs tracking-wider">#{item.serialNo}</span>
                              <h4 className="font-semibold text-base">{item.beneficiaryName}</h4>
                              <p className="text-muted-foreground text-xs">{item.regId}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 text-xs">Processed</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-b py-3 my-2 border-gray-100">
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">MR No</span>
                              <span className="font-medium">{item.mrNo || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">MR Date</span>
                              <span className="font-medium">{item.mrDate || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Amount</span>
                              <span className="font-medium">₹{item.amount || '0'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Installer</span>
                              <span className="font-medium">{item.installer || '-'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground text-[10px] uppercase block mb-1">LOI Document</span>
                              {item.loiFileName ? (
                                <span className="text-blue-600 underline cursor-pointer">{item.loiFileName}</span>
                              ) : (
                                <span className="text-gray-400 italic">No document</span>
                              )}
                            </div>
                          </div>

                          <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                            <span className="font-semibold">Note:</span> {item.otherRemark || "No remarks"}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====================== PROCESSING DIALOG ====================== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process LOI & MR</DialogTitle>
            <DialogDescription>
              Fill in details for <strong>{selectedItem?.beneficiaryName}</strong> ({selectedItem?.serialNo})
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="grid gap-6 py-4">
              {/* Beneficiary Info - Read Only */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Beneficiary Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Reg ID</span>
                    <span className="font-medium text-slate-700">{selectedItem.regId}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Father's Name</span>
                    <span className="font-medium text-slate-700">{selectedItem.fatherName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Village & Block</span>
                    <span className="font-medium text-slate-700">{selectedItem.village}, {selectedItem.block}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">District</span>
                    <span className="font-medium text-slate-700">{selectedItem.district}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Category</span>
                    <span className="font-medium text-slate-700">{selectedItem.category}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Pump Type</span>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                      {selectedItem.pumpType}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Processing Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">Beneficiary Name</Label>
                    <div className="relative">
                      <Input
                        value={formData.beneficiaryName}
                        readOnly
                        className="bg-gray-100 pl-10 border-gray-200"
                      />
                      <div className="absolute left-3 top-2.5 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">Company</Label>
                    <div className="relative">
                      <Input
                        value={formData.company}
                        readOnly
                        className="bg-gray-100 pl-10 border-gray-200"
                      />
                      <div className="absolute left-3 top-2.5 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">Installer Name</Label>
                    <Select value={formData.installer} onValueChange={(v) => setFormData({ ...formData, installer: v })}>
                      <SelectTrigger className="border-gray-200 focus:border-blue-400">
                        <SelectValue placeholder="Select Installer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tata Power Solar">Tata Power Solar</SelectItem>
                        <SelectItem value="Adani Solar">Adani Solar</SelectItem>
                        <SelectItem value="Waree Energies">Waree Energies</SelectItem>
                        <SelectItem value="Vikram Solar">Vikram Solar</SelectItem>
                        <SelectItem value="Goldi Solar">Goldi Solar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">Other Remark</Label>
                    <Input
                      value={formData.otherRemark}
                      onChange={(e) => setFormData({ ...formData, otherRemark: e.target.value })}
                      placeholder="Any notes..."
                      className="border-gray-200 focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-semibold text-gray-600">LOI Document</Label>
                    <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="loi-upload"
                      />
                      <span
                        onClick={() => document.getElementById("loi-upload")?.click()}
                        className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
                      >
                        {formData.loiFileName ? 'Change LOI File' : 'Upload LOI Document'}
                      </span>
                      {formData.loiFileName && (
                        <span className="text-sm font-medium text-gray-700 ml-2">
                          - {formData.loiFileName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">MR No</Label>
                    <Input
                      value={formData.mrNo}
                      onChange={(e) => setFormData({ ...formData, mrNo: e.target.value })}
                      placeholder="e.g. MR/2025/001"
                      className="border-gray-200 focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">MR Date</Label>
                    <Input
                      type="date"
                      value={formData.mrDate}
                      onChange={(e) => setFormData({ ...formData, mrDate: e.target.value })}
                      className="border-gray-200 focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">Amount (₹)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                      <Input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="pl-7 border-gray-200 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">Paid By</Label>
                    <Input
                      value={formData.paidBy}
                      onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                      placeholder="Enter payer name"
                      className="border-gray-200 focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-600">Beneficiary Share</Label>
                    <Select value={formData.beneficiaryShare} onValueChange={(v) => setFormData({ ...formData, beneficiaryShare: v })}>
                      <SelectTrigger className="border-gray-200 focus:border-blue-400">
                        <SelectValue placeholder="Select Share" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10%">10%</SelectItem>
                        <SelectItem value="20%">20%</SelectItem>
                        <SelectItem value="30%">30%</SelectItem>
                        <SelectItem value="40%">40%</SelectItem>
                        <SelectItem value="50%">50%</SelectItem>
                        <SelectItem value="100%">100%</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Not Paid">Not Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Submit & Move to History
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}