import React, { useState, useEffect } from 'react';
import { ReportsPage } from './admin/ReportsPage';
import { CaseReport } from '../types';
import { ReportExportPanel } from './ReportExportPanel';
import { HeartHandshake, LogOut, Users, FileText, Calendar, Search, Plus, Edit, Key, User as UserIcon, Trash2, ClipboardList, Save, X, Menu } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface CounselorSchedule {
  id: number;
  counselorId: number;
  counselorName: string;
  weekStartDate: string;
  weekEndDate: string;
  availableSlots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
  }>;
}

interface ExternalCounselor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
}

interface SystemAdministratorProps {
  reports: CaseReport[];
  authUser: { role: string };
  onLogout: () => void;
  onExport?: (params: { startDate: string; endDate: string; category: string; format: 'html' | 'pdf'; type?: string }) => Promise<void>;
}

export function SystemAdministrator({ reports, authUser, onLogout, onExport }: SystemAdministratorProps) {
  const isAdmin = authUser.role === 'system_administrator';
  const [activeTab, setActiveTab] = useState<'users' | 'schedules' | 'external' | 'cases' | 'reports' | 'reportsPage'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<CounselorSchedule[]>([]);
  const [externalCounselors, setExternalCounselors] = useState<ExternalCounselor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileTabMenuOpen, setMobileTabMenuOpen] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddExternalModal, setShowAddExternalModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scheduleLoadError, setScheduleLoadError] = useState<string | null>(null);
  const [externalLoadError, setExternalLoadError] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<CounselorSchedule | null>(null);
  const [savingScheduleId, setSavingScheduleId] = useState<number | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    loadUsers();
    loadSchedules();
    loadExternalCounselors();
  }, []);

  const tabOptions = [
    { value: 'users', label: 'Users', icon: Users },
    { value: 'schedules', label: 'Counselor Schedules', icon: ClipboardList },
    { value: 'external', label: 'External Counselors', icon: Users },
    { value: 'cases', label: `Cases (${reports.length})`, icon: FileText },
    { value: 'reports', label: 'Reports', icon: Calendar },
  ] as const;

  const activeTabLabel = tabOptions.find((tab) => tab.value === activeTab)?.label ?? 'Users';

  const normalizeScheduleSlot = (slot: any) => ({
    dayOfWeek: Number(slot.dayOfWeek ?? slot.day_of_week ?? 0),
    startTime: String(slot.startTime ?? slot.start_time ?? '09:00'),
    endTime: String(slot.endTime ?? slot.end_time ?? '17:00'),
    slotDuration: Number(slot.slotDuration ?? slot.slot_duration ?? 60),
  });

  const normalizeSchedule = (item: any): CounselorSchedule => ({
    id: item.id,
    counselorId: item.counselor_id,
    counselorName: item.counselor_name || item.counselor?.name || 'Unknown',
    weekStartDate: item.week_start_date,
    weekEndDate: item.week_end_date,
    availableSlots: Array.isArray(item.available_slots)
      ? item.available_slots.map(normalizeScheduleSlot)
      : [],
  });

  const loadSchedules = async () => {
    setScheduleLoadError(null);
    try {
      const response = await fetch('/api/counselor-schedules', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Unable to load schedules' }));
        throw new Error(payload.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setSchedules(data.map(normalizeSchedule));
    } catch (error: any) {
      console.error('Unable to load schedules', error);
      setSchedules([]);
      setScheduleLoadError(error?.message ?? 'Unable to load schedules.');
    }
  };

  const loadExternalCounselors = async () => {
    setExternalLoadError(null);
    try {
      const response = await fetch('/api/external-counselors', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Unable to load external counselors' }));
        throw new Error(payload.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setExternalCounselors(data.map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        organization: item.organization,
        notes: item.notes,
      })));
    } catch (error: any) {
      console.error('Unable to load external counselors', error);
      setExternalCounselors([]);
      setExternalLoadError(error?.message ?? 'Unable to load external counselors.');
    }
  };

  const loadUsers = async () => {
    setLoadError(null);

    try {
      const response = await fetch('/api/users', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Unable to load users' }));
        throw new Error(payload.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.map((u: any) => ({
        id: u.id,
        name: u.name ?? `${u.first_name ?? ''} ${u.surname ?? ''}`.trim(),
        email: u.email,
        role: u.role,
        createdAt: u.created_at || u.createdAt || null,
      })));
    } catch (error: any) {
      console.error('Unable to load users', error);
      setUsers([]);
      setLoadError(error?.message ?? 'Unable to load users.');
    }
  };

  const handleSaveUser = async (user: User) => {
    if (!user.id) return;
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
      setEditingUser(null);
    } catch (error) {
      console.error('Unable to save user', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Unable to delete user', error);
    }
  };

  const handleChangeUserPassword = async (userId: number, newPassword: string) => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ password: newPassword }),
      });
    } catch (error) {
      console.error('Unable to change user password', error);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      await fetch(`/api/counselor-schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId));
    } catch (error) {
      console.error('Unable to delete schedule', error);
    }
  };

  const handleStartEditingSchedule = (schedule: CounselorSchedule) => {
    setEditingSchedule({
      ...schedule,
      availableSlots: schedule.availableSlots.map((slot) => ({ ...slot })),
    });
  };

  const updateEditingSchedule = (updater: (schedule: CounselorSchedule) => CounselorSchedule) => {
    setEditingSchedule((prev) => (prev ? updater(prev) : prev));
  };

  const handleSaveSchedule = async () => {
    if (!editingSchedule) return;

    setSavingScheduleId(editingSchedule.id);
    try {
      const response = await fetch(`/api/counselor-schedules/${editingSchedule.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          counselor_id: editingSchedule.counselorId,
          week_start_date: editingSchedule.weekStartDate,
          week_end_date: editingSchedule.weekEndDate,
          available_slots: editingSchedule.availableSlots.map((slot) => ({
            day_of_week: slot.dayOfWeek,
            start_time: slot.startTime,
            end_time: slot.endTime,
            slot_duration: slot.slotDuration,
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: 'Unable to update schedule' }));
        throw new Error(payload.message || `HTTP ${response.status}`);
      }

      const payload = await response.json();
      const normalized = normalizeSchedule(payload);
      setSchedules((prev) => prev.map((schedule) => (schedule.id === editingSchedule.id ? {
        ...schedule,
        counselorId: normalized.counselorId,
        counselorName: normalized.counselorName,
        weekStartDate: normalized.weekStartDate,
        weekEndDate: normalized.weekEndDate,
        availableSlots: normalized.availableSlots,
      } : schedule)));
      setEditingSchedule(null);
    } catch (error: any) {
      console.error('Unable to save schedule', error);
      setScheduleLoadError(error?.message ?? 'Unable to save schedule.');
    } finally {
      setSavingScheduleId(null);
    }
  };

  const handleSlotChange = (slotIndex: number, field: 'dayOfWeek' | 'startTime' | 'endTime' | 'slotDuration', value: string | number) => {
    updateEditingSchedule((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.map((slot, index) => (index === slotIndex
        ? {
            ...slot,
            [field]: field === 'dayOfWeek' || field === 'slotDuration' ? Number(value) : String(value),
          }
        : slot)),
    }));
  };

  const handleDeleteExternalCounselor = async (counselorId: number) => {
    try {
      await fetch(`/api/external-counselors/${counselorId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      setExternalCounselors((prev) => prev.filter((c) => c.id !== counselorId));
    } catch (error) {
      console.error('Unable to delete external counselor', error);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rolePriority: Record<string, number> = {
    system_administrator: 0,
    admin: 0,
    registrar: 1,
    iic: 2,
    counselor: 3,
    external_counselor: 4,
    dean: 5,
    disciplinary_committee: 6,
  };

  const orderedUsers = [...filteredUsers].sort((a, b) => {
    const priorityA = rolePriority[a.role] ?? 99;
    const priorityB = rolePriority[b.role] ?? 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <HeartHandshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">CareBridge</p>
              <p className="text-xs text-muted-foreground">System Administration</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">System Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users, view case statistics, and generate monthly reports.</p>
        </div>

        <div className="mb-6">
          <div className="hidden md:flex border-b border-border">
            {tabOptions.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-3 border-b-2 text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileTabMenuOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
            >
              <span className="flex items-center gap-2">
                <Menu className="w-4 h-4" />
                {activeTabLabel}
              </span>
              <span className="text-xs text-muted-foreground">Menu</span>
            </button>

            {mobileTabMenuOpen && (
              <div className="mt-2 space-y-1 rounded-lg border border-border bg-card p-2 shadow-sm">
                {tabOptions.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.value);
                        setMobileTabMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border border-border bg-transparent text-sm"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {loadError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 mb-4">
                <p className="font-semibold">Unable to load users</p>
                <p>{loadError}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  This is likely caused by an authentication or backend error. Confirm the backend is running and your session is valid.
                </p>
              </div>
            )}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Created On</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedUsers.map((user, index) => (
                    <tr key={user.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{user.role}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setPasswordUser(user)}
                            className="text-amber-600 hover:text-amber-700"
                            title="Reset / change password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Counselor Schedules</h2>
                <p className="text-sm text-muted-foreground">View and manage counselor availability schedules.</p>
              </div>
              <button
                onClick={() => setShowAddScheduleModal(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Schedule
              </button>
            </div>
            {scheduleLoadError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <p className="font-semibold">Unable to load schedules</p>
                <p>{scheduleLoadError}</p>
              </div>
            )}
            {schedules.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                No schedules available.
              </div>
            ) : (
              <div className="overflow-x-auto bg-card rounded-xl border border-border">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Counselor</th>
                      <th className="px-4 py-3">Week Start</th>
                      <th className="px-4 py-3">Week End</th>
                      <th className="px-4 py-3">Slots</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((schedule) => {
                      const isEditing = editingSchedule?.id === schedule.id;
                      const currentSchedule = isEditing ? editingSchedule : schedule;

                      return (
                        <tr key={schedule.id} className="border-b border-border last:border-b-0 align-top">
                          <td className="px-4 py-3">
                            {isEditing && currentSchedule ? (
                              <select
                                value={currentSchedule.counselorId}
                                onChange={(e) => updateEditingSchedule((prev) => ({ ...prev, counselorId: Number(e.target.value) }))}
                                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                              >
                                {users.filter((user) => user.role === 'counselor').map((user) => (
                                  <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-sm font-medium text-foreground">{schedule.counselorName}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing && currentSchedule ? (
                              <input
                                type="date"
                                value={currentSchedule.weekStartDate}
                                onChange={(e) => updateEditingSchedule((prev) => ({ ...prev, weekStartDate: e.target.value }))}
                                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                              />
                            ) : (
                              <div className="text-sm text-muted-foreground">{schedule.weekStartDate}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing && currentSchedule ? (
                              <input
                                type="date"
                                value={currentSchedule.weekEndDate}
                                onChange={(e) => updateEditingSchedule((prev) => ({ ...prev, weekEndDate: e.target.value }))}
                                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                              />
                            ) : (
                              <div className="text-sm text-muted-foreground">{schedule.weekEndDate}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing && currentSchedule ? (
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={() => updateEditingSchedule((prev) => ({
                                    ...prev,
                                    availableSlots: [
                                      ...prev.availableSlots,
                                      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 60 },
                                    ],
                                  }))}
                                  className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                                >
                                  Add slot
                                </button>
                                <div className="space-y-2">
                                  {currentSchedule.availableSlots.map((slot, slotIndex) => (
                                    <div key={`${schedule.id}-${slotIndex}`} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2">
                                      <select
                                        value={slot.dayOfWeek}
                                        onChange={(e) => handleSlotChange(slotIndex, 'dayOfWeek', e.target.value)}
                                        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs"
                                      >
                                        <option value={1}>Monday</option>
                                        <option value={2}>Tuesday</option>
                                        <option value={3}>Wednesday</option>
                                        <option value={4}>Thursday</option>
                                        <option value={5}>Friday</option>
                                        <option value={6}>Saturday</option>
                                        <option value={0}>Sunday</option>
                                      </select>
                                      <input
                                        type="number"
                                        min={15}
                                        value={slot.slotDuration}
                                        onChange={(e) => handleSlotChange(slotIndex, 'slotDuration', e.target.value)}
                                        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs"
                                      />
                                      <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) => handleSlotChange(slotIndex, 'startTime', e.target.value)}
                                        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs"
                                      />
                                      <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) => handleSlotChange(slotIndex, 'endTime', e.target.value)}
                                        className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {schedule.availableSlots.length > 0 ? schedule.availableSlots.map((slot) => `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][slot.dayOfWeek ?? 0]} ${slot.startTime}-${slot.endTime}`).join(' • ') : 'No slots'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleSaveSchedule}
                                  disabled={savingScheduleId === schedule.id}
                                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                                >
                                  <Save className="h-4 w-4" />
                                  {savingScheduleId === schedule.id ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSchedule(null)}
                                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStartEditingSchedule(schedule)}
                                  className="text-primary hover:text-primary/80"
                                  title="Edit schedule"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="text-rose-600 hover:text-rose-700"
                                  title="Delete schedule"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'external' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">External Counselors</h2>
                <p className="text-sm text-muted-foreground">Manage external counselor contacts and referral details.</p>
              </div>
              <button
                onClick={() => setShowAddExternalModal(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Counselor
              </button>
            </div>
            {externalLoadError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <p className="font-semibold">Unable to load external counselors</p>
                <p>{externalLoadError}</p>
              </div>
            )}
            {externalCounselors.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                No external counselors found.
              </div>
            ) : (
              <div className="space-y-3">
                {externalCounselors.map((counselor) => (
                  <div key={counselor.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{counselor.name}</p>
                        <p className="text-xs text-muted-foreground">{counselor.email || 'No email provided'}</p>
                        <p className="text-xs text-muted-foreground">{counselor.phone || 'No phone provided'}</p>
                        <p className="text-xs text-muted-foreground">{counselor.organization || 'No organization provided'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteExternalCounselor(counselor.id)}
                          className="text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {counselor.notes && (
                      <p className="mt-3 text-xs text-muted-foreground">Notes: {counselor.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-2xl font-bold text-foreground">{reports.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Cases</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-2xl font-bold text-foreground">
                  {reports.filter((r) => r.status === 'submitted').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Submitted</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-2xl font-bold text-foreground">
                  {reports.filter((r) => r.status === 'under_review').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Under Review</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-2xl font-bold text-foreground">
                  {reports.filter((r) => r.status === 'verdict_served' || r.status === 'appealed').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Closed / Final</p>
              </div>
            </div>
            {reports.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                No cases found.
              </div>
            ) : (
              <div className="overflow-x-auto bg-card rounded-xl border border-border">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/20 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 border-b border-border">No.</th>
                      <th className="px-4 py-3 border-b border-border">Case Number</th>
                      <th className="px-4 py-3 border-b border-border">Title</th>
                      <th className="px-4 py-3 border-b border-border">Status</th>
                      <th className="px-4 py-3 border-b border-border">Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report, index) => (
                      <tr key={report.id} className="border-b border-border last:border-b-0 hover:bg-muted/10">
                        <td className="px-4 py-3 text-sm text-foreground">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{report.ticketNumber || report.id}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{report.subject || report.description || 'Untitled case'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{report.status}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && onExport && (
          <div className="w-full">
            <ReportExportPanel
              availableCategories={[...new Set(reports.map((report) => report.category).filter(Boolean))] as string[]}
              onExport={onExport}
              initialMonth={new Date().toISOString().slice(0, 7)}
              defaultType="case-reports"
              typeOptions={[
                { value: 'case-reports', label: 'Case reports' },
                { value: 'user-activity', label: 'User activity' },
              ]}
            />
          </div>
        )}

        {activeTab === 'reportsPage' && (
          <div>
            <ReportsPage />
          </div>
        )}
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onAdded={loadUsers}
        />
      )}
      {passwordUser && (
        <ChangePasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onSave={async (newPassword) => {
            await handleChangeUserPassword(passwordUser.id, newPassword);
            setPasswordUser(null);
          }}
        />
      )}
      {showAddScheduleModal && (
        <AddScheduleModal
          users={users}
          onClose={() => setShowAddScheduleModal(false)}
          onAdded={() => {
            loadSchedules();
            setShowAddScheduleModal(false);
          }}
        />
      )}
      {showAddExternalModal && (
        <AddExternalCounselorModal
          onClose={() => setShowAddExternalModal(false)}
          onAdded={() => {
            loadExternalCounselors();
            setShowAddExternalModal(false);
          }}
        />
      )}
    </div>
  );
}

function EditUserModal({ user, onSave, onClose }: { user: User; onSave: (u: User) => void; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, name, email, role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            >
              <option value="student">Student</option>
              <option value="counselor">Counselor</option>
              <option value="dean">Dean</option>
              <option value="iic">IIC</option>
              <option value="registrar">Registrar</option>
              <option value="disciplinary_committee">Disciplinary Committee</option>
              <option value="external_counselor">External Counselor</option>
              <option value="system_administrator">System Administrator</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (newPassword: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    await onSave(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Reset Password for {user.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Save Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddUserModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {}),
        },
        body: JSON.stringify({
          name,
          email: email.toLowerCase(),
          password,
          role,
          has_ongoing_case: false,
        }),
      });
      onAdded();
      onClose();
    } catch (error) {
      console.error('Unable to add user', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Add User</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            >
              <option value="student">Student</option>
              <option value="counselor">Counselor</option>
              <option value="dean">Dean</option>
              <option value="iic">IIC</option>
              <option value="registrar">Registrar</option>
              <option value="disciplinary_committee">Disciplinary Committee</option>
              <option value="external_counselor">External Counselor</option>
              <option value="system_administrator">System Administrator</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddScheduleModal({ users, onClose, onAdded }: { users: User[]; onClose: () => void; onAdded: () => void }) {
  const counselors = users.filter((user) => user.role === 'counselor');
  const [counselorId, setCounselorId] = useState(counselors[0]?.id ?? 0);
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState(60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/counselor-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {}),
        },
        body: JSON.stringify({
          counselor_id: counselorId,
          week_start_date: weekStartDate,
          week_end_date: weekEndDate,
          available_slots: [
            {
              day_of_week: dayOfWeek,
              start_time: startTime,
              end_time: endTime,
              slot_duration: slotDuration,
            },
          ],
        }),
      });
      onAdded();
    } catch (error) {
      console.error('Unable to add schedule', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Add Counselor Schedule</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Counselor</label>
            <select
              value={counselorId}
              onChange={(e) => setCounselorId(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            >
              {counselors.length === 0 ? (
                <option value={0}>No counselors available</option>
              ) : (
                counselors.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Week Start</label>
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Week End</label>
            <input
              type="date"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={0}>Sunday</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Slot Duration</label>
              <input
                type="number"
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
                min={15}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              disabled={counselors.length === 0}
            >
              Create Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddExternalCounselorModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/external-counselors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          organization,
          notes,
        }),
      });
      onAdded();
    } catch (error) {
      console.error('Unable to add external counselor', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Add External Counselor</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Organization</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Create Counselor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
