import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Bell, Plus, Search, Send, Eye, Trash2, Image, Link as LinkIcon, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: number;
  title: string;
  message: string;
  targetAudience: string;
  status: 'Sent' | 'Scheduled' | 'Draft';
  sentDate: string;
  recipients: number;
  openRate: number;
}

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  targetAudience: string;
  status: 'Active' | 'Scheduled' | 'Inactive';
  startDate: string;
  endDate: string;
  clicks: number;
  impressions: number;
}

export function OperationsNotifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'banners'>('notifications');
 
  const [isCreateBannerModalOpen, setIsCreateBannerModalOpen] = useState(false);
  const [isViewBannerModalOpen, setIsViewBannerModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'New Yoga Class Schedule', message: 'Check out our new morning yoga classes starting next week!', targetAudience: 'All Users', status: 'Sent', sentDate: '2024-03-08', recipients: 1247, openRate: 78 },
    { id: 2, title: 'Special Discount Offer', message: 'Get 25% off on annual membership. Limited time offer!', targetAudience: 'Active Students', status: 'Sent', sentDate: '2024-03-07', recipients: 856, openRate: 85 },
    { id: 3, title: 'Meditation Workshop', message: 'Join our weekend meditation workshop with expert guidance.', targetAudience: 'Premium Members', status: 'Scheduled', sentDate: '2024-03-12', recipients: 324, openRate: 0 },
    { id: 4, title: 'Platform Maintenance', message: 'Scheduled maintenance on Sunday, 2 AM - 4 AM.', targetAudience: 'All Users', status: 'Scheduled', sentDate: '2024-03-11', recipients: 1247, openRate: 0 },
    { id: 5, title: 'New Feature Update', message: 'Introducing live video sessions with your favorite tutors!', targetAudience: 'All Users', status: 'Draft', sentDate: '-', recipients: 0, openRate: 0 },
  ]);

  const [banners, setBanners] = useState<Banner[]>([
    { id: 1, title: 'Annual Plan 20% OFF', imageUrl: 'https://images.unsplash.com/photo-1758599879927-f60878034fca', ctaText: 'Claim Offer Now', ctaLink: '/user/payments', targetAudience: 'All Users', status: 'Active', startDate: '2024-03-01', endDate: '2024-03-31', clicks: 342, impressions: 4521 },
    { id: 2, title: 'New Meditation Course', imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773', ctaText: 'Enroll Now', ctaLink: '/user/self-paced', targetAudience: 'Premium Members', status: 'Active', startDate: '2024-03-05', endDate: '2024-03-20', clicks: 187, impressions: 2134 },
    { id: 3, title: 'Summer Wellness Challenge', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', ctaText: 'Join Challenge', ctaLink: '/user/classes', targetAudience: 'All Users', status: 'Scheduled', startDate: '2024-04-01', endDate: '2024-04-30', clicks: 0, impressions: 0 },
  ]);

  const filteredNotifications = notifications.filter(notif =>
    notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.targetAudience.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banner.targetAudience.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const metrics = [
    { title: 'Total Sent', value: notifications.filter(n => n.status === 'Sent').length.toString(), icon: Send, color: '#10b981' },
    { title: 'Scheduled', value: notifications.filter(n => n.status === 'Scheduled').length.toString(), icon: Bell, color: '#f59e0b' },
    { title: 'Drafts', value: notifications.filter(n => n.status === 'Draft').length.toString(), icon: Bell, color: '#64748b' },
    { title: 'Avg Open Rate', value: '81%', icon: Eye, color: '#610981' },
  ];

  const bannerMetrics = [
    { title: 'Active Banners', value: banners.filter(b => b.status === 'Active').length.toString(), icon: Image, color: '#10b981' },
    { title: 'Total Clicks', value: banners.reduce((sum, b) => sum + b.clicks, 0).toString(), icon: Eye, color: '#610981' },
    { title: 'Total Impressions', value: banners.reduce((sum, b) => sum + b.impressions, 0).toLocaleString(), icon: Send, color: '#ff691d' },
    { title: 'Avg CTR', value: '6.2%', icon: Bell, color: '#f59e0b' },
  ];

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification created successfully');
    setIsCreateModalOpen(false);
  };

  const handleDeleteNotification = (id: number) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success('Notification deleted successfully');
    }
  };

  const openViewModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
  };

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Banner created successfully');
    setIsCreateBannerModalOpen(false);
  };

  const handleDeleteBanner = (id: number) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      setBanners(banners.filter(b => b.id !== id));
      toast.success('Banner deleted successfully');
    }
  };

  const openViewBannerModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsViewBannerModalOpen(true);
  };

  const currentMetrics = activeTab === 'notifications' ? metrics : bannerMetrics;

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>App Notifications & Banners</h1>
          <p className="text-muted-foreground mt-1">Manage notifications and promotional banners for users</p>
        </div>
 
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'border-b-2 text-[#610981]'
                : 'text-muted-foreground hover:text-[#610981]'
            }`}
            style={activeTab === 'notifications' ? { borderColor: '#610981' } : {}}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Push Notifications
            </div>
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'banners'
                ? 'border-b-2 text-[#610981]'
                : 'text-muted-foreground hover:text-[#610981]'
            }`}
            style={activeTab === 'banners' ? { borderColor: '#610981' } : {}}
          >
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              User Banners
            </div>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {currentMetrics.map((metric, index) => {
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

        {activeTab === 'notifications' ? (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle style={{ color: '#ff691d' }}>All Notifications</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2"
                    style={{ backgroundColor: '#610981' }}
                  >
                    <Plus className="w-4 h-4" />
                    Create Notification
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Title</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Target Audience</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Recipients</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Open Rate</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Status</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Date</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotifications.map((notification) => (
                      <tr key={notification.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">{notification.message}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{notification.targetAudience}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" style={{ borderColor: '#610981', color: '#610981' }}>
                            {notification.recipients} users
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {notification.openRate > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[60px]">
                                <div 
                                  className="h-full rounded-full"
                                  style={{ 
                                    width: `${notification.openRate}%`,
                                    backgroundColor: '#10b981'
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium">{notification.openRate}%</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={notification.status === 'Sent' ? 'default' : notification.status === 'Scheduled' ? 'secondary' : 'outline'}
                            style={notification.status === 'Scheduled' ? { backgroundColor: '#f59e0b', color: 'white' } : {}}
                          >
                            {notification.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{notification.sentDate}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(notification)}
                              className="hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
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
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle style={{ color: '#ff691d' }}>All User Banners</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search banners..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Button 
                    onClick={() => setIsCreateBannerModalOpen(true)}
                    className="gap-2"
                    style={{ backgroundColor: '#610981' }}
                  >
                    <Plus className="w-4 h-4" />
                    Create Banner
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBanners.map((banner) => (
                  <div key={banner.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={banner.imageUrl} 
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={banner.status === 'Active' ? 'default' : banner.status === 'Scheduled' ? 'secondary' : 'outline'}
                            style={banner.status === 'Active' ? { backgroundColor: '#10b981' } : banner.status === 'Scheduled' ? { backgroundColor: '#f59e0b', color: 'white' } : {}}
                          >
                            {banner.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{banner.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Target: {banner.targetAudience}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewBannerModal(banner)}
                              className="hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">CTA Button</p>
                            <p className="text-sm font-medium">{banner.ctaText}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Date Range</p>
                            <p className="text-sm font-medium">{banner.startDate} - {banner.endDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Impressions</p>
                            <p className="text-sm font-medium">{banner.impressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Clicks</p>
                            <p className="text-sm font-medium">{banner.clicks}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
 
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Create Notification</DialogTitle>
            <DialogDescription>Send a new notification to users</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNotification} className="space-y-4">
            <div>
              <Label htmlFor="title" style={{ color: '#ffac96' }}>Notification Title</Label>
              <Input id="title" placeholder="Enter notification title" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="message" style={{ color: '#ffac96' }}>Message</Label>
              <textarea 
                id="message" 
                placeholder="Enter notification message..." 
                className="w-full mt-1 px-3 py-2 border rounded-md min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="audience" style={{ color: '#ffac96' }}>Target Audience</Label>
                <select id="audience" className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>All Users</option>
                  <option>Active Students</option>
                  <option>Premium Members</option>
                  <option>Trial Users</option>
                  <option>Inactive Users</option>
                </select>
              </div>
              <div>
                <Label htmlFor="scheduleDate" style={{ color: '#ffac96' }}>Schedule Date (Optional)</Label>
                <Input id="scheduleDate" type="datetime-local" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Save as Draft
              </Button>
              <Button type="submit" style={{ backgroundColor: '#610981' }}>
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Notification Details</DialogTitle>
            <DialogDescription>View notification information and status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#ffac96' }}>Title</Label>
              <p className="mt-1 font-medium">{selectedNotification?.title}</p>
            </div>
            <div>
              <Label style={{ color: '#ffac96' }}>Message</Label>
              <p className="mt-1 text-muted-foreground">{selectedNotification?.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: '#ffac96' }}>Target Audience</Label>
                <p className="mt-1">{selectedNotification?.targetAudience}</p>
              </div>
              <div>
                <Label style={{ color: '#ffac96' }}>Status</Label>
                <Badge className="mt-1" variant={selectedNotification?.status === 'Sent' ? 'default' : 'secondary'}>
                  {selectedNotification?.status}
                </Badge>
              </div>
              <div>
                <Label style={{ color: '#ffac96' }}>Recipients</Label>
                <p className="mt-1">{selectedNotification?.recipients} users</p>
              </div>
              <div>
                <Label style={{ color: '#ffac96' }}>Open Rate</Label>
                <p className="mt-1">{selectedNotification?.openRate > 0 ? `${selectedNotification?.openRate}%` : '-'}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
 
      <Dialog open={isCreateBannerModalOpen} onOpenChange={setIsCreateBannerModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Create Banner</DialogTitle>
            <DialogDescription>Create a new promotional banner for users</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBanner} className="space-y-4">
            <div>
              <Label htmlFor="title" style={{ color: '#ffac96' }}>Banner Title</Label>
              <Input id="title" placeholder="Enter banner title" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="imageUrl" style={{ color: '#ffac96' }}>Image URL</Label>
              <Input id="imageUrl" type="file" accept="image/*" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="ctaText" style={{ color: '#ffac96' }}>CTA Button Text</Label>
              <Input id="ctaText" placeholder="Enter CTA button text" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="ctaLink" style={{ color: '#ffac96' }}>CTA Link</Label>
              <Input id="ctaLink" placeholder="Enter CTA link" className="mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="audience" style={{ color: '#ffac96' }}>Target Audience</Label>
                <select id="audience" className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>All Users</option>
                  <option>Active Students</option>
                  <option>Premium Members</option>
                  <option>Trial Users</option>
                  <option>Inactive Users</option>
                </select>
              </div>
              <div>
                <Label htmlFor="scheduleDate" style={{ color: '#ffac96' }}>Schedule Date (Optional)</Label>
                <Input id="scheduleDate" type="datetime-local" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateBannerModalOpen(false)}>
                Save as Draft
              </Button>
              <Button type="submit" style={{ backgroundColor: '#610981' }}>
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      <Dialog open={isViewBannerModalOpen} onOpenChange={setIsViewBannerModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Banner Details</DialogTitle>
            <DialogDescription>View banner information and status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label style={{ color: '#ffac96' }}>Title</Label>
              <p className="mt-1 font-medium">{selectedBanner?.title}</p>
            </div>
            <div>
              <Label style={{ color: '#ffac96' }}>Image URL</Label>
              <p className="mt-1 text-muted-foreground">{selectedBanner?.imageUrl}</p>
            </div>
            <div>
              <Label style={{ color: '#ffac96' }}>CTA Button Text</Label>
              <p className="mt-1 text-muted-foreground">{selectedBanner?.ctaText}</p>
            </div>
            <div>
              <Label style={{ color: '#ffac96' }}>CTA Link</Label>
              <p className="mt-1 text-muted-foreground">{selectedBanner?.ctaLink}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label style={{ color: '#ffac96' }}>Target Audience</Label>
                <p className="mt-1">{selectedBanner?.targetAudience}</p>
              </div>
              <div>
                <Label style={{ color: '#ffac96' }}>Status</Label>
                <Badge className="mt-1" variant={selectedBanner?.status === 'Active' ? 'default' : 'secondary'}>
                  {selectedBanner?.status}
                </Badge>
              </div>
              <div>
                <Label style={{ color: '#ffac96' }}>Date Range</Label>
                <p className="mt-1">{selectedBanner?.startDate} - {selectedBanner?.endDate}</p>
              </div>
              <div>
                <Label style={{ color: '#ffac96' }}>Impressions</Label>
                <p className="mt-1">{selectedBanner?.impressions.toLocaleString()}</p>
              </div>
              <div>
                <Label style={{ color: '#ffac96' }}>Clicks</Label>
                <p className="mt-1">{selectedBanner?.clicks}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsViewBannerModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}