# TutorConnect - Complete User Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Test Accounts](#test-accounts)
- [Admin Features](#admin-features)
- [Tutor Features](#tutor-features)
- [Student Features](#student-features)
- [Common Features](#common-features)

## Getting Started

TutorConnect is a platform connecting students with qualified tutors. The platform supports three user roles: Admin, Tutor, and Student.

## Test Accounts

### Creating Test Accounts
Use the seed function to create test accounts:

**Endpoint:** `https://pttotqqkhaxozkrznsun.supabase.co/functions/v1/seed-test-users`

**Pre-configured Accounts:**
- **Admin:** tcadmin@gmail.com (Password: tutorconnect123)
- **Tutor:** tctutor@gmail.com (Password: tutorconnect123)
- **Student:** tcstudent@gmail.com (Password: tutorconnect123)

### Manual Registration
1. Navigate to `/auth`
2. Click "Sign Up"
3. Fill in:
   - Full Name
   - Email
   - Password
   - Select Role (Student/Tutor)
4. Click "Sign Up"

---

## Admin Features

### Accessing Admin Dashboard
1. Log in with admin credentials
2. Navigate to `/admin`
3. View the comprehensive admin dashboard

### User Management
**Location:** Admin Dashboard → Users Tab

**Features:**
- View all users with their details (name, email, role, join date)
- Edit user information:
  - Click "Edit" on any user
  - Update name and email
  - Save changes
- Change user roles:
  - Select new role from dropdown
  - Click "Update Role"
  - Roles: Student, Tutor, Admin
- Delete users:
  - Click "Delete" button
  - Confirm deletion

### Tutor Management
**Location:** Admin Dashboard → Tutors Tab

**Features:**
- View all tutor profiles
- Approve/unapprove tutors:
  - Toggle "is_approved" status
  - Only approved tutors appear in student search
- Edit tutor profiles:
  - Bio
  - Subjects (array)
  - Hourly rate
  - Save changes
- Monitor tutor ratings and reviews

### Booking Management
**Location:** Admin Dashboard → Bookings Tab

**Features:**
- View all bookings system-wide
- See booking details:
  - Student name
  - Tutor name
  - Date and time
  - Subject
  - Status (pending/confirmed/cancelled/completed)
  - Notes
- Delete bookings if needed

### Review Management
**Location:** Admin Dashboard → Reviews Tab

**Features:**
- View all reviews across platform
- See review details:
  - Student name
  - Tutor name
  - Rating (1-5 stars)
  - Comment
  - Date created
- Delete inappropriate reviews

### Certificate Management
**Location:** Admin Dashboard → Certificates Tab

**Features:**
- View all uploaded certificates
- Approve or reject certificates:
  - Click approve/reject button
  - Approval status updates tutor's verified status
- Delete certificates
- View certificate files

---

## Tutor Features

### Creating Tutor Profile
**First Time Setup:**
1. Log in with tutor account
2. Navigate to `/profile`
3. Fill in required information:
   - Full Name
   - Email
   - Phone Number
   - Bio (describe your teaching experience)
   - Subjects (add multiple subjects you teach)
   - Hourly Rate ($)
   - Gender
   - Years of Experience
   - Location
   - Languages Spoken
   - Education Level
   - Teaching Levels (what levels you teach)
   - Teaching Locations (online/in-person/hybrid)
   - Qualifications (detailed text, supports line breaks)
4. Upload Profile Picture:
   - Click "Upload Photo"
   - Select image (JPEG, PNG, GIF)
   - Max size: 5MB
5. Click "Save Changes"

**Note:** Wait for admin approval before appearing in student searches.

### Managing Profile
**Location:** `/profile`

**Update Information:**
- Edit any profile fields
- Update profile photo
- Modify qualifications
- Adjust hourly rate
- Update availability

### Setting Availability
**Location:** Profile → Availability Section

**Default Behavior:**
- If no availability set: 9 AM - 5 PM daily shown to students
- Students can book during default hours

**Custom Availability:**
1. Click on calendar dates
2. Set specific time slots
3. Mark unavailable dates
4. Save changes

### Upload Certificates
**Location:** Profile → Certificates Section

**Steps:**
1. Click "Upload Certificate"
2. Select PDF or image file
3. Upload (stored securely)
4. Wait for admin approval
5. Approved certificates show as "Verified Certificates" on public profile

### View Bookings
**Location:** `/dashboard` (Tutor Dashboard)

**Features:**
- See all your bookings
- Filter by status (upcoming/completed/cancelled)
- View booking details:
  - Student name
  - Date/time
  - Subject
  - Notes from student
- Accept/reject booking requests
- Cancel bookings (24+ hours before session)

### Manage Earnings
**Location:** `/earnings`

**Features:**
- View total earnings
- See payment history
- Track completed sessions
- Export financial reports

### Messaging
**Location:** Dashboard → Messages

**Features:**
- Receive messages from students
- Reply to inquiries
- Communicate about bookings
- Answer questions

---

## Student Features

### Finding Tutors
**Location:** `/tutors`

**Search & Filter:**
1. Use search bar to find tutors by name
2. Apply filters:
   - Subject
   - Price range
   - Rating
   - Availability
   - Location
3. Click "Clear Filters" to reset

**Browse Results:**
- View tutor cards with:
  - Profile photo
  - Name
  - Subjects taught
  - Hourly rate
  - Rating & reviews count
  - Experience years

### Viewing Tutor Profiles
**Access:** Click on any tutor card

**Profile Information:**
- Full bio
- Subjects expertise
- Hourly rate
- Contact information
- Experience and qualifications
- Education level
- Languages spoken
- Location and teaching preferences
- Verified certificates (if approved by admin)
- Student reviews
- Average rating

### Booking a Session
**From Tutor Profile:**
1. Scroll to "Book a Session" section
2. View tutor's availability calendar
3. Select available date
4. Choose time slot
5. Fill in booking form:
   - Subject
   - Any special notes/requests
6. Click "Book Session"
7. Wait for tutor confirmation

**Booking Rules:**
- Can only book available time slots
- Tutors must be approved by admin
- Cancellation allowed 24+ hours before session

### Managing Bookings
**Location:** `/dashboard` (Student Dashboard)

**Features:**
- View all your bookings
- Filter by status:
  - Pending (awaiting tutor confirmation)
  - Confirmed
  - Completed
  - Cancelled
- See booking details
- Cancel bookings (24+ hours notice required)
- Rate sessions after completion

### Leaving Reviews
**After Completed Session:**
1. Navigate to Dashboard
2. Find completed booking
3. Click "Leave Review"
4. Rate tutor (1-5 stars)
5. Write detailed comment
6. Submit review
7. Review appears on tutor profile

**Review Guidelines:**
- Be honest and constructive
- Focus on teaching quality
- Mention specific strengths/areas for improvement
- Reviews are public and help other students

### Student Profile
**Location:** `/profile`

**Manage:**
- Update personal information
- Change email
- Update contact details
- View booking history

### Messaging Tutors
**Location:** Dashboard → Messages

**Features:**
- Send messages to tutors
- Ask questions before booking
- Discuss session details
- Get booking confirmations

---

## Common Features

### Authentication
**Sign Up:**
- `/auth` → Sign Up tab
- Provide name, email, password, role
- Email verification may be required

**Sign In:**
- `/auth` → Sign In tab
- Enter email and password
- Access role-specific dashboard

**Sign Out:**
- Click profile icon (top right)
- Select "Sign Out"

### Navigation
**Main Menu:**
- Home (`/`)
- Find Tutors (`/tutors`)
- Dashboard (`/dashboard`)
- Profile (`/profile`)
- Admin (admin only) (`/admin`)
- Earnings (tutor only) (`/earnings`)

### Notifications
- Toast notifications for:
  - Successful actions
  - Errors
  - Important updates
  - Booking confirmations
  - Review submissions

### Real-time Updates
- Bookings update live
- Messages arrive in real-time
- Profile changes reflect immediately
- Admin changes sync across platform

---

## Technical Notes

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure file uploads to Supabase Storage
- Authentication via Supabase Auth

### File Storage
- Profile pictures: `certificates` bucket (public)
- Tutor resources: `resources` bucket (private)
- Certificates: `certificates` bucket with approval workflow

### Database
- Users → `profiles` table
- Roles → `user_roles` table (enum: admin, tutor, student)
- Tutors → `tutors` table
- Bookings → `bookings` table
- Reviews → `reviews` table
- Messages → `messages` table
- Certificates → `certificate_approvals` table
- Availability → `tutor_availability` table

### Default Behaviors
- New users: Student role by default
- Tutor availability: 9 AM - 5 PM if not set
- Tutor approval: Required before appearing in search
- Cancellation deadline: 24 hours before session

---

## Troubleshooting

### Profile Not Loading
- Check RLS policies
- Verify user is logged in
- Refresh page

### Can't Book Sessions
- Ensure tutor is approved
- Check if time slot is available
- Verify you're logged in as student

### Role Changes Not Working
- Admin must be logged in
- Check user_roles table exists
- Verify admin privileges

### Images Not Uploading
- Check file size (max 5MB)
- Verify file type (JPEG, PNG, GIF for photos)
- Ensure bucket permissions are correct

### Availability Not Showing
- Default 9 AM - 5 PM applies if not set
- Tutors must save availability
- Check tutor_availability table

---

## Support

For issues or questions:
1. Check console logs for errors
2. Review RLS policies
3. Verify Supabase connection
4. Check edge function logs

---

**Last Updated:** 2025-10-05
**Version:** 1.0.0
