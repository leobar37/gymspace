# Staff Management

The Staff module provides employee management capabilities including roles, schedules, and permissions.

## Staff Object

```typescript
interface Staff {
  id: string;
  userId: string;
  gymId: string;
  employeeId: string;
  role: 'admin' | 'manager' | 'trainer' | 'receptionist' | 'maintenance';
  department?: string;
  position: string;
  employmentType: 'full_time' | 'part_time' | 'contractor';
  startDate: Date;
  endDate?: Date;
  salary?: number;
  hourlyRate?: number;
  status: 'active' | 'inactive' | 'on_leave';
  permissions: string[];
  schedule?: Schedule;
  createdAt: Date;
  updatedAt: Date;
}

interface Schedule {
  type: 'fixed' | 'flexible' | 'shift';
  weeklyHours: number;
  shifts?: Shift[];
}
```

## List Staff

```typescript
// List all staff
const { data: staff, meta } = await sdk.staff.list({
  page: 1,
  limit: 20,
  role: 'trainer',
  status: 'active',
  department: 'fitness'
});

// Search staff
const results = await sdk.staff.search({
  query: 'john',
  filters: {
    roles: ['trainer', 'manager'],
    employmentType: 'full_time',
    hasPermission: 'CLASSES_MANAGE'
  }
});
```

## Get Staff Member

```typescript
// Get by ID
const staffMember = await sdk.staff.getById('staff-uuid');

// Get by employee ID
const staffMember = await sdk.staff.getByEmployeeId('EMP-001');

// Get with related data
const staffFull = await sdk.staff.getById('staff-uuid', {
  include: ['schedule', 'permissions', 'attendance']
});
```

## Create Staff Member

```typescript
const newStaff = await sdk.staff.create({
  userId: 'user-uuid',
  role: 'trainer',
  position: 'Senior Personal Trainer',
  department: 'fitness',
  employmentType: 'full_time',
  startDate: new Date(),
  hourlyRate: 25.00,
  permissions: [
    'CLASSES_MANAGE',
    'MEMBERS_VIEW',
    'SCHEDULE_MANAGE_OWN'
  ],
  schedule: {
    type: 'fixed',
    weeklyHours: 40,
    defaultShifts: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      // ... other days
    }
  }
});
```

## Update Staff Member

```typescript
const updated = await sdk.staff.update('staff-uuid', {
  position: 'Head Personal Trainer',
  hourlyRate: 30.00,
  permissions: [
    ...existingPermissions,
    'STAFF_VIEW',
    'REPORTS_VIEW'
  ]
});
```

## Staff Roles and Permissions

```typescript
// Get available roles
const roles = await sdk.staff.getRoles();

// Get role permissions
const permissions = await sdk.staff.getRolePermissions('trainer');

// Update staff permissions
await sdk.staff.updatePermissions('staff-uuid', {
  add: ['INVENTORY_MANAGE', 'REPORTS_CREATE'],
  remove: ['SCHEDULE_MANAGE_ALL']
});

// Check permission
const hasPermission = await sdk.staff.hasPermission(
  'staff-uuid',
  'CLASSES_MANAGE'
);
```

## Schedule Management

```typescript
// Get staff schedule
const schedule = await sdk.staff.getSchedule('staff-uuid', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

// Create shift
const shift = await sdk.staff.createShift('staff-uuid', {
  date: new Date('2024-01-15'),
  startTime: '09:00',
  endTime: '17:00',
  breakMinutes: 60,
  location: 'main-floor'
});

// Update shift
await sdk.staff.updateShift('shift-uuid', {
  endTime: '18:00',
  notes: 'Extended for special event'
});

// Delete shift
await sdk.staff.deleteShift('shift-uuid');

// Get available staff for time slot
const available = await sdk.staff.getAvailable({
  date: new Date('2024-01-15'),
  startTime: '14:00',
  endTime: '15:00',
  role: 'trainer'
});
```

## Time and Attendance

```typescript
// Clock in
const clockIn = await sdk.staff.clockIn('staff-uuid', {
  location: 'main-entrance',
  method: 'biometric'
});

// Clock out
const clockOut = await sdk.staff.clockOut('staff-uuid');

// Get attendance records
const attendance = await sdk.staff.getAttendance('staff-uuid', {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

// Get time summary
const summary = await sdk.staff.getTimeSummary('staff-uuid', {
  period: 'monthly',
  month: '2024-01'
});
// Returns: { regularHours: 160, overtime: 10, totalHours: 170 }
```

## Leave Management

```typescript
// Request leave
const leaveRequest = await sdk.staff.requestLeave('staff-uuid', {
  type: 'vacation',
  startDate: new Date('2024-02-01'),
  endDate: new Date('2024-02-07'),
  reason: 'Family vacation',
  coverageStaffId: 'other-staff-uuid'
});

// Get leave requests
const requests = await sdk.staff.getLeaveRequests({
  status: 'pending',
  staffId: 'staff-uuid'
});

// Approve leave
await sdk.staff.approveLeave('leave-request-uuid', {
  approvedBy: 'manager-uuid',
  notes: 'Approved. Coverage arranged.'
});

// Get leave balance
const balance = await sdk.staff.getLeaveBalance('staff-uuid');
// Returns: { vacation: 10, sick: 5, personal: 3 }
```

## Performance Management

```typescript
// Add performance review
const review = await sdk.staff.addPerformanceReview('staff-uuid', {
  reviewerId: 'manager-uuid',
  period: 'Q1 2024',
  ratings: {
    punctuality: 5,
    customerService: 4,
    teamwork: 5,
    technical: 4
  },
  comments: 'Excellent performance this quarter',
  goals: [
    'Complete advanced certification',
    'Mentor new trainers'
  ]
});

// Get performance history
const performance = await sdk.staff.getPerformanceHistory('staff-uuid');
```

## Staff Training

```typescript
// Record training
const training = await sdk.staff.recordTraining('staff-uuid', {
  title: 'CPR Certification',
  provider: 'Red Cross',
  completedDate: new Date(),
  expiryDate: new Date('2026-01-15'),
  certificateNumber: 'RC-123456'
});

// Get training records
const trainings = await sdk.staff.getTrainingRecords('staff-uuid');

// Get expiring certifications
const expiring = await sdk.staff.getExpiringCertifications({
  daysAhead: 60
});
```

## Payroll Integration

```typescript
// Get payroll data
const payroll = await sdk.staff.getPayrollData({
  staffId: 'staff-uuid',
  period: 'monthly',
  month: '2024-01'
});

// Export timesheet
const timesheet = await sdk.staff.exportTimesheet({
  staffIds: ['uuid1', 'uuid2'],
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  format: 'csv'
});
```