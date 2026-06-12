import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Video, Upload, Calendar, Clock, CheckCircle, Edit, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

interface RecordedVideo {
  id: number;
  classTitle: string;
  instructor: string;
  recordedDate: string;
  duration: string;
  fileSize: string;
  status: 'pending' | 'published';
  thumbnail?: string;
  title?: string;
  description?: string;
  video: string;
}

export function OperationsRecordedClasses() {
  const [selectedVideo, setSelectedVideo] = useState<RecordedVideo | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: '',
    description: '',
    thumbnail: null as File | null,
  });

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    video: null as File | null,
    thumbnail: null as File | null,
    instructor: '',
    category: '',
    duration: '',
  });
 
  const recordedVideos: RecordedVideo[] = [
    {
      id: 1,
      classTitle: 'Morning Hatha Yoga - Level 1',
      instructor: 'Priya Sharma',
      recordedDate: 'Mar 11, 2026',
      duration: '60 min',
      fileSize: '2.4 GB',
      status: 'pending',
      video: 'https://example.com/video1.mp4',
    },
    {
      id: 2,
      classTitle: 'Vinyasa Flow - Intermediate',
      instructor: 'Rahul Mehta',
      recordedDate: 'Mar 11, 2026',
      duration: '45 min',
      fileSize: '1.8 GB',
      status: 'pending',
      video: 'https://example.com/video2.mp4',
    },
    {
      id: 3,
      classTitle: 'Evening Meditation & Pranayama',
      instructor: 'Anjali Desai',
      recordedDate: 'Mar 10, 2026',
      duration: '30 min',
      fileSize: '1.2 GB',
      status: 'published',
      title: 'Evening Meditation & Pranayama Session',
      description: 'A calming evening session focusing on breath work and meditation techniques.',
      thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400',
      video: 'https://example.com/video3.mp4',
    },
    {
      id: 4,
      classTitle: 'Power Yoga - Advanced',
      instructor: 'Vikram Singh',
      recordedDate: 'Mar 10, 2026',
      duration: '55 min',
      fileSize: '2.2 GB',
      status: 'pending',
      video: 'https://example.com/video4.mp4',
    },
    {
      id: 5,
      classTitle: 'Gentle Yoga for Beginners',
      instructor: 'Priya Sharma',
      recordedDate: 'Mar 09, 2026',
      duration: '40 min',
      fileSize: '1.6 GB',
      status: 'published',
      title: 'Gentle Yoga - Perfect for Beginners',
      description: 'An introductory session covering basic yoga poses and breathing techniques.',
      thumbnail: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400',
      video: 'https://example.com/video5.mp4',
    },
  ];

  const handlePublishClick = (video: RecordedVideo) => {
    console.log('Publish clicked for video:', video);
    setSelectedVideo(video);
    setPublishForm({
      title: video.title || video.classTitle,
      description: video.description || '',
      thumbnail: null,
    });
    setShowPublishDialog(true);
    console.log('Dialog should open now');
  };

  const handlePublish = () => {
    console.log('Publishing video:', selectedVideo);
    toast.success('Recording published successfully!');
    setShowPublishDialog(false);
    setSelectedVideo(null);
  };

  const handleUploadSelfPaced = () => {
    if (!uploadForm.title || !uploadForm.description || !uploadForm.video || !uploadForm.thumbnail) {
      toast.error('Please fill in all required fields');
      return;
    }
    console.log('Uploading self-paced class:', uploadForm);
    toast.success('Self-paced class uploaded successfully!');
    setShowUploadDialog(false);
    setUploadForm({
      title: '',
      description: '',
      video: null,
      thumbnail: null,
      instructor: '',
      category: '',
      duration: '',
    });
  };

  const pendingCount = recordedVideos.filter(v => v.status === 'pending').length;
  const publishedCount = recordedVideos.filter(v => v.status === 'published').length;
  const totalSize = recordedVideos.reduce((sum, v) => {
    const size = parseFloat(v.fileSize);
    return sum + size;
  }, 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
              Recorded Classes
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and publish recorded class videos from the last 3 days
            </p>
          </div>
          <Button
            style={{ backgroundColor: '#610981', color: 'white' }}
            onClick={() => setShowUploadDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Self-Paced Class
          </Button>
        </div>
 
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff691d]/10 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Recordings</p>
                  <p className="text-3xl font-bold mt-2">{recordedVideos.length}</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: '#ff691d20' }}>
                  <Video className="w-6 h-6" style={{ color: '#ff691d' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/10 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-3xl font-bold mt-2">{pendingCount}</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: '#f59e0b20' }}>
                  <Clock className="w-6 h-6" style={{ color: '#f59e0b' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/10 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-3xl font-bold mt-2">{publishedCount}</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: '#10b98120' }}>
                  <CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#610981]/10 rounded-full blur-2xl" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-3xl font-bold mt-2">{totalSize.toFixed(1)} GB</p>
                </div>
                <div className="p-3 rounded-full" style={{ backgroundColor: '#61098120' }}>
                  <Upload className="w-6 h-6" style={{ color: '#610981' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
 
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffac96]/5 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle style={{ color: '#ff691d' }}>Recent Recorded Classes</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Showing recordings from the last 3 days
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                Last 3 Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                      Class Details
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                      Instructor
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                      Recorded Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                      Duration
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                      File Size
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recordedVideos.map((video) => (
                    <tr key={video.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {video.thumbnail ? (
                              <img
                                src={video.thumbnail}
                                alt={video.classTitle}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: '#61098120' }}
                              >
                                <Video className="w-8 h-8" style={{ color: '#610981' }} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{video.classTitle}</p>
                            {video.title && video.title !== video.classTitle && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Published as: {video.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">{video.instructor}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {video.recordedDate}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">{video.duration}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium">{video.fileSize}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          style={{
                            backgroundColor:
                              video.status === 'published' ? '#10b98120' : '#f59e0b20',
                            color: video.status === 'published' ? '#10b981' : '#f59e0b',
                          }}
                        >
                          {video.status === 'published' ? 'Published' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {video.status === 'pending' ? (
                            <Button
                              size="sm"
                              style={{ backgroundColor: '#610981', color: 'white' }}
                              onClick={() => handlePublishClick(video)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Publish
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePublishClick(video)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
 
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle style={{ color: '#ff691d' }}>
                {selectedVideo?.status === 'published' ? 'View' : 'Publish'} Recording
              </DialogTitle>
              <DialogDescription>
                {selectedVideo?.status === 'published'
                  ? 'View the published recording details'
                  : 'Add title, description, and thumbnail to publish this recording'}
              </DialogDescription>
            </DialogHeader>

            {selectedVideo && (
              <div className="space-y-4">
                {/* Video Preview */}
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                  {publishForm.thumbnail || selectedVideo.thumbnail ? (
                    <img
                      src={
                        publishForm.thumbnail
                          ? URL.createObjectURL(publishForm.thumbnail)
                          : selectedVideo.thumbnail
                      }
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
                      <p className="text-white text-sm font-medium">
                        {selectedVideo.classTitle}
                      </p>
                      <p className="text-white/70 text-xs mt-1">
                        {selectedVideo.instructor} • {selectedVideo.duration} • {selectedVideo.recordedDate}
                      </p>
                    </div>
                  </div>
                </div>
 
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Recording Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={publishForm.title}
                      onChange={(e) =>
                        setPublishForm({ ...publishForm, title: e.target.value })
                      }
                      placeholder="Enter a descriptive title for the recording"
                      disabled={selectedVideo.status === 'published'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="description"
                      value={publishForm.description}
                      onChange={(e) =>
                        setPublishForm({ ...publishForm, description: e.target.value })
                      }
                      placeholder="Describe what sādhakas will learn in this session..."
                      className="w-full min-h-25 px-3 py-2 rounded-md border border-input bg-background"
                      disabled={selectedVideo.status === 'published'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">
                      Thumbnail Image <span className="text-red-500">*</span>
                    </Label>
                    {selectedVideo.status === 'pending' ? (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id="thumbnail"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPublishForm({ ...publishForm, thumbnail: file });
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="thumbnail"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {publishForm.thumbnail
                              ? publishForm.thumbnail.name
                              : 'Click to upload thumbnail (JPG, PNG)'}
                          </p>
                        </label>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Thumbnail is already uploaded
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">File Size</p>
                      <p className="font-medium mt-1">{selectedVideo.fileSize}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium mt-1">{selectedVideo.duration}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPublishDialog(false);
                  setSelectedVideo(null);
                }}
              >
                Cancel
              </Button>
              {selectedVideo?.status === 'pending' && (
                <Button
                  style={{ backgroundColor: '#610981', color: 'white' }}
                  onClick={handlePublish}
                >
                  Publish Recording
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
 
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle style={{ color: '#ff691d' }}>
                Create Self-Paced Class
              </DialogTitle>
              <DialogDescription>
                Upload a new self-paced class for students to access anytime
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
 
              <div className="space-y-2">
                <Label htmlFor="upload-video">
                  Class Video <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="upload-video"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadForm({ ...uploadForm, video: file });
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="upload-video"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Video className="w-10 h-10 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {uploadForm.video
                        ? uploadForm.video.name
                        : 'Click to upload video file'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: MP4, MOV, AVI (Max 5GB)
                    </p>
                  </label>
                </div>
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="upload-thumbnail">
                  Thumbnail Image <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  <input
                    type="file"
                    id="upload-thumbnail"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadForm({ ...uploadForm, thumbnail: file });
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="upload-thumbnail"
                    className="cursor-pointer flex items-center gap-4"
                  >
                    {uploadForm.thumbnail ? (
                      <img
                        src={URL.createObjectURL(uploadForm.thumbnail)}
                        alt="Thumbnail preview"
                        className="w-32 h-20 rounded object-cover"
                      />
                    ) : (
                      <div className="w-32 h-20 rounded bg-gray-100 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {uploadForm.thumbnail
                          ? uploadForm.thumbnail.name
                          : 'Click to upload thumbnail'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 1280x720px (16:9 ratio)
                      </p>
                    </div>
                  </label>
                </div>
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="upload-title">
                  Class Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="upload-title"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  placeholder="e.g., Complete Vinyasa Flow for Beginners"
                />
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="upload-description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="upload-description"
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, description: e.target.value })
                  }
                  placeholder="Describe what sādhakas will learn, the benefits, and what to expect..."
                  className="w-full min-h-30 px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
 
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-instructor">Instructor Name</Label>
                  <Input
                    id="upload-instructor"
                    value={uploadForm.instructor}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, instructor: e.target.value })
                    }
                    placeholder="e.g., Priya Sharma"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-category">Category</Label>
                  <Input
                    id="upload-category"
                    value={uploadForm.category}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, category: e.target.value })
                    }
                    placeholder="e.g., Vinyasa Flow, Hatha"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-duration">Duration</Label>
                <Input
                  id="upload-duration"
                  value={uploadForm.duration}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, duration: e.target.value })
                  }
                  placeholder="e.g., 45 minutes"
                />
              </div>
 
              {(uploadForm.title || uploadForm.thumbnail) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <div className="flex gap-3">
                    {uploadForm.thumbnail && (
                      <img
                        src={URL.createObjectURL(uploadForm.thumbnail)}
                        alt="Preview"
                        className="w-24 h-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{uploadForm.title || 'Untitled'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadForm.instructor && `${uploadForm.instructor} • `}
                        {uploadForm.duration || 'Duration not set'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  setUploadForm({
                    title: '',
                    description: '',
                    video: null,
                    thumbnail: null,
                    instructor: '',
                    category: '',
                    duration: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                style={{ backgroundColor: '#610981', color: 'white' }}
                onClick={handleUploadSelfPaced}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}