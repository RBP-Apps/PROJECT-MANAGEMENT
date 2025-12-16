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
import { Shield } from "lucide-react"

interface SystemInfoRecord {
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
}

interface InsuranceRecord extends SystemInfoRecord {
  policyNo: string
  policyDate: string
  insuranceCompany: string
  insuranceForm: string | null
  insuranceProcessedAt: string
}

export default function InsurancePage() {
  const [pendingItems, setPendingItems] = useState<SystemInfoRecord[]>([])
  const [historyItems, setHistoryItems] = useState<InsuranceRecord[]>([])
  const [selectedItem, setSelectedItem] = useState<SystemInfoRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [formData, setFormData] = useState({
    policyNo: "",
    policyDate: "",
    insuranceCompany: "",
    insuranceForm: null as string | null,
  })

  useEffect(() => {
    const systemInfoHistory = localStorage.getItem("systemInfoHistory")
    const insuranceHistory = localStorage.getItem("insuranceHistory")

    let processedSystemInfo: SystemInfoRecord[] = []
    let processedInsurance: InsuranceRecord[] = []

    if (insuranceHistory) {
      try {
        processedInsurance = JSON.parse(insuranceHistory)
        setHistoryItems(processedInsurance)
      } catch (e) {
        console.error("Error parsing insurance history")
      }
    }

    if (systemInfoHistory) {
      try {
        const allSystemInfo = JSON.parse(systemInfoHistory)
        const insuranceSerialNos = new Set(processedInsurance.map((ins: any) => ins.serialNo))
        processedSystemInfo = allSystemInfo.filter((item: SystemInfoRecord) => !insuranceSerialNos.has(item.serialNo))
        setPendingItems(processedSystemInfo)
      } catch (e) {
        console.error("Error parsing system info history")
      }
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("insuranceHistory", JSON.stringify(historyItems))
    }
  }, [historyItems, isLoaded])

  const handleActionClick = (item: SystemInfoRecord) => {
    setSelectedItem(item)
    setFormData({
      policyNo: "",
      policyDate: "",
      insuranceCompany: "",
      insuranceForm: null,
    })
    setIsDialogOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, insuranceForm: e.target.files[0].name })
    }
  }

  const handleSubmit = () => {
    if (!selectedItem) return

    const newInsurance: InsuranceRecord = {
      ...selectedItem,
      ...formData,
      insuranceProcessedAt: new Date().toISOString(),
    }

    setPendingItems((prev) => prev.filter((i) => i.serialNo !== selectedItem.serialNo))
    setHistoryItems((prev) => [newInsurance, ...prev])

    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-full mx-auto">


      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
          <TabsTrigger value="pending">Pending </TabsTrigger>
          <TabsTrigger value="history"> History</TabsTrigger>
        </TabsList>

        {/* ====================== PENDING TAB ====================== */}
        <TabsContent value="pending" className="mt-6">
          <Card className="border border-emerald-100 shadow-lg bg-white">

            <CardContent className="pt-6">

              {/* Desktop Table - Hidden on Mobile */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Serial No</TableHead>
                      <TableHead>Reg ID</TableHead>
                      <TableHead>Beneficiary Name</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Pump Type</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Installer</TableHead>
                      <TableHead>Installation Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingItems.map((item) => (
                      <TableRow key={item.serialNo}>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                            onClick={() => handleActionClick(item)}
                          >
                            <Shield className="h-4 w-4" />
                            Insure
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{item.serialNo}</TableCell>
                        <TableCell>{item.regId}</TableCell>
                        <TableCell>{item.beneficiaryName}</TableCell>
                        <TableCell>{item.district}</TableCell>
                        <TableCell>{item.pumpType}</TableCell>
                        <TableCell>{item.company}</TableCell>
                        <TableCell>{item.installer}</TableCell>
                        <TableCell>{item.installationCompletionDate || "-"}</TableCell>
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

              {/* Mobile Card View - Only on Mobile */}
              <div className="block md:hidden space-y-4">
                {pendingItems.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No pending records found.</p>
                ) : (
                  pendingItems.map((item) => (
                    <Card key={item.serialNo} className="p-4 border-emerald-200">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-emerald-700">{item.serialNo}</p>
                            <p className="text-lg font-medium">{item.beneficiaryName}</p>
                            <p className="text-muted-foreground">
                              {item.fatherName} • {item.village}, {item.district}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleActionClick(item)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Insure
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="font-medium">Reg ID:</span> {item.regId}</div>
                          <div><span className="font-medium">Pump:</span> {item.pumpType}</div>
                          <div><span className="font-medium">Company:</span> {item.company}</div>
                          <div><span className="font-medium">Installer:</span> {item.installer}</div>
                          <div><span className="font-medium">Inst. Date:</span> {item.installationCompletionDate || "-"}</div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              Pending Insurance
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====================== HISTORY TAB ====================== */}
        <TabsContent value="history" className="mt-6">
          <Card className="border border-teal-100 shadow-lg bg-white">

            <CardContent className="pt-6">

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <TableRow>
                      <TableHead>Serial No</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Pump Type</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Policy No</TableHead>
                      <TableHead>Insurance Co.</TableHead>
                      <TableHead>Policy Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyItems.map((item) => (
                      <TableRow key={item.serialNo}>
                        <TableCell className="font-medium">{item.serialNo}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.beneficiaryName}</div>
                            <div className="text-xs text-muted-foreground">{item.village}, {item.block}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.district}</TableCell>
                        <TableCell>{item.pumpType}</TableCell>
                        <TableCell>{item.company}</TableCell>
                        <TableCell className="font-medium text-emerald-700">{item.policyNo}</TableCell>
                        <TableCell>{item.insuranceCompany}</TableCell>
                        <TableCell>{item.policyDate}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-100 text-emerald-800">Insured</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {historyItems.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No insurance records yet.</p>
                ) : (
                  historyItems.map((item) => (
                    <Card key={item.serialNo} className="p-4 border-teal-200">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold text-teal-700">{item.serialNo}</p>
                            <p className="text-lg font-medium">{item.beneficiaryName}</p>
                            <p className="text-muted-foreground">{item.district} • {item.village}</p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-800 self-start">Insured</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="font-medium">Pump:</span> {item.pumpType}</div>
                          <div><span className="font-medium">Company:</span> {item.company}</div>
                          <div><span className="font-medium">Policy No:</span> <span className="text-emerald-700 font-medium">{item.policyNo}</span></div>
                          <div><span className="font-medium">Ins. Co:</span> {item.insuranceCompany}</div>
                          <div><span className="font-medium">Policy Date:</span> {item.policyDate}</div>
                          {item.insuranceForm && (
                            <div><span className="font-medium">Form:</span> <span className="text-blue-600 underline">{item.insuranceForm}</span></div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* INSURANCE DIALOG - Same as before */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Insurance Information</DialogTitle>
            <DialogDescription>
              Enter insurance policy details for the selected beneficiary
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 py-4">
              <Card className="border-2 border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-emerald-900">Beneficiary Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="font-semibold text-gray-600">Serial No:</span> <p className="font-medium">{selectedItem.serialNo}</p></div>
                    <div><span className="font-semibold text-gray-600">Reg ID:</span> <p className="font-medium">{selectedItem.regId}</p></div>
                    <div><span className="font-semibold text-gray-600">Name:</span> <p className="font-medium">{selectedItem.beneficiaryName}</p></div>
                    <div><span className="font-semibold text-gray-600">Father:</span> <p className="font-medium">{selectedItem.fatherName}</p></div>
                    <div><span className="font-semibold text-gray-600">Village:</span> <p className="font-medium">{selectedItem.village}</p></div>
                    <div><span className="font-semibold text-gray-600">Block:</span> <p className="font-medium">{selectedItem.block}</p></div>
                    <div><span className="font-semibold text-gray-600">District:</span> <p className="font-medium">{selectedItem.district}</p></div>
                    <div><span className="font-semibold text-gray-600">Pump Type:</span> <p className="font-medium text-emerald-700">{selectedItem.pumpType}</p></div>
                    <div><span className="font-semibold text-gray-600">Company:</span> <p className="font-medium text-emerald-700">{selectedItem.company}</p></div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Policy No</Label>
                  <Input value={formData.policyNo} onChange={(e) => setFormData({ ...formData, policyNo: e.target.value })} placeholder="Enter policy number" />
                </div>
                <div className="space-y-2">
                  <Label>Policy Date</Label>
                  <Input type="date" value={formData.policyDate} onChange={(e) => setFormData({ ...formData, policyDate: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Insurance Company</Label>
                  <Input value={formData.insuranceCompany} onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })} placeholder="Enter company name" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Insurance Form (PDF/Image)</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" id="insurance-form-file" />
                    <Button variant="outline" onClick={() => document.getElementById("insurance-form-file")?.click()}>
                      {formData.insuranceForm ? "Change File" : "Upload Form"}
                    </Button>
                    {formData.insuranceForm && <span className="text-sm text-emerald-700 font-medium">{formData.insuranceForm}</span>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  Submit Insurance
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}