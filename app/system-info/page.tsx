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
import { Info } from "lucide-react"

// Types from previous stages
interface InstallationRecord {
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
}

interface SystemInfoRecord extends InstallationRecord {
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
  systemInfoProcessedAt: string
}

export default function SystemInfoPage() {
  const [pendingItems, setPendingItems] = useState<InstallationRecord[]>([])
  const [historyItems, setHistoryItems] = useState<SystemInfoRecord[]>([])
  const [selectedItem, setSelectedItem] = useState<InstallationRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [formData, setFormData] = useState({
    moduleMake: "",
    moduleSerialNo1: "",
    moduleSerialNo2: "",
    moduleSerialNo3: "",
    moduleSerialNo4: "",
    moduleSerialNo5: "",
    moduleSerialNo6: "",
    moduleSerialNo7: "",
    moduleSerialNo8: "",
    moduleSerialNo9: "",
    controllerMake: "",
    controllerNo: "",
    rmsNo: "",
    pumpMake: "",
    pumpSerialNo: "",
    motorSerialNo: "",
    structureMake: "",
    photoPrint: "",
  })

  useEffect(() => {
    const installationHistory = localStorage.getItem("installationHistory")
    const systemInfoHistory = localStorage.getItem("systemInfoHistory")

    let processedInstallations: InstallationRecord[] = []
    let processedSystemInfo: SystemInfoRecord[] = []

    if (systemInfoHistory) {
      try {
        processedSystemInfo = JSON.parse(systemInfoHistory)
        setHistoryItems(processedSystemInfo)
      } catch (e) {
        console.error("Error parsing system info history")
      }
    }

    if (installationHistory) {
      try {
        const allInstallations = JSON.parse(installationHistory)
        const systemInfoSerialNos = new Set(processedSystemInfo.map((s: any) => s.serialNo))
        processedInstallations = allInstallations.filter((item: InstallationRecord) => !systemInfoSerialNos.has(item.serialNo))
        setPendingItems(processedInstallations)
      } catch (e) {
        console.error("Error parsing installation history")
      }
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("systemInfoHistory", JSON.stringify(historyItems))
    }
  }, [historyItems, isLoaded])

  const handleActionClick = (item: InstallationRecord) => {
    setSelectedItem(item)
    setFormData({
      moduleMake: "",
      moduleSerialNo1: "",
      moduleSerialNo2: "",
      moduleSerialNo3: "",
      moduleSerialNo4: "",
      moduleSerialNo5: "",
      moduleSerialNo6: "",
      moduleSerialNo7: "",
      moduleSerialNo8: "",
      moduleSerialNo9: "",
      controllerMake: "",
      controllerNo: "",
      rmsNo: "",
      pumpMake: "",
      pumpSerialNo: "",
      motorSerialNo: "",
      structureMake: "",
      photoPrint: "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!selectedItem) return

    const newSystemInfo: SystemInfoRecord = {
      ...selectedItem,
      ...formData,
      systemInfoProcessedAt: new Date().toISOString(),
    }

    setPendingItems((prev) => prev.filter((i) => i.serialNo !== selectedItem.serialNo))
    setHistoryItems((prev) => [newSystemInfo, ...prev])

    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-full mx-auto">


      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending for System Info</TabsTrigger>
          <TabsTrigger value="history">System Info History</TabsTrigger>
        </TabsList>

        {/* PENDING TAB */}
        <TabsContent value="pending" className="mt-6">
          <Card className="border border-purple-100 shadow-lg bg-white">

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
                        <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingItems.map((item) => (
                        <TableRow key={item.serialNo}>
                          <TableCell>
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                              onClick={() => handleActionClick(item)}
                            >
                              <Info className="h-4 w-4" />
                              System Info
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
          <Card className="border border-pink-100 shadow-lg bg-white">

            <CardContent className="pt-6">
              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No system info records yet.</div>
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
                          <TableCell className="whitespace-nowrap bg-purple-50/50 text-purple-700">{item.moduleMake}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.moduleSerialNo1}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.moduleSerialNo2}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.moduleSerialNo3}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.moduleSerialNo4}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.moduleSerialNo5}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.moduleSerialNo6}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.moduleSerialNo7}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.moduleSerialNo8}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.moduleSerialNo9}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.controllerMake}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.controllerNo}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.rmsNo}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.pumpMake}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.pumpSerialNo}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.motorSerialNo}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50">{item.structureMake}</TableCell>
                          <TableCell className="whitespace-nowrap bg-purple-50/50 font-medium text-purple-700">{item.photoPrint}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className="bg-purple-100 text-purple-800">Completed</Badge>
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

      {/* SYSTEM INFO DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter System Information</DialogTitle>
            <DialogDescription>
              Enter system details for the selected beneficiary
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 py-4">
              {/* PREFILLED BENEFICIARY DETAILS CARD */}
              <Card className="border-2 border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-900">Beneficiary Details</CardTitle>
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
                      <p className="font-medium text-purple-700">{selectedItem.pumpType}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Company:</span>
                      <p className="font-medium text-purple-700">{selectedItem.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SYSTEM INFO INPUT FORM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Module Make</Label>
                  <Input
                    value={formData.moduleMake}
                    onChange={(e) => setFormData({ ...formData, moduleMake: e.target.value })}
                    placeholder="Enter module make"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Serial No.1</Label>
                  <Input
                    value={formData.moduleSerialNo1}
                    onChange={(e) => setFormData({ ...formData, moduleSerialNo1: e.target.value })}
                    placeholder="Serial number 1"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Serial No.2</Label>
                  <Input
                    value={formData.moduleSerialNo2}
                    onChange={(e) => setFormData({ ...formData, moduleSerialNo2: e.target.value })}
                    placeholder="Serial number 2"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Serial No.3</Label>
                  <Input
                    value={formData.moduleSerialNo3}
                    onChange={(e) => setFormData({ ...formData, moduleSerialNo3: e.target.value })}
                    placeholder="Serial number 3"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Serial No.4</Label>
                  <Input
                    value={formData.moduleSerialNo4}
                    onChange={(e) => setFormData({ ...formData, moduleSerialNo4: e.target.value })}
                    placeholder="Serial number 4"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Serial No.5</Label>
                  <Input
                    value={formData.moduleSerialNo5}
                    onChange={(e) => setFormData({ ...formData, moduleSerialNo5: e.target.value })}
                    placeholder="Serial number 5"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Serial No.6</Label>
                  <Input
                    value={formData.moduleSerialNo6}
                    onChange={(e) => setFormData({ ...formData, moduleSerialNo6: e.target.value })}
                    placeholder="Serial number 6"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Serial No.7</Label>
                  <Input
                    value={formData.moduleSerialNo7}
                    onChange={(e) => setFormData({ ...formData, moduleSerialNo7: e.target.value })}
                    placeholder="Serial number 7"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Serial No.8</Label>
                  <Input
                    value={formData.moduleSerialNo8}
                    onChange={(e) => setFormData({ ...formData, moduleSerialNo8: e.target.value })}
                    placeholder="Serial number 8"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Module Serial No.9</Label>
                  <Input
                    value={formData.moduleSerialNo9}
                    onChange={(e) => setFormData({ ...formData, moduleSerialNo9: e.target.value })}
                    placeholder="Serial number 9"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Controller Make</Label>
                  <Input
                    value={formData.controllerMake}
                    onChange={(e) => setFormData({ ...formData, controllerMake: e.target.value })}
                    placeholder="Enter controller make"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Controller No</Label>
                  <Input
                    value={formData.controllerNo}
                    onChange={(e) => setFormData({ ...formData, controllerNo: e.target.value })}
                    placeholder="Enter controller number"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>RMS No (RID NO)</Label>
                  <Input
                    value={formData.rmsNo}
                    onChange={(e) => setFormData({ ...formData, rmsNo: e.target.value })}
                    placeholder="Enter RMS/RID number"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pump Make</Label>
                  <Input
                    value={formData.pumpMake}
                    onChange={(e) => setFormData({ ...formData, pumpMake: e.target.value })}
                    placeholder="Enter pump make"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pump Serial No</Label>
                  <Input
                    value={formData.pumpSerialNo}
                    onChange={(e) => setFormData({ ...formData, pumpSerialNo: e.target.value })}
                    placeholder="Enter pump serial number"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Motor Serial No</Label>
                  <Input
                    value={formData.motorSerialNo}
                    onChange={(e) => setFormData({ ...formData, motorSerialNo: e.target.value })}
                    placeholder="Enter motor serial number"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Structure Make</Label>
                  <Input
                    value={formData.structureMake}
                    onChange={(e) => setFormData({ ...formData, structureMake: e.target.value })}
                    placeholder="Enter structure make"
                    className="border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photo Print</Label>
                  <Select
                    value={formData.photoPrint}
                    onValueChange={(value) => setFormData({ ...formData, photoPrint: value })}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-purple-400">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Not Required">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Submit System Info
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
