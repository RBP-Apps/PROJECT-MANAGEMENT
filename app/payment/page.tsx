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
          <TabsTrigger value="pending">Pending Payment</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
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
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Sanction No</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Sanction Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">FD Material Ageing</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">FD Material Receiving Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">FD Challan Link</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Foundation Status</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Foundation Completion Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">FD Photo OK Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Installation Material Ageing</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Installation Material Receiving Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Installation Challan Link</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Installation Status</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Installation Completion Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Ins Photo OK Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Make</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Serial No.1</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Serial No.2</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Serial No.3</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Serial No.4</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Serial No.5</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Serial No.6</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Serial No.7</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Serial No.8</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Module Serial No.9</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Controller Make</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Controller No</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">RMS No (RID NO)</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Pump Make</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Pump Serial No</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Motor Serial No</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Structure Make</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Photo Print</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Policy No</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Policy Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Insurance Company</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Insurance Form</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC Certificate No</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC Completion Status</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC Document</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC at DO</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">DO JCC Receiving</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">DO Ageing</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC at RO</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">RO Ageing</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC at ZO</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">ZO Ageing</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">JCC at HO</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">HO Ageing</TableHead>
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
                          <TableCell className="whitespace-nowrap">
                            {item.sanctionNo ? (
                              <span className="text-orange-600 underline text-xs cursor-pointer">{item.sanctionNo}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.sanctionDate}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.fdMaterialAgeing}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.fdMaterialReceivingDate}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.challanLink ? (
                              <span className="text-green-600 underline text-xs cursor-pointer">{item.challanLink}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.foundationStatus}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.foundationCompletionDate}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.fdPhotoOkDate}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.installationMaterialAgeing}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.installationMaterialReceivingDate}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.installationChallanLink ? (
                              <span className="text-blue-600 underline text-xs cursor-pointer">{item.installationChallanLink}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.installationStatus}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.installationCompletionDate}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.insPhotoOkDate}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleMake}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleSerialNo1}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleSerialNo2}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleSerialNo3}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleSerialNo4}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleSerialNo5}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleSerialNo6}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleSerialNo7}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleSerialNo8}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.moduleSerialNo9}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.controllerMake}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.controllerNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.rmsNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.pumpMake}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.pumpSerialNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.motorSerialNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.structureMake}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.photoPrint}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.policyNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.policyDate}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.insuranceCompany}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.insuranceForm ? (
                              <span className="text-emerald-600 underline text-xs cursor-pointer">{item.insuranceForm}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.jccCertificateNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.jccDate}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.jccCompletionStatus}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.jccDocument ? (
                              <span className="text-amber-600 underline text-xs cursor-pointer">{item.jccDocument}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.jccAtDo}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.doJccReceivingFile ? (
                              <span className="text-rose-600 underline text-xs cursor-pointer">{item.doJccReceivingFile}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-rose-700">{item.doAgeing}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.jccAtRo}</TableCell>
                          <TableCell className="whitespace-nowrap text-rose-700">{item.roAgeing}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.jccAtZo}</TableCell>
                          <TableCell className="whitespace-nowrap text-rose-700">{item.zoAgeing}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.jccAtHo}</TableCell>
                          <TableCell className="whitespace-nowrap text-rose-700">{item.hoAgeing}</TableCell>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <TableRow className="border-b border-blue-200">
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Serial No</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Reg ID</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Beneficiary Name</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">District</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Payment Date</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Amount</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">GST</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">TDS</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">SD</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Balance</TableHead>
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyItems.map((item) => (
                        <TableRow key={item.serialNo}>
                          <TableCell className="font-medium whitespace-nowrap">{item.serialNo}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.regId}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.beneficiaryName}</TableCell>
                          <TableCell className="whitespace-nowrap">{item.district}</TableCell>
                          <TableCell className="whitespace-nowrap bg-emerald-50/50">{item.paymentDate}</TableCell>
                          <TableCell className="whitespace-nowrap bg-emerald-50/50">₹{item.paymentAmount}</TableCell>
                          <TableCell className="whitespace-nowrap bg-emerald-50/50">₹{item.gst}</TableCell>
                          <TableCell className="whitespace-nowrap bg-emerald-50/50">₹{item.tds}</TableCell>
                          <TableCell className="whitespace-nowrap bg-emerald-50/50">₹{item.sd}</TableCell>
                          <TableCell className="whitespace-nowrap bg-emerald-50/50 text-emerald-700 font-medium">₹{item.balance}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>
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

      {/* PAYMENT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="font-semibold text-gray-600">Serial No:</span> <p>{selectedItem.serialNo}</p></div>
                    <div><span className="font-semibold text-gray-600">Name:</span> <p>{selectedItem.beneficiaryName}</p></div>
                    <div><span className="font-semibold text-gray-600">District:</span> <p>{selectedItem.district}</p></div>
                    <div><span className="font-semibold text-gray-600">Pump Type:</span> <p>{selectedItem.pumpType}</p></div>
                    <div><span className="font-semibold text-gray-600">Company:</span> <p>{selectedItem.company}</p></div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
