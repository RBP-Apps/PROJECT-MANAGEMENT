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
} from "@/components/ui/dialog"
import { CheckCircle2 } from "lucide-react"

// Types from previous stages
interface InsuranceRecord {
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
  sanctionNo: string | null
  sanctionDate: string
  fdMaterialAgeing: string
  fdMaterialReceivingDate: string
  challanLink: string | null
  foundationStatus: string
  foundationCompletionDate: string
  fdPhotoOkDate: string
  installationMaterialAgeing: string
  installationMaterialReceivingDate: string
  installationChallanLink: string | null
  installationStatus: string
  installationCompletionDate: string
  insPhotoOkDate: string
  moduleMake: string
  moduleSerialNo1: string
  moduleSerialNo2: string
  moduleSerialNo3: string
  moduleSerialNo4: string
  moduleSerialNo5: string
  moduleSerialNo6: string
  moduleSerialNo7: string
  moduleSerialNo8: string
  moduleSerialNo9: string
  controllerMake: string
  controllerNo: string
  rmsNo: string
  pumpMake: string
  pumpSerialNo: string
  motorSerialNo: string
  structureMake: string
  photoPrint: string
  policyNo: string
  policyDate: string
  insuranceCompany: string
  insuranceForm: string | null
}

interface JccCompletionRecord extends InsuranceRecord {
  jccReceivingDate: string
  jccAgeing: string
  jccCopy: string | null
  invoiceDate: string
  invoiceNo: string
  jccCompletionDate: string
  jccAgeingRbp: string
  jccProcessedAt: string
}

export default function JccCompletionPage() {
  const [pendingItems, setPendingItems] = useState<InsuranceRecord[]>([])
  const [historyItems, setHistoryItems] = useState<JccCompletionRecord[]>([])
  const [selectedItem, setSelectedItem] = useState<InsuranceRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [formData, setFormData] = useState({
    jccReceivingDate: "",
    jccAgeing: "",
    jccCopy: null as string | null,
    invoiceDate: "",
    invoiceNo: "",
    jccCompletionDate: "",
    jccAgeingRbp: "",
  })

  useEffect(() => {
    const insuranceHistory = localStorage.getItem("insuranceHistory")
    const jccHistory = localStorage.getItem("jccCompletionHistory")

    let processedInsurance: InsuranceRecord[] = []
    let processedJcc: JccCompletionRecord[] = []

    if (jccHistory) {
      try {
        processedJcc = JSON.parse(jccHistory)
        setHistoryItems(processedJcc)
      } catch (e) {
        console.error("Error parsing JCC completion history")
      }
    }

    if (insuranceHistory) {
      try {
        const allInsurance = JSON.parse(insuranceHistory)
        const jccSerialNos = new Set(processedJcc.map((jcc: any) => jcc.serialNo))
        processedInsurance = allInsurance.filter((item: InsuranceRecord) => !jccSerialNos.has(item.serialNo))
        setPendingItems(processedInsurance)
      } catch (e) {
        console.error("Error parsing insurance history")
      }
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("jccCompletionHistory", JSON.stringify(historyItems))
    }
  }, [historyItems, isLoaded])

  // Calculate JCC Ageing when dates change
  useEffect(() => {
    if (formData.jccCompletionDate && formData.jccReceivingDate) {
      const completionDate = new Date(formData.jccCompletionDate)
      const receivingDate = new Date(formData.jccReceivingDate)
      const diffTime = Math.abs(completionDate.getTime() - receivingDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setFormData(prev => ({ ...prev, jccAgeing: `${diffDays} days` }))
    }
  }, [formData.jccCompletionDate, formData.jccReceivingDate])

  const handleActionClick = (item: InsuranceRecord) => {
    setSelectedItem(item)
    setFormData({
      jccReceivingDate: "",
      jccAgeing: "",
      jccCopy: null,
      invoiceDate: "",
      invoiceNo: "",
      jccCompletionDate: "",
      jccAgeingRbp: "",
    })
    setIsDialogOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, jccCopy: e.target.files[0].name })
    }
  }

  const handleSubmit = () => {
    if (!selectedItem) return

    const newJcc: JccCompletionRecord = {
      ...selectedItem,
      ...formData,
      jccProcessedAt: new Date().toISOString(),
    }

    setPendingItems((prev) => prev.filter((i) => i.serialNo !== selectedItem.serialNo))
    setHistoryItems((prev) => [newJcc, ...prev])

    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-full mx-auto">


      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent value="pending" className="mt-6">
          <Card className="border border-amber-100 shadow-lg bg-white">
            <CardContent className="pt-6">
              {pendingItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No pending records found.
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                        <TableRow className="border-b border-blue-200">
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Action</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Serial No</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Village</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Block</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">District</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Pump Type</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Company</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Amount</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingItems.map((item) => (
                          <TableRow key={item.serialNo}>
                            <TableCell>
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1"
                                onClick={() => handleActionClick(item)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                JCC
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium whitespace-nowrap">{item.serialNo}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.beneficiaryName}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.village}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.block}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.district}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.pumpType}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.company}</TableCell>
                            <TableCell className="whitespace-nowrap">₹{item.amount}</TableCell>
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

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {pendingItems.map((item) => (
                      <Card key={item.serialNo} className="border border-amber-200 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{item.beneficiaryName}</h3>
                              <p className="text-sm text-gray-600">Serial: {item.serialNo}</p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Pending
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div>
                              <span className="font-medium text-gray-600">Father's Name:</span>
                              <p className="text-gray-900">{item.fatherName}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Reg ID:</span>
                              <p className="text-gray-900">{item.regId}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Village:</span>
                              <p className="text-gray-900">{item.village}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Block:</span>
                              <p className="text-gray-900">{item.block}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">District:</span>
                              <p className="text-gray-900">{item.district}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Category:</span>
                              <p className="text-gray-900">{item.category}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Pump Type:</span>
                              <p className="text-amber-700 font-medium">{item.pumpType}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Company:</span>
                              <p className="text-amber-700 font-medium">{item.company}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Amount:</span>
                              <p className="text-green-700 font-semibold">₹{item.amount}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Installer:</span>
                              <p className="text-gray-900">{item.installer}</p>
                            </div>
                          </div>

                          <div className="border-t pt-3">
                            <Button
                              className="w-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2"
                              onClick={() => handleActionClick(item)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Complete JCC
                            </Button>
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

        {/* HISTORY TAB */}
        <TabsContent value="history" className="mt-6">
          <Card className="border border-orange-100 shadow-lg bg-white">
            <CardContent className="pt-6">
              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No JCC records yet.</div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                        <TableRow className="border-b border-blue-200">
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Serial No</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Village</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">District</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Company</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Amount</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC Completion Date</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Invoice No</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyItems.map((item) => (
                          <TableRow key={item.serialNo}>
                            <TableCell className="font-medium whitespace-nowrap">{item.serialNo}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.beneficiaryName}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.village}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.district}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.company}</TableCell>
                            <TableCell className="whitespace-nowrap">₹{item.amount}</TableCell>
                            <TableCell className="whitespace-nowrap bg-amber-50/50">{item.jccCompletionDate}</TableCell>
                            <TableCell className="whitespace-nowrap bg-amber-50/50 font-medium text-amber-700">{item.invoiceNo}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge className="bg-amber-100 text-amber-800">Completed</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {historyItems.map((item) => (
                      <Card key={item.serialNo} className="border border-amber-200 shadow-sm bg-amber-50/20">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{item.beneficiaryName}</h3>
                              <p className="text-sm text-gray-600">Serial: {item.serialNo}</p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800">Completed</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div>
                              <span className="font-medium text-gray-600">Father's Name:</span>
                              <p className="text-gray-900">{item.fatherName}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Reg ID:</span>
                              <p className="text-gray-900">{item.regId}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Village:</span>
                              <p className="text-gray-900">{item.village}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Block:</span>
                              <p className="text-gray-900">{item.block}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">District:</span>
                              <p className="text-gray-900">{item.district}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Company:</span>
                              <p className="text-amber-700 font-medium">{item.company}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Amount:</span>
                              <p className="text-green-700 font-semibold">₹{item.amount}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Pump Type:</span>
                              <p className="text-amber-700 font-medium">{item.pumpType}</p>
                            </div>
                          </div>

                          {/* JCC Specific Information */}
                          <div className="border-t border-amber-200 pt-3 mt-3">
                            <h4 className="font-medium text-amber-800 mb-2">JCC Details</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">JCC Receiving Date:</span>
                                <p className="text-amber-700">{item.jccReceivingDate}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC Completion Date:</span>
                                <p className="text-amber-700">{item.jccCompletionDate}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC Ageing:</span>
                                <p className="text-amber-700 font-medium">{item.jccAgeing}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Invoice No:</span>
                                <p className="text-amber-700 font-semibold">{item.invoiceNo}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Invoice Date:</span>
                                <p className="text-amber-700">{item.invoiceDate}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC Ageing (RBP):</span>
                                <p className="text-amber-700">{item.jccAgeingRbp}</p>
                              </div>
                            </div>
                            {item.jccCopy && (
                              <div className="mt-2">
                                <span className="font-medium text-gray-600">JCC Copy:</span>
                                <p className="text-amber-600 underline text-sm cursor-pointer">{item.jccCopy}</p>
                              </div>
                            )}
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

      {/* JCC COMPLETION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Enter JCC Completion Information</DialogTitle>
            <DialogDescription>
              Enter Job Completion Certificate details for the selected beneficiary
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 py-4">
              {/* PREFILLED BENEFICIARY DETAILS CARD */}
              <Card className="border-2 border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-amber-900">Beneficiary Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
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
                      <p className="font-medium text-amber-700">{selectedItem.pumpType}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Company:</span>
                      <p className="font-medium text-amber-700">{selectedItem.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* JCC INPUT FORM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>JCC Receiving Date</Label>
                  <Input
                    type="date"
                    value={formData.jccReceivingDate}
                    onChange={(e) => setFormData({ ...formData, jccReceivingDate: e.target.value })}
                    className="border-gray-200 focus:border-amber-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>JCC Completion Date</Label>
                  <Input
                    type="date"
                    value={formData.jccCompletionDate}
                    onChange={(e) => setFormData({ ...formData, jccCompletionDate: e.target.value })}
                    className="border-gray-200 focus:border-amber-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>JCC Ageing (Auto-calculated)</Label>
                  <Input
                    value={formData.jccAgeing}
                    readOnly
                    placeholder="Will be calculated automatically"
                    className="border-gray-200 bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="border-gray-200 focus:border-amber-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Invoice No</Label>
                  <Input
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                    placeholder="Enter invoice number"
                    className="border-gray-200 focus:border-amber-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>JCC Ageing (RBP)</Label>
                  <Input
                    value={formData.jccAgeingRbp}
                    onChange={(e) => setFormData({ ...formData, jccAgeingRbp: e.target.value })}
                    placeholder="Enter RBP ageing"
                    className="border-gray-200 focus:border-amber-400"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>JCC Copy</Label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="jcc-copy-file"
                    />
                    <span
                      onClick={() => document.getElementById("jcc-copy-file")?.click()}
                      className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
                    >
                      {formData.jccCopy ? "Change JCC Copy" : "Upload JCC Copy"}
                    </span>
                    {formData.jccCopy && (
                      <span className="text-sm font-medium text-gray-700 ml-2">
                        - {formData.jccCopy}
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
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                >
                  Submit JCC
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
