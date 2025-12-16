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
import { Wrench } from "lucide-react"

// Types from previous stages
interface FoundationRecord {
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
}

interface InstallationRecord extends FoundationRecord {
  installationMaterialAgeing: string
  installationMaterialReceivingDate: string
  installationChallanLink: string | null
  installationStatus: string
  installationCompletionDate: string
  insPhotoOkDate: string
  installationProcessedAt: string
}

export default function InstallationPage() {
  const [pendingItems, setPendingItems] = useState<FoundationRecord[]>([])
  const [historyItems, setHistoryItems] = useState<InstallationRecord[]>([])
  const [selectedItem, setSelectedItem] = useState<FoundationRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const [formData, setFormData] = useState({
    installationMaterialAgeing: "",
    installationMaterialReceivingDate: "",
    installationChallanLink: null as string | null,
    installationStatus: "",
    installationCompletionDate: "",
    insPhotoOkDate: "",
  })

  useEffect(() => {
    const foundationHistory = localStorage.getItem("foundationHistory")
    const installationHistory = localStorage.getItem("installationHistory")

    let processedFoundations: FoundationRecord[] = []
    let processedInstallations: InstallationRecord[] = []

    if (installationHistory) {
      try {
        processedInstallations = JSON.parse(installationHistory)
        setHistoryItems(processedInstallations)
      } catch (e) {
        console.error("Error parsing installation history")
      }
    }

    if (foundationHistory) {
      try {
        const allFoundations = JSON.parse(foundationHistory)
        const installationSerialNos = new Set(processedInstallations.map((i: any) => i.serialNo))
        processedFoundations = allFoundations.filter((item: FoundationRecord) => !installationSerialNos.has(item.serialNo))
        setPendingItems(processedFoundations)
      } catch (e) {
        console.error("Error parsing foundation history")
      }
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("installationHistory", JSON.stringify(historyItems))
    }
  }, [historyItems, isLoaded])

  const handleActionClick = (item: FoundationRecord) => {
    setSelectedItem(item)
    setFormData({
      installationMaterialAgeing: "",
      installationMaterialReceivingDate: "",
      installationChallanLink: null,
      installationStatus: "",
      installationCompletionDate: "",
      insPhotoOkDate: "",
    })
    setIsDialogOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, installationChallanLink: e.target.files[0].name })
    }
  }

  const handleSubmit = () => {
    if (!selectedItem) return

    const newInstallation: InstallationRecord = {
      ...selectedItem,
      ...formData,
      installationProcessedAt: new Date().toISOString(),
    }

    setPendingItems((prev) => prev.filter((i) => i.serialNo !== selectedItem.serialNo))
    setHistoryItems((prev) => [newInstallation, ...prev])

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
          <Card className="border border-blue-100 shadow-lg bg-white">

            <CardContent className="pt-6">
              {pendingItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No pending records found.
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
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
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Challan Link</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Foundation Status</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Foundation Completion Date</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">FD Photo OK Date</TableHead>
                          <TableHead className="h-12 px-6 py-4 text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingItems.map((item) => (
                          <TableRow key={item.serialNo}>
                            <TableCell>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                                onClick={() => handleActionClick(item)}
                              >
                                <Wrench className="h-4 w-4" />
                                Install
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

                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {pendingItems.map((item) => (
                      <Card key={item.serialNo} className="bg-white border text-sm shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <span className="font-bold text-blue-900 block text-xs tracking-wider">#{item.serialNo}</span>
                              <h4 className="font-semibold text-base">{item.beneficiaryName}</h4>
                              <p className="text-muted-foreground text-xs">{item.regId}</p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                              Pending
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-b py-3 my-2 border-blue-100">
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
                              <span className="text-muted-foreground text-[10px] uppercase">Sanction No</span>
                              <span className="font-medium text-orange-600">{item.sanctionNo || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Sanction Date</span>
                              <span className="font-medium">{item.sanctionDate}</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleActionClick(item)}
                          >
                            <Wrench className="h-4 w-4 mr-2" />
                            Process Installation
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

        {/* HISTORY TAB */}
        <TabsContent value="history" className="mt-6">
          <Card className="border border-indigo-100 shadow-lg bg-white">

            <CardContent className="pt-6">
              {historyItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No installation records yet.</div>
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
                            <TableCell className="whitespace-nowrap bg-blue-50/50 text-blue-700">{item.installationMaterialAgeing}</TableCell>
                            <TableCell className="whitespace-nowrap bg-blue-50/50">{item.installationMaterialReceivingDate}</TableCell>
                            <TableCell className="whitespace-nowrap bg-blue-50/50">
                              {item.installationChallanLink ? (
                                <span className="text-blue-600 underline text-xs cursor-pointer">{item.installationChallanLink}</span>
                              ) : ("-")}
                            </TableCell>
                            <TableCell className="whitespace-nowrap bg-blue-50/50 font-medium text-blue-700">{item.installationStatus}</TableCell>
                            <TableCell className="whitespace-nowrap bg-blue-50/50">{item.installationCompletionDate}</TableCell>
                            <TableCell className="whitespace-nowrap bg-blue-50/50">{item.insPhotoOkDate}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge className="bg-indigo-100 text-indigo-800">Installed</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View */}
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
                            <Badge className="bg-indigo-100 text-indigo-800 text-xs">Installed</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-b py-3 my-2 border-indigo-100">
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Status</span>
                              <span className="font-medium text-indigo-700">{item.installationStatus}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Completed On</span>
                              <span className="font-medium">{item.installationCompletionDate}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Ins Ageing</span>
                              <span className="font-medium">{item.installationMaterialAgeing}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-muted-foreground text-[10px] uppercase">Material Rcvd</span>
                              <span className="font-medium">{item.installationMaterialReceivingDate}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground text-[10px] uppercase block mb-1">Challan Document</span>
                              {item.installationChallanLink ? (
                                <span className="text-blue-600 underline cursor-pointer">{item.installationChallanLink} (File)</span>
                              ) : (
                                <span className="text-gray-400 italic">No document</span>
                              )}
                            </div>
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

      {/* INSTALLATION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Installation Work</DialogTitle>
            <DialogDescription>
              Enter installation details for the selected beneficiary
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 py-4">
              {/* PREFILLED BENEFICIARY DETAILS CARD */}
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-900">Beneficiary Details</CardTitle>
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
                      <p className="font-medium text-blue-700">{selectedItem.pumpType}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Company:</span>
                      <p className="font-medium text-blue-700">{selectedItem.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* INSTALLATION INPUT FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Installation Material Ageing</Label>
                  <Input
                    value={formData.installationMaterialAgeing}
                    onChange={(e) => setFormData({ ...formData, installationMaterialAgeing: e.target.value })}
                    placeholder="e.g. 30 days"
                    className="border-gray-200 focus:border-blue-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Installation Material Receiving Date</Label>
                  <Input
                    type="date"
                    value={formData.installationMaterialReceivingDate}
                    onChange={(e) => setFormData({ ...formData, installationMaterialReceivingDate: e.target.value })}
                    className="border-gray-200 focus:border-blue-400"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Challan Link</Label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="installation-challan-file"
                    />
                    <span
                      onClick={() => document.getElementById("installation-challan-file")?.click()}
                      className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800"
                    >
                      {formData.installationChallanLink ? "Change Challan Document" : "Upload Challan Document"}
                    </span>
                    {formData.installationChallanLink && (
                      <span className="text-sm font-medium text-gray-700 ml-2">
                        - {formData.installationChallanLink}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Installation Status</Label>
                  <Select
                    value={formData.installationStatus}
                    onValueChange={(value) => setFormData({ ...formData, installationStatus: value })}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-400">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Installation Completion Date</Label>
                  <Input
                    type="date"
                    value={formData.installationCompletionDate}
                    onChange={(e) => setFormData({ ...formData, installationCompletionDate: e.target.value })}
                    className="border-gray-200 focus:border-blue-400"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Ins Photo OK Date</Label>
                  <Input
                    type="date"
                    value={formData.insPhotoOkDate}
                    onChange={(e) => setFormData({ ...formData, insPhotoOkDate: e.target.value })}
                    className="border-gray-200 focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Complete Installation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
