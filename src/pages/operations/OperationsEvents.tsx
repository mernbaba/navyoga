import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Calendar, MapPin, Users, Clock, Search, Plus, Edit, Trash2, Eye, CalendarDays, IndianRupee, Video, Filter, Sparkles, TrendingUp, Star } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  location: string;
  type: 'Workshop' | 'Retreat' | 'Masterclass' | 'Webinar' | 'Special Event';
  category: string;
  price: number;
  capacity: number;
  registered: number;
  image: string;
  status: 'Upcoming' | 'Registering' | 'Full' | 'Completed';
  featured: boolean;
  benefits: string[];
  createdAt: string;
}

export function OperationsEvents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: 'Advanced Meditation Retreat',
      description: 'A 3-day immersive meditation retreat in the serene mountains of Rishikesh. Experience deep inner peace and mindfulness.',
      date: '2026-04-15',
      time: '6:00 AM',
      duration: '3 Days',
      instructor: 'Swami Ananda',
      location: 'Rishikesh, Uttarakhand',
      type: 'Retreat',
      category: 'Meditation',
      price: 12000,
      capacity: 30,
      registered: 18,
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
      status: 'Registering',
      featured: true,
      benefits: ['Accommodation included', 'Vegetarian meals', 'Guided sessions', 'Certificate of completion'],
      createdAt: '2026-03-20T10:00:00Z'
    },
    {
      id: 2,
      title: 'Pranayama Breathing Workshop',
      description: 'Master the art of breath control with expert guidance. Learn ancient breathing techniques for health and vitality.',
      date: '2026-04-08',
      time: '9:00 AM',
      duration: '4 Hours',
      instructor: 'Priya Sharma',
      location: 'NavYoga Studio, Mumbai',
      type: 'Workshop',
      category: 'Pranayama',
      price: 1500,
      capacity: 50,
      registered: 45,
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
      status: 'Registering',
      featured: true,
      benefits: ['Course materials', 'Practice guide', 'Follow-up support', 'Recording access'],
      createdAt: '2026-03-18T14:30:00Z'
    },
    {
      id: 3,
      title: 'Yoga for Athletes Masterclass',
      description: 'Specialized yoga training designed for athletes and fitness enthusiasts to improve flexibility and performance.',
      date: '2026-04-12',
      time: '5:00 PM',
      duration: '2 Hours',
      instructor: 'Vikram Singh',
      location: 'Online (Live)',
      type: 'Masterclass',
      category: 'Hatha Yoga',
      price: 999,
      capacity: 100,
      registered: 67,
      image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0',
      status: 'Registering',
      featured: false,
      benefits: ['Live Q&A session', 'PDF workout plan', 'Lifetime recording access', 'Community group'],
      createdAt: '2026-03-22T09:15:00Z'
    },
    {
      id: 4,
      title: 'Ayurveda & Yoga Wellness Retreat',
      description: 'Combine ancient Ayurvedic wisdom with yoga practices for holistic health and rejuvenation.',
      date: '2026-04-20',
      time: '7:00 AM',
      duration: '5 Days',
      instructor: 'Dr. Anita Verma',
      location: 'Kerala, India',
      type: 'Retreat',
      category: 'Wellness',
      price: 25000,
      capacity: 25,
      registered: 22,
      image: 'https://images.unsplash.com/photo-1545389336-cf090694435e',
      status: 'Registering',
      featured: true,
      benefits: ['Ayurvedic consultation', 'Personalized diet plan', 'Spa treatments', 'All meals included'],
      createdAt: '2026-03-15T11:00:00Z'
    },
    {
      id: 5,
      title: 'Chakra Balancing Webinar',
      description: 'Learn about the seven chakras and techniques to balance your energy centers for optimal well-being.',
      date: '2026-04-05',
      time: '7:00 PM',
      duration: '90 Minutes',
      instructor: 'Rahul Kumar',
      location: 'Online (Zoom)',
      type: 'Webinar',
      category: 'Energy Healing',
      price: 499,
      capacity: 200,
      registered: 142,
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
      status: 'Registering',
      featured: false,
      benefits: ['Digital workbook', 'Meditation audio', 'Certificate', 'Replay access'],
      createdAt: '2026-03-25T16:45:00Z'
    },
    {
      id: 6,
      title: 'International Yoga Day Celebration',
      description: 'Join us for a special celebration with multiple sessions, guest speakers, and community activities.',
      date: '2026-06-21',
      time: '6:00 AM',
      duration: 'Full Day',
      instructor: 'Multiple Instructors',
      location: 'NavYoga Campus, Delhi',
      type: 'Special Event',
      category: 'Community',
      price: 0,
      capacity: 500,
      registered: 234,
      image: 'https://images.unsplash.com/photo-1588286840104-8957b019727f',
      status: 'Registering',
      featured: true,
      benefits: ['Free entry', 'Refreshments', 'Yoga mat provided', 'Goodie bag'],
      createdAt: '2026-03-10T08:00:00Z'
    },
  ]);
 
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    instructor: '',
    location: '',
    type: 'Workshop' as Event['type'],
    category: '',
    price: '',
    capacity: '',
    image: '',
    status: 'Registering' as Event['status'],
    featured: false,
    benefits: ''
  });

  const eventTypes = ['All', 'Workshop', 'Retreat', 'Masterclass', 'Webinar', 'Special Event'];
  const categories = ['Meditation', 'Pranayama', 'Hatha Yoga', 'Wellness', 'Energy Healing', 'Community'];
  const statuses = ['Upcoming', 'Registering', 'Full', 'Completed'];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || event.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCreateEvent = () => {
    if (!formData.title || !formData.date || !formData.time || !formData.instructor) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newEvent: Event = {
      id: events.length + 1,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      instructor: formData.instructor,
      location: formData.location,
      type: formData.type,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      capacity: parseInt(formData.capacity) || 0,
      registered: 0,
      image: formData.image || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
      status: formData.status,
      featured: formData.featured,
      benefits: formData.benefits.split(',').map(b => b.trim()).filter(b => b),
      createdAt: new Date().toISOString()
    };

    setEvents([newEvent, ...events]);
    toast.success('Event created successfully!');
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdateEvent = () => {
    if (!selectedEvent || !formData.title || !formData.date || !formData.time || !formData.instructor) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedEvent: Event = {
      ...selectedEvent,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      instructor: formData.instructor,
      location: formData.location,
      type: formData.type,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      capacity: parseInt(formData.capacity) || 0,
      image: formData.image || selectedEvent.image,
      status: formData.status,
      featured: formData.featured,
      benefits: formData.benefits.split(',').map(b => b.trim()).filter(b => b)
    };

    setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e));
    toast.success('Event updated successfully!');
    setIsEditOpen(false);
    setSelectedEvent(null);
    resetForm();
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    setEvents(events.filter(e => e.id !== selectedEvent.id));
    toast.success('Event deleted successfully!');
    setIsDeleteOpen(false);
    setSelectedEvent(null);
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      duration: event.duration,
      instructor: event.instructor,
      location: event.location,
      type: event.type,
      category: event.category,
      price: event.price.toString(),
      capacity: event.capacity.toString(),
      image: event.image,
      status: event.status,
      featured: event.featured,
      benefits: event.benefits.join(', ')
    });
    setIsEditOpen(true);
  };

  const openViewDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsViewOpen(true);
  };

  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '',
      instructor: '',
      location: '',
      type: 'Workshop',
      category: '',
      price: '',
      capacity: '',
      image: '',
      status: 'Registering',
      featured: false,
      benefits: ''
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Workshop': return '#f59e0b';
      case 'Retreat': return '#10b981';
      case 'Masterclass': return '#610981';
      case 'Webinar': return '#3b82f6';
      case 'Special Event': return '#ff691d';
      default: return '#64748b';
    }
  };

  const stats = [
    { label: 'Total Events', value: events.length.toString(), icon: Calendar, color: '#ff691d' },
    { label: 'Registering', value: events.filter(e => e.status === 'Registering').length.toString(), icon: TrendingUp, color: '#10b981' },
    { label: 'Featured', value: events.filter(e => e.featured).length.toString(), icon: Star, color: '#f59e0b' },
    { label: 'Total Registrations', value: events.reduce((sum, e) => sum + e.registered, 0).toString(), icon: Users, color: '#610981' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
 
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Events Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage events, workshops, and retreats</p>
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="gap-2"
            style={{ backgroundColor: '#610981' }}
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>
 
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                  style={{ backgroundColor: stat.color }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
 
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search events by title, description, or instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {eventTypes.map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    onClick={() => setSelectedType(type)}
                    className="whitespace-nowrap"
                    style={selectedType === type ? { backgroundColor: '#610981' } : {}}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Card>
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>
              All Events ({filteredEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border-2 border-gray-100 hover:border-purple-200 transition-all bg-white"
                >
                  <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge 
                        className="text-xs"
                        style={{ backgroundColor: getEventTypeColor(event.type), color: 'white' }}
                      >
                        {event.type}
                      </Badge>
                      {event.featured && (
                        <Badge className="bg-yellow-500 text-white text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">with {event.instructor}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <IndianRupee className="w-4 h-4" style={{ color: '#ff691d' }} />
                          <span className="font-bold" style={{ color: '#ff691d' }}>
                            {event.price === 0 ? 'Free' : event.price.toLocaleString()}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {event.registered}/{event.capacity} registered
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" style={{ color: '#610981' }} />
                        <span>{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" style={{ color: '#610981' }} />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="w-4 h-4" style={{ color: '#610981' }} />
                        <span>{event.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {event.location.includes('Online') ? (
                          <Video className="w-4 h-4" style={{ color: '#610981' }} />
                        ) : (
                          <MapPin className="w-4 h-4" style={{ color: '#610981' }} />
                        )}
                        <span className="truncate">{event.location}</span>
                      </div>
                      <Badge 
                        variant="outline"
                        className="ml-auto"
                        style={{ 
                          borderColor: event.status === 'Registering' ? '#10b981' : '#64748b',
                          color: event.status === 'Registering' ? '#10b981' : '#64748b'
                        }}
                      >
                        {event.status}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openViewDialog(event)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(event)}
                        className="gap-2"
                        style={{ borderColor: '#610981', color: '#610981' }}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteDialog(event)}
                        className="gap-2 border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No events found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or create a new event
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
 
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Create New Event</DialogTitle>
            <DialogDescription>Add a new event for users to register and participate</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor Name *</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="Enter instructor name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Event Type *</Label>
                <Select value={formData.type} onValueChange={(value: Event['type']) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Retreat">Retreat</SelectItem>
                    <SelectItem value="Masterclass">Masterclass</SelectItem>
                    <SelectItem value="Webinar">Webinar</SelectItem>
                    <SelectItem value="Special Event">Special Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Event Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="e.g., 9:00 AM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 2 Hours"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location or 'Online'"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: Event['status']) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="Enter image URL (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits (comma-separated)</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="e.g., Course materials, Certificate, Recording access"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#610981' }}
              />
              <Label htmlFor="featured" className="cursor-pointer">Mark as Featured Event</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent} style={{ backgroundColor: '#610981' }}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Edit Event</DialogTitle>
            <DialogDescription>Update event information</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Event Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-instructor">Instructor Name *</Label>
                <Input
                  id="edit-instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Event Type *</Label>
                <Select value={formData.type} onValueChange={(value: Event['type']) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Retreat">Retreat</SelectItem>
                    <SelectItem value="Masterclass">Masterclass</SelectItem>
                    <SelectItem value="Webinar">Webinar</SelectItem>
                    <SelectItem value="Special Event">Special Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Event Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time *</Label>
                <Input
                  id="edit-time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (₹)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: Event['status']) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-benefits">Benefits (comma-separated)</Label>
              <Textarea
                id="edit-benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#610981' }}
              />
              <Label htmlFor="edit-featured" className="cursor-pointer">Mark as Featured Event</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateEvent} style={{ backgroundColor: '#610981' }}>
              Update Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Event details and registration information</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6 py-4">
              <div className="relative h-64 rounded-xl overflow-hidden">
                <img 
                  src={selectedEvent.image} 
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge 
                    style={{ backgroundColor: getEventTypeColor(selectedEvent.type), color: 'white' }}
                  >
                    {selectedEvent.type}
                  </Badge>
                  {selectedEvent.featured && (
                    <Badge className="bg-yellow-500 text-white">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-purple-50 border-2 border-purple-100">
                  <Calendar className="w-6 h-6 mb-2" style={{ color: '#610981' }} />
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="font-semibold">{new Date(selectedEvent.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 border-2 border-orange-100">
                  <Clock className="w-6 h-6 mb-2" style={{ color: '#ff691d' }} />
                  <p className="text-xs text-muted-foreground mb-1">Time</p>
                  <p className="font-semibold">{selectedEvent.time}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border-2 border-green-100">
                  <CalendarDays className="w-6 h-6 mb-2 text-green-600" />
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="font-semibold">{selectedEvent.duration}</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-50 border-2 border-yellow-100">
                  <Users className="w-6 h-6 mb-2 text-yellow-600" />
                  <p className="text-xs text-muted-foreground mb-1">Registrations</p>
                  <p className="font-semibold">{selectedEvent.registered}/{selectedEvent.capacity}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2" style={{ color: '#ff691d' }}>Description</h4>
                <p className="text-muted-foreground leading-relaxed">{selectedEvent.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2" style={{ color: '#ff691d' }}>Instructor</h4>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                  <div className="p-3 rounded-full" style={{ backgroundColor: '#610981' }}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedEvent.instructor}</p>
                    <p className="text-sm text-muted-foreground">Expert Yoga Instructor</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-2" style={{ color: '#ff691d' }}>Location</h4>
                <div className="flex items-center gap-2 p-4 rounded-lg bg-gray-50">
                  {selectedEvent.location.includes('Online') ? (
                    <Video className="w-5 h-5" style={{ color: '#610981' }} />
                  ) : (
                    <MapPin className="w-5 h-5" style={{ color: '#610981' }} />
                  )}
                  <span className="font-medium">{selectedEvent.location}</span>
                </div>
              </div>

              {selectedEvent.benefits.length > 0 && (
                <div>
                  <h4 className="font-semibold text-lg mb-3" style={{ color: '#ff691d' }}>Benefits & Inclusions</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedEvent.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
                        <div className="p-1 rounded-full bg-green-500 shrink-0">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-green-900">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Event Price</p>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-6 h-6" style={{ color: '#ff691d' }} />
                    <span className="text-3xl font-bold" style={{ color: '#ff691d' }}>
                      {selectedEvent.price === 0 ? 'Free' : selectedEvent.price.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge 
                    className="text-sm"
                    style={{ 
                      backgroundColor: selectedEvent.status === 'Registering' ? '#10b981' : '#64748b',
                      color: 'white'
                    }}
                  >
                    {selectedEvent.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
 
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="py-4">
              <p className="font-semibold">{selectedEvent.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedEvent.registered} users have already registered for this event.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteEvent}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
