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

// Types from previous stages
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending for Insurance</TabsTrigger>
          <TabsTrigger value="history">Insurance History</TabsTrigger>
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
                              <Shield className="h-4 w-4" />
                              Insurance
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
          <Card className="border border-teal-100 shadow-lg bg-white">

            <CardContent className="pt-6">
              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No insurance records yet.</div>
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
                          <TableCell className="whitespace-nowrap bg-emerald-50/50 text-emerald-700 font-medium">{item.policyNo}</TableCell>
                          <TableCell className="whitespace-nowrap bg-emerald-50/50">{item.policyDate}</TableCell>
                          <TableCell className="whitespace-nowrap bg-emerald-50/50">{item.insuranceCompany}</TableCell>
                          <TableCell className="whitespace-nowrap bg-emerald-50/50">
                            {item.insuranceForm ? (
                              <span className="text-emerald-600 underline text-xs cursor-pointer">{item.insuranceForm}</span>
                            ) : ("-")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className="bg-emerald-100 text-emerald-800">Insured</Badge>
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

      {/* INSURANCE DIALOG */}
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
              {/* PREFILLED BENEFICIARY DETAILS CARD */}
              <Card className="border-2 border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-emerald-900">Beneficiary Details</CardTitle>
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
                      <p className="font-medium text-emerald-700">{selectedItem.pumpType}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Company:</span>
                      <p className="font-medium text-emerald-700">{selectedItem.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* INSURANCE INPUT FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Policy No</Label>
                  <Input
                    value={formData.policyNo}
                    onChange={(e) => setFormData({ ...formData, policyNo: e.target.value })}
                    placeholder="Enter policy number"
                    className="border-gray-200 focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Policy Date</Label>
                  <Input
                    type="date"
                    value={formData.policyDate}
                    onChange={(e) => setFormData({ ...formData, policyDate: e.target.value })}
                    className="border-gray-200 focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Insurance Company</Label>
                  <Input
                    value={formData.insuranceCompany}
                    onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })}
                    placeholder="Enter insurance company name"
                    className="border-gray-200 focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Insurance Form</Label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="insurance-form-file"
                    />
                    <span
                      onClick={() => document.getElementById("insurance-form-file")?.click()}
                      className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
                    >
                      {formData.insuranceForm ? "Change Insurance Form" : "Upload Insurance Form"}
                    </span>
                    {formData.insuranceForm && (
                      <span className="text-sm font-medium text-gray-700 ml-2">
                        - {formData.insuranceForm}
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
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
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
