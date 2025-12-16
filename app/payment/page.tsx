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
import { CreditCard } from "lucide-react"

// Types matching previous stages
interface JccStatusRecord {
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

interface PaymentRecord extends JccStatusRecord {
  paymentDate: string
  paymentAmount: string
  gst: string
  tds: string
  sd: string
  balance: string
  paymentProcessedAt: string
}

export default function PaymentPage() {
  const [pendingItems, setPendingItems] = useState<JccStatusRecord[]>([])
  const [historyItems, setHistoryItems] = useState<PaymentRecord[]>([])
  const [selectedItem, setSelectedItem] = useState<JccStatusRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [formData, setFormData] = useState({
    paymentDate: "",
    paymentAmount: "",
    gst: "",
    tds: "",
    sd: "",
    balance: "",
  })

  useEffect(() => {
    const jccStatusHistory = localStorage.getItem("jccStatusHistory")
    const paymentHistory = localStorage.getItem("paymentHistory")

    let processedJccStatus: JccStatusRecord[] = []
    let processedPayment: PaymentRecord[] = []

    if (paymentHistory) {
      try {
        processedPayment = JSON.parse(paymentHistory)
        setHistoryItems(processedPayment)
      } catch (e) {
        console.error("Error parsing payment history")
      }
    }

    if (jccStatusHistory) {
      try {
        const allJccStatus = JSON.parse(jccStatusHistory)
        const paymentSerialNos = new Set(processedPayment.map((p: any) => p.serialNo))
        processedJccStatus = allJccStatus.filter((item: JccStatusRecord) => !paymentSerialNos.has(item.serialNo))
        setPendingItems(processedJccStatus)
      } catch (e) {
        console.error("Error parsing JCC Status history")
      }
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("paymentHistory", JSON.stringify(historyItems))
    }
  }, [historyItems, isLoaded])

  const handleActionClick = (item: JccStatusRecord) => {
    setSelectedItem(item)
    setFormData({
      paymentDate: "",
      paymentAmount: "",
      gst: "",
      tds: "",
      sd: "",
      balance: "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!selectedItem) return

    const newPayment: PaymentRecord = {
      ...selectedItem,
      ...formData,
      paymentProcessedAt: new Date().toISOString(),
    }

    setPendingItems((prev) => prev.filter((i) => i.serialNo !== selectedItem.serialNo))
    setHistoryItems((prev) => [newPayment, ...prev])

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
          <Card className="border border-emerald-100 shadow-lg bg-white">
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
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">District</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Company</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Amount</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC at HO</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
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
                                <CreditCard className="h-4 w-4" />
                                Pay
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium whitespace-nowrap">{item.serialNo}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.beneficiaryName}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.village}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.district}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.company}</TableCell>
                            <TableCell className="whitespace-nowrap">₹{item.amount}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.jccAtHo}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pending
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile vCard View */}
                  <div className="lg:hidden space-y-4">
                    {pendingItems.map((item) => (
                      <div key={item.serialNo} className="bg-white border border-emerald-200 rounded-lg shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 border-b border-emerald-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg text-emerald-900">{item.beneficiaryName}</h3>
                              <p className="text-sm text-emerald-700">ID: {item.serialNo}</p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              Pending Payment
                            </Badge>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Father's Name</span>
                              <p className="font-medium text-gray-900">{item.fatherName}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Reg ID</span>
                              <p className="font-medium text-gray-900">{item.regId}</p>
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Address</span>
                          <p className="font-medium text-gray-900 mt-1">
                            {item.village}, {item.block}, {item.district}
                          </p>
                        </div>

                        {/* Project Details */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Company</span>
                              <p className="font-semibold text-emerald-700">{item.company}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Pump Type</span>
                              <p className="font-medium text-gray-900">{item.pumpType}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Category</span>
                              <p className="font-medium text-gray-900">{item.category}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Installer</span>
                              <p className="font-medium text-gray-900">{item.installer}</p>
                            </div>
                          </div>
                        </div>

                        {/* Financial Info */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50/30">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Amount</span>
                              <p className="font-bold text-xl text-emerald-700">₹{item.amount}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Paid By</span>
                              <p className="font-medium text-gray-900">{item.paidBy}</p>
                            </div>
                          </div>
                        </div>

                        {/* JCC Status */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <span className="text-gray-500 text-xs uppercase tracking-wide">JCC Progress</span>
                          <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                            <div>
                              <span className="text-gray-600">Certificate No:</span>
                              <p className="font-medium text-emerald-700">{item.jccCertificateNo}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">JCC Date:</span>
                              <p className="font-medium text-gray-900">{item.jccDate}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">At HO:</span>
                              <p className="font-medium text-emerald-700">{item.jccAtHo}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">HO Ageing:</span>
                              <p className="font-medium text-gray-900">{item.hoAgeing}</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="px-4 py-3">
                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 py-3"
                            onClick={() => handleActionClick(item)}
                          >
                            <CreditCard className="h-5 w-5" />
                            Process Payment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="mt-6">
          <Card className="border border-emerald-100 shadow-lg bg-white">
            <CardContent className="pt-6">
              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No payment records yet.</div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                        <TableRow className="border-b border-blue-200">
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Serial No</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">District</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Payment Date</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Amount</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">GST</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">TDS</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Balance</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyItems.map((item) => (
                          <TableRow key={item.serialNo}>
                            <TableCell className="font-medium whitespace-nowrap">{item.serialNo}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.beneficiaryName}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.district}</TableCell>
                            <TableCell className="whitespace-nowrap bg-emerald-50/50">{item.paymentDate}</TableCell>
                            <TableCell className="whitespace-nowrap bg-emerald-50/50">₹{item.paymentAmount}</TableCell>
                            <TableCell className="whitespace-nowrap bg-emerald-50/50">₹{item.gst}</TableCell>
                            <TableCell className="whitespace-nowrap bg-emerald-50/50">₹{item.tds}</TableCell>
                            <TableCell className="whitespace-nowrap bg-emerald-50/50 text-emerald-700 font-medium">₹{item.balance}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile vCard View */}
                  <div className="lg:hidden space-y-4">
                    {historyItems.map((item) => (
                      <div key={item.serialNo} className="bg-white border border-emerald-200 rounded-lg shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-100 to-green-100 px-4 py-3 border-b border-emerald-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg text-emerald-900">{item.beneficiaryName}</h3>
                              <p className="text-sm text-emerald-700">ID: {item.serialNo}</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800">
                              Paid
                            </Badge>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Father's Name</span>
                              <p className="font-medium text-gray-900">{item.fatherName}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Reg ID</span>
                              <p className="font-medium text-gray-900">{item.regId}</p>
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Address</span>
                          <p className="font-medium text-gray-900 mt-1">
                            {item.village}, {item.block}, {item.district}
                          </p>
                        </div>

                        {/* Payment Details */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50/50">
                          <span className="text-emerald-700 text-sm font-semibold uppercase tracking-wide">Payment Details</span>
                          <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                            <div>
                              <span className="text-gray-600">Payment Date:</span>
                              <p className="font-semibold text-emerald-700">{item.paymentDate}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Amount:</span>
                              <p className="font-bold text-xl text-emerald-700">₹{item.paymentAmount}</p>
                            </div>
                          </div>
                        </div>

                        {/* Tax Breakdown */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <span className="text-gray-500 text-xs uppercase tracking-wide">Tax Breakdown</span>
                          <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                            <div>
                              <span className="text-gray-600">GST:</span>
                              <p className="font-medium text-gray-900">₹{item.gst}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">TDS:</span>
                              <p className="font-medium text-gray-900">₹{item.tds}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">SD:</span>
                              <p className="font-medium text-gray-900">₹{item.sd}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Balance:</span>
                              <p className="font-bold text-lg text-emerald-700">₹{item.balance}</p>
                            </div>
                          </div>
                        </div>

                        {/* Company Info */}
                        <div className="px-4 py-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Company</span>
                              <p className="font-semibold text-emerald-700">{item.company}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 text-xs uppercase tracking-wide">Pump Type</span>
                              <p className="font-medium text-gray-900">{item.pumpType}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PAYMENT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Enter payment details for the beneficiary
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 py-4">
              <Card className="border-2 border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-emerald-900">Beneficiary Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div><span className="font-semibold text-gray-600">Serial No:</span> <p>{selectedItem.serialNo}</p></div>
                    <div><span className="font-semibold text-gray-600">Name:</span> <p>{selectedItem.beneficiaryName}</p></div>
                    <div><span className="font-semibold text-gray-600">District:</span> <p>{selectedItem.district}</p></div>
                    <div><span className="font-semibold text-gray-600">Pump Type:</span> <p>{selectedItem.pumpType}</p></div>
                    <div><span className="font-semibold text-gray-600">Company:</span> <p>{selectedItem.company}</p></div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input type="date" value={formData.paymentDate} onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" value={formData.paymentAmount} onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })} placeholder="Enter Amount" />
                </div>
                <div className="space-y-2">
                  <Label>GST</Label>
                  <Input type="number" value={formData.gst} onChange={(e) => setFormData({ ...formData, gst: e.target.value })} placeholder="Enter GST" />
                </div>
                <div className="space-y-2">
                  <Label>TDS</Label>
                  <Input type="number" value={formData.tds} onChange={(e) => setFormData({ ...formData, tds: e.target.value })} placeholder="Enter TDS" />
                </div>
                <div className="space-y-2">
                  <Label>SD</Label>
                  <Input type="number" value={formData.sd} onChange={(e) => setFormData({ ...formData, sd: e.target.value })} placeholder="Enter SD" />
                </div>
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input type="number" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} placeholder="Enter Balance" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">Submit Payment</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
