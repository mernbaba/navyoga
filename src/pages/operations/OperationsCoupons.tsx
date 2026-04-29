import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Ticket, Plus, Search, Edit, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: number;
  code: string;
  discount: string;
  type: 'Percentage' | 'Fixed';
  status: 'Active' | 'Expired' | 'Disabled';
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usageCount: number;
  description: string;
}

export function OperationsCoupons() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: 1, code: 'SUMMER25', discount: '25', type: 'Percentage', status: 'Active', validFrom: '2024-03-01', validUntil: '2024-06-30', usageLimit: 100, usageCount: 45, description: 'Summer special discount' },
    { id: 2, code: 'WELCOME500', discount: '500', type: 'Fixed', status: 'Active', validFrom: '2024-01-01', validUntil: '2024-12-31', usageLimit: 500, usageCount: 234, description: 'Welcome bonus for new users' },
    { id: 3, code: 'YOGA50', discount: '50', type: 'Percentage', status: 'Active', validFrom: '2024-03-01', validUntil: '2024-03-31', usageLimit: 50, usageCount: 38, description: 'Half price yoga classes' },
    { id: 4, code: 'WINTER20', discount: '20', type: 'Percentage', status: 'Expired', validFrom: '2024-01-01', validUntil: '2024-02-28', usageLimit: 200, usageCount: 156, description: 'Winter season discount' },
    { id: 5, code: 'TRIAL100', discount: '100', type: 'Fixed', status: 'Disabled', validFrom: '2024-02-01', validUntil: '2024-12-31', usageLimit: 1000, usageCount: 0, description: 'Trial class discount' },
  ]);

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const metrics = [
    { title: 'Total Coupons', value: coupons.length.toString(), icon: Ticket, color: '#ff691d' },
    { title: 'Active Coupons', value: coupons.filter(c => c.status === 'Active').length.toString(), icon: Ticket, color: '#10b981' },
    { title: 'Total Redemptions', value: coupons.reduce((sum, c) => sum + c.usageCount, 0).toString(), icon: TrendingUp, color: '#610981' },
    { title: 'Avg Usage Rate', value: '62%', icon: TrendingUp, color: '#f59e0b' },
  ];

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Coupon created successfully');
    setIsAddModalOpen(false);
  };

  const handleEditCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Coupon updated successfully');
    setIsEditModalOpen(false);
    setSelectedCoupon(null);
  };

  const handleDeleteCoupon = (id: number) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('Coupon deleted successfully');
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Coupon Code Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage promotional coupon codes</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                  style={{ backgroundColor: metric.color }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle style={{ color: '#ff691d' }}>All Coupons</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search coupons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="gap-2"
                  style={{ backgroundColor: '#610981' }}
                >
                  <Plus className="w-4 h-4" />
                  Create Coupon
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Code</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Discount</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Type</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Valid Period</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Usage</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium font-mono">{coupon.code}</p>
                          <p className="text-sm text-muted-foreground">{coupon.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold" style={{ color: '#610981' }}>
                          {coupon.type === 'Percentage' ? `${coupon.discount}%` : `₹${coupon.discount}`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                          {coupon.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>{coupon.validFrom}</p>
                          <p className="text-muted-foreground">to {coupon.validUntil}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium">{coupon.usageCount} / {coupon.usageLimit}</p>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${(coupon.usageCount / coupon.usageLimit) * 100}%`,
                                backgroundColor: '#610981'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={coupon.status === 'Active' ? 'default' : 'secondary'}
                          style={coupon.status === 'Expired' ? { backgroundColor: '#ef4444', color: 'white' } : {}}
                        >
                          {coupon.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(coupon)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
 
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Create New Coupon</DialogTitle>
            <DialogDescription>Create a promotional coupon code</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCoupon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code" style={{ color: '#ffac96' }}>Coupon Code</Label>
                <Input id="code" placeholder="SUMMER25" className="mt-1 font-mono uppercase" />
              </div>
              <div>
                <Label htmlFor="type" style={{ color: '#ffac96' }}>Discount Type</Label>
                <select id="type" className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Percentage</option>
                  <option>Fixed</option>
                </select>
              </div>
              <div>
                <Label htmlFor="discount" style={{ color: '#ffac96' }}>Discount Value</Label>
                <Input id="discount" type="number" placeholder="25" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="usageLimit" style={{ color: '#ffac96' }}>Usage Limit</Label>
                <Input id="usageLimit" type="number" placeholder="100" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="validFrom" style={{ color: '#ffac96' }}>Valid From</Label>
                <Input id="validFrom" type="date" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="validUntil" style={{ color: '#ffac96' }}>Valid Until</Label>
                <Input id="validUntil" type="date" className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="description" style={{ color: '#ffac96' }}>Description</Label>
              <Input id="description" placeholder="Brief description" className="mt-1" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#610981' }}>
                Create Coupon
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Edit Coupon</DialogTitle>
            <DialogDescription>Update coupon details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCoupon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editCode" style={{ color: '#ffac96' }}>Coupon Code</Label>
                <Input id="editCode" defaultValue={selectedCoupon?.code} className="mt-1 font-mono" disabled />
              </div>
              <div>
                <Label htmlFor="editType" style={{ color: '#ffac96' }}>Discount Type</Label>
                <select id="editType" defaultValue={selectedCoupon?.type} className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Percentage</option>
                  <option>Fixed</option>
                </select>
              </div>
              <div>
                <Label htmlFor="editDiscount" style={{ color: '#ffac96' }}>Discount Value</Label>
                <Input id="editDiscount" type="number" defaultValue={selectedCoupon?.discount} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editUsageLimit" style={{ color: '#ffac96' }}>Usage Limit</Label>
                <Input id="editUsageLimit" type="number" defaultValue={selectedCoupon?.usageLimit} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editValidFrom" style={{ color: '#ffac96' }}>Valid From</Label>
                <Input id="editValidFrom" type="date" defaultValue={selectedCoupon?.validFrom} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editValidUntil" style={{ color: '#ffac96' }}>Valid Until</Label>
                <Input id="editValidUntil" type="date" defaultValue={selectedCoupon?.validUntil} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editStatus" style={{ color: '#ffac96' }}>Status</Label>
                <select id="editStatus" defaultValue={selectedCoupon?.status} className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Active</option>
                  <option>Disabled</option>
                  <option>Expired</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="editDescription" style={{ color: '#ffac96' }}>Description</Label>
              <Input id="editDescription" defaultValue={selectedCoupon?.description} className="mt-1" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setSelectedCoupon(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#610981' }}>
                Update Coupon
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
