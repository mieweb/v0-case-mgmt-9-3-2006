# Case Management System - Functional Documentation

## Overview

This is a comprehensive Case Management System built for managing disability, workers compensation, maternity, FMLA, and ADA accommodation cases. The system provides case managers with tools to track cases, manage employee information, handle correspondence, and maintain detailed records throughout the lifecycle of each case.

---

## Core Architecture

### Technology Stack
- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: React Context API
- **Language**: TypeScript

### Data Contexts
- **CasesContext**: Central case data, restrictions, notes, todos, diagnoses, documents
- **AdminContext**: Case types, case managers, locations, and code tables
- **UserContext**: User management and authentication with role-based access
- **ContactsContext**: Contact management (physicians, employers, attorneys, etc.)
- **EmployeesContext**: Employee directory and information

---

## Case Types Supported

| Case Type | Description |
|-----------|-------------|
| Short-term Disability | STD claims with pay tracking and FICA date calculations |
| Long-term Disability | LTD claims with extended tracking |
| Workers Compensation | Work-related injury claims with adjuster integration |
| Maternity | Pregnancy and childbirth leave management |
| FMLA | Family Medical Leave Act tracking |
| ADA Accommodation | Americans with Disabilities Act accommodations |
| Confidential | Sensitive cases with restricted access |

---

## Main Functional Modules

### 1. Cases Dashboard (`/components/cases-dashboard.tsx`)

**Features:**
- Searchable and sortable case list
- Filter by status (Open, Pending, Closed)
- Filter by case manager ("My Cases" toggle)
- Advanced filtering options
- Quick case access with click-to-open
- Display columns: Case Number, Employee Name, Employee Number, Status, Case Type, Case Manager, Location, Date of Disability, Next Todo

### 2. Case Manager (`/components/case-manager.tsx`)

The main case view with tabbed interface:

#### Case Tab (`/components/tabs/case-tab.tsx`)
- Employee demographics display
- Case information (type, category, status, dates)
- Case manager assignment
- Confidential flag toggle
- Closure management with reason tracking
- Emergency contact information
- Employment details (hire date, position, union info)

#### Absence Tab (`/components/tabs/absence-tab.tsx`)
- Track absence entries with status types:
  - FD (Full Day)
  - LWD (Lost Work Day)
  - RWD (Restricted Work Day)
  - RWDREGULARJOB (Restricted Work Day - Regular Job)
  - OTH (Other - customizable)
- Effective date tracking
- Day count management

#### Absence Restrictions Tab (`/components/tabs/absence-restrictions-tab.tsx`)
- Manage work restrictions
- Start/end dates with review date tracking
- Permanent vs. temporary restrictions
- ADA accommodation flagging
- Notes and documentation

#### Pay Information Tab (`/components/tabs/pay-information-tab.tsx`)
- Multiple pay entries per case
- Rate of pay (hourly/monthly)
- Pay codes with descriptions
- STD offset tracking
- FICA date calculation (automatic 6-month calculation)
- Active/inactive status

#### Diagnosis Tab (`/components/tabs/diagnosis-tab.tsx`)
- ICD-10 and ICD-11 code support
- Primary and secondary diagnosis ranking
- Diagnosis date tracking
- Active/inactive status
- Notes per diagnosis

#### Case Notes Tab (`/components/tabs/case-notes-tab.tsx`)
- Rich text editor with formatting
- **Dictation Support** with speech-to-text
  - Smart punctuation recognition (context-aware "period", "comma", "colon")
  - Real-time interim results display
  - Pop-out window for dictation (bypasses iframe restrictions)
- Note templates (configurable in admin)
- Version history with edit tracking
- Lineout functionality (soft delete with audit trail)
- Lock/unlock notes
- Activity type categorization
- Date filtering and search

#### Letters Tab (`/components/tabs/letters-tab.tsx`)
- Letter template system with Mustache variables
- **Dictation Support** (same as Case Notes)
- Rich text editor with formatting toolbar
- Variable insertion for case data
- Pop-out window for editing and printing
- Letter history per case

#### Todos Tab (`/components/tabs/todos-tab.tsx`)
- Task management per case
- Due date scheduling
- Case manager assignment
- Completion tracking
- Link to letters (auto-complete when letter sent)
- Bulk actions

#### Documents Tab (`/components/tabs/documents-tab.tsx`)
- Document upload and storage
- Document type categorization
- Received from tracking
- Description and date received
- File preview support

#### Contacts Tab (`/components/tabs/contact-tab.tsx`)
- Multiple contact types per case:
  - Treating Physician
  - Employer Contact
  - Attorney
  - Family Member
  - Insurance Representative
  - Other
- Primary contact designation
- Contact autocomplete from global contacts
- Active/inactive status

#### Activity Tab (`/components/tabs/activity-tab.tsx`)
- Complete audit log of all case changes
- Timestamp tracking
- User attribution
- Field-level change tracking (old value → new value)

#### Questionnaires Tab (`/components/tabs/questionnaires-tab.tsx`)
- Questionnaire management interface

#### Restrictions Tab (`/components/tabs/restrictions-tab.tsx`)
- Employee-wide restriction view (across all cases)
- Active restriction tracking

---

## Rich Text Editor (`/components/rich-text-editor.tsx`)

**Formatting Features:**
- Bold, Italic, Underline, Strikethrough
- Bullet and numbered lists
- Indent/Outdent
- Text alignment (left, center, right, justify)
- Headers (H1, H2, H3)
- Links
- Tables
- Bracket conversion (<< >> to {{ }})

**Dictation Features:**
- Speech-to-text using Web Speech API
- Smart punctuation processing:
  - "period" → `.` (unless used in context like "billing period")
  - "comma" → `,`
  - "colon" → `:` (unless used in context like "colon cancer")
  - "question mark" → `?`
  - "exclamation point" → `!`
  - "new line" → line break
  - "new paragraph" → double line break
- Auto-capitalization after sentence endings
- Continuous listening with auto-restart
- Visual feedback (pulsing button when active)

---

## Administrative Functions (`/components/admin-panel.tsx`)

### Case Types Management
- Create/edit/delete case types
- Configure default todo templates per case type
- Confidential flag per case type

### Case Managers Management
- Add/remove case managers
- Active/inactive status

### Locations Management
- Location names
- Region assignment
- Active/inactive status

### Code Tables Management
Configurable lookup tables for:
- Letter Templates (with Mustache content)
- Case Note Templates
- Case Status codes
- Case Category codes
- Case Closure Reasons
- Contact Types
- Absence Status codes
- Absence Reason codes
- Restriction codes
- Case Activity codes
- Document Types
- Pay Codes

---

## Template Systems

### Todo Templates (`/lib/todo-parser.ts`)

**Format:** `"Todo Title; offset=N Unit; anchor=anchorName; rrule=FREQ=..."`

**Offset Units:** Day, Week, Month

**Anchors:**
- `dateOfDisability` - calculates from disability date
- `caseCreation` - calculates from case creation date

**Recurrence (rrule):**
- FREQ: DAILY, WEEKLY, MONTHLY
- INTERVAL: repeat interval
- COUNT: number of occurrences

**Example:**
```
"Initial Assessment; offset=7 Day; anchor=dateOfDisability"
"Monthly Review; offset=1 Month; rrule=FREQ=MONTHLY;COUNT=12"
```

### Letter Templates (`/lib/mustache-parser.ts`)

**Available Variables:**
| Variable | Description |
|----------|-------------|
| `{{employeeName}}` | Full employee name |
| `{{employeeFirstName}}` | First name |
| `{{employeeLastName}}` | Last name |
| `{{employeeNumber}}` | Employee ID |
| `{{employeeLocation}}` | Work location |
| `{{caseNumber}}` | Case number |
| `{{caseType}}` | Type of case |
| `{{caseManager}}` | Assigned case manager |
| `{{dateOfDisability}}` | Disability start date |
| `{{adjuster}}` | Adjuster name (auto-lookup) |
| `{{adjusterPhone}}` | Adjuster phone |
| `{{adjusterEmail}}` | Adjuster email |
| `{{today}}` | Current date (MM/DD/YYYY) |
| `{{address}}` | Employee address |
| `{{employeeCity}}` | City from address |
| `{{employeeState}}` | State from address |
| `{{employeeZip}}` | ZIP from address |

---

## Case Creation Wizard (`/components/create-case-wizard.tsx`)

**Step 1: Employee Selection**
- Search existing employees
- Create new employee if needed
- Employee autocomplete

**Step 2: Case Details**
- Case type selection
- Category assignment
- Case manager assignment
- Dates (disability, initial contact, etc.)
- Confidential flag

**Step 3: Review & Create**
- Summary of all entered information
- Auto-generation of todos from case type templates
- Confetti celebration on creation

---

## Payroll Export (`/app/payroll-export/page.tsx`)

- Export pay information for payroll processing
- Filter by date range
- Filter by case status
- Export formatting options

---

## Security & Access Control

### User Roles
| Role | Description |
|------|-------------|
| `admin` | Full system access including admin panel |
| `case-manager` | Manage assigned cases |
| `case-manager-leader` | Manage all cases, view reports |
| `viewer` | Read-only access |

### Confidential Cases
- Marked at case level
- Restricted viewing based on role
- Visual indicators for confidential status

---

## Pop-Out Window Features

Both Case Notes and Letters support pop-out editing windows that:
- Open in a separate browser window
- Enable dictation (bypasses iframe restrictions)
- Include full formatting toolbar
- Support print functionality
- Sync changes back to main application via postMessage API

---

## Data Date Format Standard

All dates in the system use **MM/DD/YYYY** format for consistency.

---

## Adjuster Integration

The system includes a built-in adjuster directory with:
- 40+ pre-configured adjusters
- Auto-lookup by adjuster code
- Name, phone, and email auto-population
- Used in Workers Comp cases and letter templates

---

## UI Components

The system uses shadcn/ui components including:
- Accordion, Alert, Avatar, Badge
- Button, Calendar, Card, Carousel
- Checkbox, Collapsible, Command
- Dialog, Drawer, Dropdown Menu
- Form, Input, Label, Popover
- Progress, Radio Group, Select
- Sheet, Skeleton, Slider, Switch
- Table, Tabs, Textarea, Toast
- Tooltip, and more

---

## Key Libraries & Utilities

- `@/lib/utils.ts` - Common utilities (cn function for class merging)
- `@/lib/confetti.ts` - Celebration effects
- `@/lib/debug.ts` - Development debugging utilities
- `@/lib/case-type-utils.ts` - Case type specific helpers

---

## Future Considerations

The system architecture supports:
- Database integration (currently uses React Context with mock data)
- Authentication provider integration
- Real-time collaboration features
- Reporting and analytics dashboards
- Email integration for notifications
- Calendar integration for scheduling
