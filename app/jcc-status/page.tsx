"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

// Types from previous stages
interface JccCompletionRecord {
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
  jccCertificateNo: string
  jccDate: string
  jccCompletionStatus: string
  jccDocument: string | null
}

interface JccStatusRecord extends JccCompletionRecord {
  jccAtDo: string
  doJccReceivingFile: string | null
  doAgeing: string
  jccAtRo: string
  roAgeing: string
  jccAtZo: string
  zoAgeing: string
  jccAtHo: string
  hoAgeing: string
  jccStatusProcessedAt: string
}

export default function JccStatusPage() {
  const [pendingItems, setPendingItems] = useState<JccCompletionRecord[]>([])
  const [historyItems, setHistoryItems] = useState<JccStatusRecord[]>([])
  const [selectedItem, setSelectedItem] = useState<JccCompletionRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [formData, setFormData] = useState({
    jccAtDo: "",
    doJccReceivingFile: null as string | null,
    doAgeing: "",
    jccAtRo: "",
    roAgeing: "",
    jccAtZo: "",
    zoAgeing: "",
    jccAtHo: "",
    hoAgeing: "",
  })

  useEffect(() => {
    const jccCompletionHistory = localStorage.getItem("jccCompletionHistory")
    const jccStatusHistory = localStorage.getItem("jccStatusHistory")

    let processedJccCompletion: JccCompletionRecord[] = []
    let processedJccStatus: JccStatusRecord[] = []

    if (jccStatusHistory) {
      try {
        processedJccStatus = JSON.parse(jccStatusHistory)
        setHistoryItems(processedJccStatus)
      } catch (e) {
        console.error("Error parsing JCC status history")
      }
    }

    if (jccCompletionHistory) {
      try {
        const allJccCompletion = JSON.parse(jccCompletionHistory)
        const jccStatusSerialNos = new Set(processedJccStatus.map((jcc: any) => jcc.serialNo))
        processedJccCompletion = allJccCompletion.filter((item: JccCompletionRecord) => !jccStatusSerialNos.has(item.serialNo))
        setPendingItems(processedJccCompletion)
      } catch (e) {
        console.error("Error parsing JCC completion history")
      }
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("jccStatusHistory", JSON.stringify(historyItems))
    }
  }, [historyItems, isLoaded])

  const handleActionClick = (item: JccCompletionRecord) => {
    setSelectedItem(item)
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
    })
    setIsDialogOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, doJccReceivingFile: e.target.files[0].name })
    }
  }

  const handleSubmit = () => {
    if (!selectedItem) return

    const newJccStatus: JccStatusRecord = {
      ...selectedItem,
      ...formData,
      jccStatusProcessedAt: new Date().toISOString(),
    }

    setPendingItems((prev) => prev.filter((i) => i.serialNo !== selectedItem.serialNo))
    setHistoryItems((prev) => [newJccStatus, ...prev])

    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-full mx-auto">


      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="history"> History</TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent value="pending" className="mt-6">
          <Card className="border border-rose-100 shadow-lg bg-white">
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
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Company</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC Certificate No</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC Date</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingItems.map((item) => (
                          <TableRow key={item.serialNo}>
                            <TableCell>
                              <Button
                                size="sm"
                                className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1"
                                onClick={() => handleActionClick(item)}
                              >
                                <FileCheck className="h-4 w-4" />
                                Status
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium whitespace-nowrap">{item.serialNo}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.beneficiaryName}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.village}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.block}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.district}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.company}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.jccCertificateNo}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.jccDate}</TableCell>
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
                      <Card key={item.serialNo} className="border border-rose-200 shadow-sm">
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
                              <p className="text-rose-700 font-medium">{item.pumpType}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Company:</span>
                              <p className="text-rose-700 font-medium">{item.company}</p>
                            </div>
                          </div>

                          {/* JCC Specific Information */}
                          <div className="border-t border-rose-200 pt-3 mt-3">
                            <h4 className="font-medium text-rose-800 mb-2">JCC Information</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">JCC Certificate No:</span>
                                <p className="text-rose-700 font-medium">{item.jccCertificateNo}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC Date:</span>
                                <p className="text-rose-700">{item.jccDate}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC Status:</span>
                                <p className="text-rose-700">{item.jccCompletionStatus}</p>
                              </div>
                              {item.jccDocument && (
                                <div>
                                  <span className="font-medium text-gray-600">JCC Document:</span>
                                  <p className="text-rose-600 underline text-sm cursor-pointer">{item.jccDocument}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="border-t pt-3 mt-3">
                            <Button
                              className="w-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2"
                              onClick={() => handleActionClick(item)}
                            >
                              <FileCheck className="h-4 w-4" />
                              Update JCC Status
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
          <Card className="border border-pink-100 shadow-lg bg-white">
            <CardContent className="pt-6">
              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No JCC status records yet.</div>
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
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC Certificate No</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC at DO</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC at HO</TableHead>
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
                            <TableCell className="whitespace-nowrap">{item.jccCertificateNo}</TableCell>
                            <TableCell className="whitespace-nowrap bg-rose-50/50">{item.jccAtDo}</TableCell>
                            <TableCell className="whitespace-nowrap bg-rose-50/50">{item.jccAtHo}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge className="bg-rose-100 text-rose-800">Completed</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {historyItems.map((item) => (
                      <Card key={item.serialNo} className="border border-rose-200 shadow-sm bg-rose-50/20">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{item.beneficiaryName}</h3>
                              <p className="text-sm text-gray-600">Serial: {item.serialNo}</p>
                            </div>
                            <Badge className="bg-rose-100 text-rose-800">Completed</Badge>
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
                              <p className="text-rose-700 font-medium">{item.company}</p>
                            </div>
                          </div>

                          {/* JCC Status Information */}
                          <div className="border-t border-rose-200 pt-3 mt-3">
                            <h4 className="font-medium text-rose-800 mb-2">JCC Status Details</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">JCC Certificate No:</span>
                                <p className="text-rose-700 font-medium">{item.jccCertificateNo}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC Date:</span>
                                <p className="text-rose-700">{item.jccDate}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC at DO:</span>
                                <p className="text-rose-700">{item.jccAtDo}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">DO Ageing:</span>
                                <p className="text-rose-700 font-medium">{item.doAgeing}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC at RO:</span>
                                <p className="text-rose-700">{item.jccAtRo}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">RO Ageing:</span>
                                <p className="text-rose-700 font-medium">{item.roAgeing}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC at ZO:</span>
                                <p className="text-rose-700">{item.jccAtZo}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">ZO Ageing:</span>
                                <p className="text-rose-700 font-medium">{item.zoAgeing}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">JCC at HO:</span>
                                <p className="text-rose-700">{item.jccAtHo}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">HO Ageing:</span>
                                <p className="text-rose-700 font-medium">{item.hoAgeing}</p>
                              </div>
                            </div>
                            {item.doJccReceivingFile && (
                              <div className="mt-2">
                                <span className="font-medium text-gray-600">DO JCC File:</span>
                                <p className="text-rose-600 underline text-sm cursor-pointer">{item.doJccReceivingFile}</p>
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

      {/* JCC STATUS DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Enter JCC Status Information</DialogTitle>
            <DialogDescription>
              Enter JCC status details for the selected beneficiary
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 py-4">
              {/* PREFILLED BENEFICIARY DETAILS CARD */}
              <Card className="border-2 border-rose-200 bg-rose-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-rose-900">Beneficiary Details</CardTitle>
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
                      <p className="font-medium text-rose-700">{selectedItem.pumpType}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Company:</span>
                      <p className="font-medium text-rose-700">{selectedItem.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* JCC STATUS INPUT FORM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>JCC at DO (Date)</Label>
                  <Input
                    type="date"
                    value={formData.jccAtDo}
                    onChange={(e) => setFormData({ ...formData, jccAtDo: e.target.value })}
                    className="border-gray-200 focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>DO JCC Receiving (File)</Label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="do-jcc-receiving-file"
                    />
                    <span
                      onClick={() => document.getElementById("do-jcc-receiving-file")?.click()}
                      className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
                    >
                      {formData.doJccReceivingFile ? "Change File" : "Upload File"}
                    </span>
                    {formData.doJccReceivingFile && (
                      <span className="text-sm font-medium text-gray-700 ml-2">
                        - {formData.doJccReceivingFile}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>DO Ageing</Label>
                  <Input
                    value={formData.doAgeing}
                    onChange={(e) => setFormData({ ...formData, doAgeing: e.target.value })}
                    placeholder="Enter DO Ageing"
                    className="border-gray-200 focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>JCC at RO (Date)</Label>
                  <Input
                    type="date"
                    value={formData.jccAtRo}
                    onChange={(e) => setFormData({ ...formData, jccAtRo: e.target.value })}
                    className="border-gray-200 focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>RO Ageing</Label>
                  <Input
                    value={formData.roAgeing}
                    onChange={(e) => setFormData({ ...formData, roAgeing: e.target.value })}
                    placeholder="Enter RO Ageing"
                    className="border-gray-200 focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>JCC at ZO (Date)</Label>
                  <Input
                    type="date"
                    value={formData.jccAtZo}
                    onChange={(e) => setFormData({ ...formData, jccAtZo: e.target.value })}
                    className="border-gray-200 focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ZO Ageing</Label>
                  <Input
                    value={formData.zoAgeing}
                    onChange={(e) => setFormData({ ...formData, zoAgeing: e.target.value })}
                    placeholder="Enter ZO Ageing"
                    className="border-gray-200 focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>JCC at HO (Date)</Label>
                  <Input
                    type="date"
                    value={formData.jccAtHo}
                    onChange={(e) => setFormData({ ...formData, jccAtHo: e.target.value })}
                    className="border-gray-200 focus:border-rose-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>HO Ageing</Label>
                  <Input
                    value={formData.hoAgeing}
                    onChange={(e) => setFormData({ ...formData, hoAgeing: e.target.value })}
                    placeholder="Enter HO Ageing"
                    className="border-gray-200 focus:border-rose-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white"
                >
                  Submit JCC Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
