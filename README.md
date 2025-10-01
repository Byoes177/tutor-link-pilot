# TutorConnect - Brunei Tutoring Marketplace Prototype

## 📝 Overview

TutorConnect is a high-fidelity prototype of a Brunei-centric online tutoring marketplace. This demo showcases the complete user flows for students/parents discovering tutors, tutors managing their profiles, and administrators overseeing platform operations.

**⚠️ Important**: This is a **prototype** (not production-ready). Payment and email integrations are mocked for demonstration purposes.

---

## 🚀 Quick Start

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

### Test Accounts

Create these test accounts through the sign-up flow at `/auth`:

#### Admin Account
- **Email**: admin@tutorconnect.com
- **Password**: admin123
- **Role**: Admin

#### Student Account
- **Name**: Hisyam Rukh
- **Email**: hisyam@student.com
- **Password**: test123
- **Role**: Student
- **Persona**: UBD student needing affordable A-Level tutoring

#### Parent Account
- **Name**: Rakiz Qu'qin
- **Email**: rakiz@parent.com
- **Password**: test123
- **Role**: Student
- **Persona**: Parent looking for O-Level Science tutor for daughter

#### Tutor Accounts

**Saimon Barry**
- **Email**: saimon@tutor.com
- **Password**: test123
- **Subjects**: Math (A Level), Physics
- **Rate**: $25/hr
- **Status**: Pending Approval (for demo certificate workflow)

**Anna Lee**
- **Email**: anna@tutor.com
- **Password**: test123
- **Subjects**: English Literature
- **Rate**: $20/hr
- **Location**: Gadong
- **Status**: Approved with verified badge

**Mohd Faizal**
- **Email**: faizal@tutor.com
- **Password**: test123
- **Subjects**: Chemistry (O & A Level)
- **Rate**: $25/hr
- **Location**: Kiulap
- **Status**: Pending Approval

---

## ✅ Implemented Features Checklist

### Core Authentication & Roles
- ✅ Role-based sign-up (Student/Parent, Tutor, Admin)
- ✅ Email verification flow with mock confirmation link
- ✅ Post-signup popup with "Check your email" message
- ✅ Email verification required for bookings
- ✅ Resend verification email option
- ✅ Auto-redirect based on role

### Student/Parent Features
- ✅ Search tutors with dynamic filters:
  - Subject (auto-populated from tutors)
  - Teaching level (Primary/Secondary/Tertiary)
  - Gender (Male/Female)
  - Location (Gadong, Kiulap, BSB, Online)
  - Price range slider (0-$200)
  - Rating (1-5 stars)
- ✅ Tutor listing cards with verified badges
- ✅ Detailed tutor profiles
- ✅ Interactive booking calendar
- ✅ Booking conflict prevention (server-side)
- ✅ Email verification enforcement for bookings
- ✅ Payment placeholder flow
- ✅ In-app messaging with tutors
- ✅ "My Bookings" view
- ✅ Leave reviews after completed sessions
- ✅ Cancellation within 24 hours

### Tutor Features
- ✅ Comprehensive profile editor with:
  - Full name, bio, profile photo
  - Subjects (tag-based, auto-populates filters)
  - Hourly rate
  - Gender, location, languages
  - Experience years, education level
  - Teaching levels
- ✅ Certificate upload (PDF/JPG/PNG, max 10MB)
- ✅ Certificate approval status tracking
- ✅ Delete uploaded certificates
- ✅ Weekly availability calendar
- ✅ Booking management (accept/decline)
- ✅ Resource uploads
- ✅ In-app messaging with students
- ✅ Earnings placeholder page (/earnings)
- ✅ Role-based redirect (tutors can't access student search)

### Admin Features
- ✅ User management dashboard
- ✅ Certificate management (approve/reject/delete)
- ✅ Booking oversight
- ✅ Review moderation
- ✅ Resource management
- ✅ Platform metrics
- ✅ Real-time data updates

### Technical Features
- ✅ Dynamic subject filtering from database
- ✅ Server-side booking conflict checking
- ✅ File size validation (10MB limit)
- ✅ Role-based route protection
- ✅ Tutor self-booking prevention
- ✅ Empty states for all lists
- ✅ Toast notifications for all actions
- ✅ Responsive design
- ✅ Real-time updates via React Query

---

## 🎯 User Flow Testing

### Student Flow
1. Sign up at `/auth` (select Student role)
2. Check console for mock verification link (format: `/?verified=true&email=...`)
3. Browse tutors at `/tutors`
4. Filter by subject (e.g., "Math"), teaching level ("Secondary"), gender
5. Click tutor card → view profile
6. Navigate to Booking tab
7. Select date and time slot
8. Confirm booking (payment placeholder)
9. Go to Chat tab for messaging
10. After session completion, leave a review

### Tutor Flow
1. Sign up at `/auth` (select Tutor role)
2. Go to `/profile`
3. Fill out tutor information
4. Upload certificate (PDF, <10MB)
5. Check status: "Pending Approval"
6. Try accessing `/tutors` → should redirect to profile with toast message
7. Access `/earnings` → see placeholder payout dashboard

### Admin Flow
1. Sign up/login as admin@tutorconnect.com
2. Go to `/admin`
3. **Users Tab**: View all users, edit profiles, change roles
4. **Certificates Tab**: Approve certificates, download, delete
5. **Reviews Tab**: Moderate reviews
6. **Bookings Tab**: View all bookings

---

## 🔗 Demo Verification Links

After signing up, check the **browser console** for the mock verification link:

```
🔗 DEMO VERIFICATION LINK (production will send real email):
http://localhost:5173/?verified=true&email=hisyam%40student.com
```

Click this link to mark the account as verified. In production, this would be sent via email.

---

## 🛠️ Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with semantic tokens
- **UI Components**: Shadcn UI + Radix UI
- **State Management**: React Query (TanStack Query)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Routing**: React Router v6

---

## 📂 Key Database Tables

- **profiles**: User accounts with roles
- **tutors**: Tutor-specific profiles
- **bookings**: Session bookings with conflict checking
- **reviews**: Student ratings and comments
- **messages**: In-app chat
- **tutor_availability**: Weekly availability slots
- **certificate_approvals**: Admin certificate workflow
- **tutor_resources**: File uploads by tutors

---

## 🚨 Known Limitations (Prototype Only)

### Mock Integrations
- **Email**: Verification links displayed in console (not sent)
- **Payments**: Placeholder UI only (Stripe/PayPal integration coming)
- **Messaging**: Basic text-only (no file uploads)

### Not Implemented
- Recurring weekly availability slots (manual entry only)
- Advanced calendar exception handling
- Real-time tutor online status
- Video call integration
- Automated payout scheduling
- Push notifications
- SMS notifications
- Advanced search (autocomplete, fuzzy matching)

### Security Notes
- RLS policies are implemented but need production review
- File upload validations are client-side only (add server-side in production)
- Rate limiting not implemented
- CSRF protection needed for production

---

## 🐛 Troubleshooting

### "Email verification required" error
- Check console for verification link after signup
- Click the link or manually update `profiles.email_verified = true` in database

### "Slot taken" error when booking
- Another user booked the slot first (conflict checking working!)
- Refresh the calendar and choose a different time

### Tutors redirected from `/tutors` page
- Working as intended! Tutors should use their profile/dashboard
- Students can browse tutors, tutors manage their own profile

### Subjects not appearing in filters
- Subjects are auto-populated from approved tutors
- Make sure at least one tutor is approved and has subjects added

---

## 📚 API Documentation

### Key Supabase Functions

**`get_all_subjects()`**  
Returns distinct subjects from approved tutors for dynamic filtering.

**`check_booking_conflict(p_tutor_id, p_session_date, p_start_time, p_end_time)`**  
Server-side booking conflict validation.

**`is_admin()`**  
Role check for RLS policies.

---

## 🔐 Production Readiness Checklist

Before deploying to production, ensure:

- [ ] Replace mock email with real SMTP (Resend, SendGrid)
- [ ] Integrate Stripe/PayPal for payments
- [ ] Add server-side file upload validation
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Review all RLS policies with security expert
- [ ] Set up proper logging and monitoring
- [ ] Add automated tests (unit + integration)
- [ ] Configure CDN for static assets
- [ ] Set up database backups
- [ ] Add terms of service and privacy policy
- [ ] Implement GDPR compliance features
- [ ] Set up error tracking (Sentry, etc.)

---

## 📧 Contact & Support

For questions about this prototype:
- Review `FINAL_IMPLEMENTATION_REPORT.md` for detailed feature status
- Check Supabase dashboard for RLS policies and database structure
- See console logs for debugging information

---

**Last Updated**: October 1, 2025  
**Version**: 1.0.0 (Prototype)  
**Status**: Demo-ready, not production-ready

## Lovable Project Info

**URL**: https://lovable.dev/projects/e9cafd32-8203-48b7-86a3-b3a653141d8d

This project is built with Vite, TypeScript, React, shadcn-ui, and Tailwind CSS.

### Deployment

Simply open [Lovable](https://lovable.dev/projects/e9cafd32-8203-48b7-86a3-b3a653141d8d) and click Share → Publish.