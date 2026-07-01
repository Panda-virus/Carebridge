import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Venus, Mars, BookOpen, GraduationCap, Shield, Save, Edit3, Trash2, AlertTriangle, X } from 'lucide-react';

interface ProfilePageProps {
  studentId: string;
  userName: string;
  userEmail: string;
  onSaveProfile: (profileData: ProfileData) => Promise<void>;
  onDeleteAccount?: () => Promise<void> | void;
}

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  gender: 'male' | 'female';
  program: string;
  level: string;
  emergencyContact: string;
}

export function ProfilePage({ studentId, userName, userEmail, onSaveProfile, onDeleteAccount }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: userName,
    email: userEmail,
    phone: '',
    location: '',
    gender: 'male',
    program: '',
    level: '',
    emergencyContact: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});

  useEffect(() => {
    // Load existing profile data if available
    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/students/${studentId}/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, [studentId]);

  const validate = () => {
    const e: Partial<Record<keyof ProfileData, string>> = {};
    if (!profileData.name.trim()) e.name = 'Name is required';
    if (!profileData.email.trim()) e.email = 'Email is required';
    if (!profileData.phone.trim()) e.phone = 'Phone number is required';
    if (!profileData.location.trim()) e.location = 'Location is required';
    if (!profileData.program.trim()) e.program = 'Program is required';
    if (!profileData.level.trim()) e.level = 'Level is required';
    if (!profileData.emergencyContact.trim()) e.emergencyContact = 'Emergency contact is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSaveProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Unable to delete your account right now.');
      }

      setShowDeleteDialog(false);
      await onDeleteAccount?.();
    } catch (error) {
      console.error('Failed to delete account:', error);
      setDeleteError(error instanceof Error ? error.message : 'Unable to delete your account right now.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="bg-card rounded-2xl border border-border shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">View and manage your personal information</p>
            </div>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${
                  errors.name ? 'border-destructive' : 'border-border'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="Enter your full name"
              />
            </div>
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${
                  errors.email ? 'border-destructive' : 'border-border'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="your@mzuni.ac.mw"
              />
            </div>
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${
                  errors.phone ? 'border-destructive' : 'border-border'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="0999000000"
              />
            </div>
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Location <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${
                  errors.location ? 'border-destructive' : 'border-border'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="On Campus / Off Campus"
              />
            </div>
            {errors.location && <p className="text-destructive text-xs mt-1">{errors.location}</p>}
          </div>

          {/* Gender Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Gender <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setProfileData({ ...profileData, gender: 'male' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-all ${
                      profileData.gender === 'male'
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Mars className="w-4 h-4" />
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileData({ ...profileData, gender: 'female' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-all ${
                      profileData.gender === 'female'
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Venus className="w-4 h-4" />
                    Female
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-input-background">
                  {profileData.gender === 'male' ? (
                    <Mars className="w-5 h-5 text-primary" />
                  ) : (
                    <Venus className="w-5 h-5 text-primary" />
                  )}
                  <span className="text-sm text-foreground capitalize">{profileData.gender}</span>
                </div>
              )}
            </div>
          </div>

          {/* Program Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Program <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={profileData.program}
                onChange={(e) => setProfileData({ ...profileData, program: e.target.value })}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${
                  errors.program ? 'border-destructive' : 'border-border'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="e.g., Bachelor of Education"
              />
            </div>
            {errors.program && <p className="text-destructive text-xs mt-1">{errors.program}</p>}
          </div>

          {/* Level Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Level <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={profileData.level}
                onChange={(e) => setProfileData({ ...profileData, level: e.target.value })}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${
                  errors.level ? 'border-destructive' : 'border-border'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="e.g., Year 2, Year 3"
              />
            </div>
            {errors.level && <p className="text-destructive text-xs mt-1">{errors.level}</p>}
          </div>

          {/* Emergency Contact Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Emergency Contact <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={profileData.emergencyContact}
                onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${
                  errors.emergencyContact ? 'border-destructive' : 'border-border'
                } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="Emergency contact number"
              />
            </div>
            {errors.emergencyContact && <p className="text-destructive text-xs mt-1">{errors.emergencyContact}</p>}
          </div>
        </div>

        <div className="p-6 border-t border-border space-y-4">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Deleting your account removes your sign-in and profile details. Any case reports you submitted will remain in the system, but they will no longer be linked to your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
            {deleteError && <p className="mt-3 text-sm text-destructive">{deleteError}</p>}
          </div>

          {isEditing && (
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 border border-border rounded-lg text-foreground hover:bg-accent/30 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Delete your account?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  This action cannot be undone. Your account and profile details will be removed, and your submitted case reports will remain available without an attached account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/40"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'YES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
