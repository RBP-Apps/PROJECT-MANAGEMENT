"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileCheck } from "lucide-react"

interface LoiMrRecord {
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
  installer: string
  otherRemark?: string
  loiFileName?: string | null
  mrNo: string
  mrDate: string
  amount: string
  paidBy: string
  beneficiaryShare?: string
}

interface SanctionRecord extends LoiMrRecord {
  sanctionNo: string | null
  sanctionDate: string
  sanctionedAt: string
}

export default function SanctionPage() {
  const [pendingItems, setPendingItems] = useState<LoiMrRecord[]>([])
  const [historyItems, setHistoryItems] = useState<SanctionRecord[]>([])
  const [selectedItem, setSelectedItem] = useState<LoiMrRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [formData, setFormData] = useState({
    sanctionLoad: "",
    sanctionDate: "",
    sanctionFile: null as string | null,
    remarks: "",
  })

  useEffect(() => {
    const loiMrHistory = localStorage.getItem("loiMrHistory")
    const sanctionHistory = localStorage.getItem("sanctionHistory")

    let processedLoi: LoiMrRecord[] = []
    let processedSanctions: SanctionRecord[] = []

    if (sanctionHistory) {
      try {
        processedSanctions = JSON.parse(sanctionHistory)
        setHistoryItems(processedSanctions)
      } catch (e) {
        console.error("Error parsing sanction history")
      }
    }

    if (loiMrHistory) {
      try {
        const allLoiRequest = JSON.parse(loiMrHistory)
        const sanctionedSerialNos = new Set(processedSanctions.map((s: any) => s.serialNo))
        processedLoi = allLoiRequest.filter((item: LoiMrRecord) => !sanctionedSerialNos.has(item.serialNo))
        setPendingItems(processedLoi)
      } catch (e) {
        console.error("Error parsing LOI history")
      }
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sanctionHistory", JSON.stringify(historyItems))
    }
  }, [historyItems, isLoaded])

  const handleActionClick = (item: LoiMrRecord) => {
    setSelectedItem(item)
    setFormData({
      sanctionLoad: "",
      sanctionDate: "",
      sanctionFile: null,
      remarks: "",
    })
    setIsDialogOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, sanctionFile: e.target.files[0].name })
    }
  }

  const handleSubmit = () => {
    if (!selectedItem) return

    const newSanction: SanctionRecord = {
      ...selectedItem,
      ...formData,
      sanctionedAt: new Date().toISOString(),
    }

    setPendingItems((prev) => prev.filter((i) => i.serialNo !== selectedItem.serialNo))
    setHistoryItems((prev) => [newSanction, ...prev])

    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-full mx-auto">

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending for Sanction</TabsTrigger>
          <TabsTrigger value="history">Sanctioned History</TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent value="pending" className="mt-6">
          <Card className="border border-orange-100 shadow-lg bg-white">

            <CardContent className="pt-6">
              {pendingItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No pending records found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <TableRow className="border-b border-blue-200">
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Action</TableHead>
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
                      {pendingItems.map((item) => (
                        <TableRow key={item.serialNo}>
                          <TableCell>
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1"
                              onClick={() => handleActionClick(item)}
                            >
                              <FileCheck className="h-4 w-4" />
                              Sanction
                            </Button>
                          </TableCell>
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
                          <TableCell className="whitespace-nowrap">{item.installer}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.otherRemark || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.loiFileName ? (
                              <span className="text-blue-600 underline text-xs cursor-pointer">{item.loiFileName}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.mrNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.mrDate}</TableCell>
                          <TableCell className="whitespace-nowrap">₹{item.amount}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.paidBy}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.beneficiaryShare || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="mt-6">
          <Card className="border border-green-100 shadow-lg bg-white">

            <CardContent className="pt-6">
              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No sanctioned records yet.</div>
              ) : (
                <div className="overflow-x-auto">
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
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Sanction No</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Sanction Date</TableHead>
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
                          <TableCell className="whitespace-nowrap">{item.installer}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.otherRemark || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.loiFileName ? (
                              <span className="text-blue-600 underline text-xs cursor-pointer">{item.loiFileName}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.mrNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.mrDate}</TableCell>
                          <TableCell className="whitespace-nowrap">₹{item.amount}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.paidBy}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.beneficiaryShare || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap bg-orange-50/50">
                            {item.sanctionNo ? (
                              <span className="text-orange-600 underline text-xs cursor-pointer">{item.sanctionNo}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap bg-orange-50/50 text-orange-700">{item.sanctionDate}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className="bg-green-100 text-green-800">Sanctioned</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SANCTION DIALOG WITH PREFILLED INFO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Sanction Order</DialogTitle>
            <DialogDescription>
              Enter sanction details for the selected beneficiary
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 py-4">

              {/* PREFILLED BENEFICIARY DETAILS CARD */}
              <Card className="border-2 border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-orange-900">Beneficiary Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-600">Serial No:</span>
                      <p className="font-medium">{selectedItem.serialNo}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Reg ID:</span>
                      <p className="font-medium">{selectedItem.regId}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Beneficiary Name:</span>
                      <p className="font-medium">{selectedItem.beneficiaryName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Father's Name:</span>
                      <p className="font-medium">{selectedItem.fatherName}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Village:</span>
                      <p className="font-medium">{selectedItem.village}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Block:</span>
                      <p className="font-medium">{selectedItem.block}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">District:</span>
                      <p className="font-medium">{selectedItem.district}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Pump Type:</span>
                      <p className="font-medium text-orange-700">{selectedItem.pumpType}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Company:</span>
                      <p className="font-medium text-orange-700">{selectedItem.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SANCTION INPUT FORM */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sanction Date</Label>
                  <Input
                    type="date"
                    value={formData.sanctionDate}
                    onChange={(e) => setFormData({ ...formData, sanctionDate: e.target.value })}
                    className="border-gray-200 focus:border-orange-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sanction No</Label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="sanction-file"
                    />
                    <span
                      onClick={() => document.getElementById("sanction-file")?.click()}
                      className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
                    >
                      {formData.sanctionNo ? "Change Sanction Document" : "Upload Sanction Document"}
                    </span>
                    {formData.sanctionNo && (
                      <span className="text-sm font-medium text-gray-700 ml-2">
                        - {formData.sanctionNo}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                >
                  Approve & Sanction
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}