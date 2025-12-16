'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Beneficiary {
  serialNo: string;
  regId: string;
  beneficiaryName: string;
  fatherName: string;
  village: string;
  block: string;
  district: string;
  category: string;
  pumpSource: string;
  pumpType: string;
  company: string;
}

export default function PortalPage() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Beneficiary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("beneficiaryHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history from local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage whenever history changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("beneficiaryHistory", JSON.stringify(history));
    }
  }, [history, isLoaded]);
  const [formData, setFormData] = useState<Omit<Beneficiary, "serialNo">>({
    regId: "",
    beneficiaryName: "",
    fatherName: "",
    village: "",
    block: "",
    district: "",
    category: "",
    pumpSource: "",
    pumpType: "",
    company: "",
  });

  const generateSerialNo = () => {
    // Simple auto-increment based on history length + timestamp for uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const count = history.length + 1;
    return `SR${count.toString().padStart(4, "0")}-${timestamp}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    const newEntry: Beneficiary = {
      ...formData,
      serialNo: generateSerialNo(),
    };
    setHistory([newEntry, ...history]); // Add to top
    setOpen(false);
    // Reset form
    setFormData({
      regId: "",
      beneficiaryName: "",
      fatherName: "",
      village: "",
      block: "",
      district: "",
      category: "",
      pumpSource: "",
      pumpType: "",
      company: "",
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">


        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md">
              + Add New Beneficiary
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Beneficiary Registration</DialogTitle>
              <DialogDescription>
                Enter all required details. Serial No will be auto-generated.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="regId">Reg ID</Label>
                <Input id="regId" name="regId" value={formData.regId} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                <Input
                  id="beneficiaryName"
                  name="beneficiaryName"
                  value={formData.beneficiaryName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatherName">Father's Name</Label>
                <Input
                  id="fatherName"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="village">Village</Label>
                <Input id="village" name="village" value={formData.village} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block">Block</Label>
                <Input id="block" name="block" value={formData.block} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pumpSource">Pump Source</Label>
                <Input
                  id="pumpSource"
                  name="pumpSource"
                  value={formData.pumpSource}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pumpType">Pump Type</Label>
                <Input
                  id="pumpType"
                  name="pumpType"
                  value={formData.pumpType}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                Submit & Add to History
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border border-blue-200 shadow-lg">

        <CardContent className="pt-6">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p className="mb-4">No records yet.</p>
              <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
              >
                Add your first beneficiary
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.serialNo}>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {history.map((item) => (
                  <Card key={item.serialNo} className="p-4 border-l-4 border-l-cyan-500 shadow-sm">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-semibold text-cyan-800">Serial No:</span>
                        <span className="font-mono">{item.serialNo}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <span className="text-gray-500 text-xs block">Reg ID</span>
                          <span className="font-medium">{item.regId}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block">Beneficiary</span>
                          <span className="font-medium">{item.beneficiaryName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block">Father</span>
                          <span className="font-medium">{item.fatherName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block">Village</span>
                          <span className="font-medium">{item.village}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block">District</span>
                          <span className="font-medium">{item.district}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}