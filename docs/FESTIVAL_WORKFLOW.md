# 🎪 Festival/Standard Event Workflow (Dean-Controlled)

## Overview
Standard Events in Diganta work like **festivals** or **umbrella events** where multiple clubs can participate and organize their own sub-events within the larger framework. **All sub-events require Dean approval** to maintain systematic oversight and control.

## 🔄 Complete Workflow Process

### 1. Dean Creates Festival
```
Dean → Creates "Tech Fest 2026" (Standard Event)
     → Status: Auto-approved (Dean authority)
     → Open for club participation
```

### 2. Clubs Join the Festival
```
Computer Science Club → Joins Tech Fest 2026
Electronics Club → Joins Tech Fest 2026
Cultural Club → Joins Tech Fest 2026
```

### 3. Clubs Propose Sub-Events
```
CS Club → Creates "Coding Competition" (Sub-event)
       → Status: WAITING_FOR_DEAN (Requires approval)

Electronics Club → Creates "Robot Exhibition" (Sub-event)
                → Status: WAITING_FOR_DEAN

Cultural Club → Creates "Tech Dance Performance" (Sub-event)
             → Status: WAITING_FOR_DEAN
```

### 4. Dean Reviews & Approves Sub-Events
```
Dean Dashboard → Shows all pending sub-events across festivals
             → Review each proposal: objectives, budget, venue, dates
             → Approve/Reject with comments
             → Approved sub-events can proceed to execution
```

### 5. Resource Management (Post-Approval)
```
After Dean approval, clubs can request resources for their sub-events:
- Equipment (projectors, sound systems)
- Funding (prize money, materials)
- Venue bookings within the fest
- Transport, Security, Catering needs
```

## 🎯 Key Features

### ✅ Dean Authority & Control
- **Festival Creation**: Dean creates standard events (auto-approved)
- **Sub-Event Oversight**: All sub-events require Dean approval
- **Systematic Dashboard**: Comprehensive festival management interface
- **Budget Control**: Review all sub-event budgets before approval
- **Resource Oversight**: Monitor resource requests across festivals

### ✅ Organized Festival Management
- **Festival Manager Dashboard**: `/dean-festivals` - Complete festival oversight
- **Pending Approvals**: Clear list of sub-events awaiting review
- **Festival Analytics**: Performance metrics and budget tracking
- **Action Alerts**: Notification system for urgent approvals
- **Filter Controls**: Organize festivals by status and metrics

### ✅ Sub-Event Workflow
- **Controlled Creation**: Clubs propose sub-events within joined festivals
- **Dean Approval Required**: Maintains quality and coherence
- **Full Event Features**: Tasks, expenses, resource requests (post-approval)
- **Parent-Child Hierarchy**: Clear relationship with festival
- **Notification System**: Dean notified of new sub-event proposals

## 📊 Dean Festival Manager Dashboard

### Overview Tab
- **Festival Grid**: Visual cards showing all festivals with key metrics
- **Status Filtering**: Filter by Active, Draft, Completed festivals
- **Quick Statistics**: Clubs, sub-events, budget per festival
- **Status Breakdown**: Visual sub-event status indicators

### Pending Approvals Tab
- **Action Required**: List of sub-events awaiting approval
- **Priority Queue**: Oldest requests first
- **Quick Review**: Click to view full sub-event details
- **Batch Processing**: Efficient approval workflow

### Analytics Tab
- **Performance Metrics**: Festival participation and success rates
- **Budget Analysis**: Total budgets and spending patterns
- **Trend Tracking**: Sub-event creation and approval patterns
- **Resource Utilization**: Cross-festival resource insights

## 🔐 Permissions & Security

### Dean Permissions
- ✅ Create and manage standard events (festivals)
- ✅ Approve/reject all sub-events within festivals
- ✅ Access comprehensive festival analytics dashboard
- ✅ Override any festival-related decisions
- ✅ Monitor all resource requests across festivals

### Club Permissions
- ✅ Join approved standard events with their clubs
- ✅ Propose sub-events within joined festivals (requires Dean approval)
- ✅ Request resources for approved sub-events
- ❌ Cannot modify other clubs' sub-events
- ❌ Cannot auto-approve their own sub-events

### Resource Department
- ✅ Review resource requests for approved sub-events
- ✅ Approve/reject resource requests with comments
- ✅ Mark requests as fulfilled
- ✅ View resource requests across all festivals

## 🎯 Example Use Cases

### Tech Fest Example (Dean-Controlled)
```
Standard Event: "Tech Fest 2026" (Created by Dean)
├── Proposed Sub-Events (Awaiting Dean Approval):
│   ├── CS Club: "Coding Marathon" → WAITING_FOR_DEAN
│   ├── Electronics: "Robot Wars" → WAITING_FOR_DEAN
│   ├── Mechanical: "CAD Competition" → WAITING_FOR_DEAN
│   └── Cultural: "Tech Fashion Show" → WAITING_FOR_DEAN

Dean Reviews Each:
├── ✅ Approves: Coding Marathon (good objectives, reasonable budget)
├── ✅ Approves: Robot Wars (innovative, manages space well)
├── ❌ Rejects: CAD Competition (conflicts with venue booking)
└── ✅ Approves: Tech Fashion Show (creative integration)

Post-Approval Resource Requests:
├── CS Club: 10 laptops for coding marathon
├── Electronics: ₹20,000 funding for robot components
└── Cultural: Professional sound system and lighting
```

### Cultural Fest Example
```
Standard Event: "Spring Cultural Festival" (Dean-Created)
├── Sub-Event Proposals → All go through Dean approval
├── Dean ensures: No time conflicts, budget coherence, venue coordination
├── Approved sub-events can request resources
└── Dean maintains quality and festival coherence
```

## 🚀 Technical Implementation

### API Endpoints
- `GET /api/dashboard/dean-festivals` - Festival management dashboard
- `POST /api/events/{festivalId}/subevents` - Create sub-event (→ WAITING_FOR_DEAN)
- `GET /api/events/{festivalId}/subevents` - List festival sub-events
- `POST /api/events/{subEventId}/approve` - Dean approves/rejects sub-events
- `POST /api/events/{eventId}/resources` - Resource requests (post-approval)

### Database Schema
```prisma
model Event {
  // Parent-child hierarchy
  parentEventId  String?   // Links sub-events to festivals
  parentEvent    Event?    @relation("ParentSubEvents")
  subEvents      Event[]   @relation("ParentSubEvents")

  // Sub-events start with WAITING_FOR_DEAN status
  status         String    @default("DRAFT")
}
```

### UI Components
- **Festival Manager Page**: `/dean-festivals` - Systematic festival control
- **Enhanced Event Detail**: Sub-events tab with approval workflow
- **Notification System**: Dean alerts for pending sub-events
- **Sidebar Integration**: "Festival Manager" link for Dean/Admin

## ✅ Benefits of Dean Control

1. **Quality Assurance**: Dean ensures all sub-events meet standards
2. **Resource Coordination**: Prevents conflicts and over-allocation
3. **Strategic Alignment**: Sub-events align with festival objectives
4. **Budget Control**: Dean reviews all financial commitments
5. **Timeline Management**: Ensures feasible scheduling across sub-events
6. **Brand Consistency**: Maintains festival coherence and quality

This Dean-controlled festival workflow provides **systematic oversight while maintaining flexibility** for clubs to organize meaningful events within the larger festival framework! 🎊