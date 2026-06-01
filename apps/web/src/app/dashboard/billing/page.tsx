"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  DollarSign, Plus, Search, ChevronLeft, ChevronRight,
  CreditCard, TrendingUp, Download, Clock,
} from "lucide-react";

export default function BillingPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const mockBills = [
    { id: "1", patientName: "Ben Stokes", amount: 250.00, status: "PAID", date: "2025-05-01", method: "Card" },
    { id: "2", patientName: "Hilda Hunter", amount: 180.00, status: "PENDING", date: "2025-05-03", method: "Cash" },
    { id: "3", patientName: "Ellen Barton", amount: 320.00, status: "PAID", date: "2025-05-05", method: "Insurance" },
    { id: "4", patientName: "Thad Ennings", amount: 95.00, status: "OVERDUE", date: "2025-04-28", method: "Card" },
    { id: "5", patientName: "Michel Bomb", amount: 410.00, status: "PENDING", date: "2025-05-06", method: "Cash" },
  ];

  const filtered = mockBills.filter(b =>
    b.patientName.toLowerCase().includes(search.toLowerCase()) ||
    b.id.includes(search)
  );

  const stats = [
    { label: "Total Revenue", value: "$4,280", icon: DollarSign, color: "sky" },
    { label: "Pending", value: "$590", icon: Clock, color: "amber" },
    { label: "Paid This Month", value: "$3,690", icon: TrendingUp, color: "emerald" },
    { label: "Overdue", value: "$95", icon: CreditCard, color: "rose" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-sky-500" />
            Billing
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage payments and invoices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <span className="inline-flex items-center justify-center rounded-lg h-11 px-6 font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/25 cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </span>
          </DialogTrigger>
          <DialogContent className="max-w-lg glass-card border-0">
            <DialogHeader>
              <DialogTitle className="gradient-text text-xl">Create Invoice</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 mt-2">
              <div>
                <Label>Patient</Label>
                <Input className="mt-1 bg-white border-slate-200" placeholder="Patient name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <Input type="number" className="mt-1 bg-white border-slate-200" placeholder="0.00" />
                </div>
                <div>
                  <Label>Method</Label>
                  <Select>
                    <SelectTrigger className="mt-1 bg-white border-slate-200">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white">Create Invoice</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="glass-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-${s.color}-50 flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 text-${s.color}-500`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  <p className="text-lg font-bold text-slate-800 font-display">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-slate-200 h-11"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Invoice #</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Patient</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Amount</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Method</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((bill) => (
                <TableRow key={bill.id} className="hover:bg-white/40 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500">#{bill.id}</TableCell>
                  <TableCell className="font-medium text-slate-700">{bill.patientName}</TableCell>
                  <TableCell className="font-semibold text-slate-800">${bill.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-slate-500">{bill.method}</TableCell>
                  <TableCell className="text-slate-500">{bill.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={bill.status === "PAID" ? "default" : bill.status === "PENDING" ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {bill.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}