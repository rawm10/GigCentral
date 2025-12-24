# Phase 2: Gig Marketplace & Booking Module

## Overview
Phase 2 transforms ChordKeeper from a personal chord sheet manager into **GigCentral** - a two-sided marketplace connecting musicians with venues/event organizers. Musicians can discover gigs, apply with their setlists, and manage bookings while venue owners can post opportunities and find qualified performers.

## Goals
- Enable musicians to find and apply for gigs using their ChordKeeper setlists as portfolios
- Allow venues/organizers to post gig opportunities and review applicant repertoires
- Streamline booking workflow from discovery → application → confirmation → performance
- Build a trusted community with ratings and verified performance history

## Success Metrics
- Time-to-first-application < 5 minutes from gig discovery
- Booking conversion rate > 15% (applications → confirmed gigs)
- Venue satisfaction score > 4.2/5
- Musician repeat application rate > 60% within 30 days
- Platform take rate: 5-10% of booking value

## User Personas

### Primary: Gigging Musicians
- **Solo Artist Sally**: Acoustic guitarist looking for coffee shop/restaurant gigs
- **Band Leader Brian**: Manages a 4-piece cover band, needs weekend bar/wedding gigs
- **Session Pro Sam**: Professional musician available for last-minute fill-ins

### Secondary: Gig Providers
- **Venue Owner Vicky**: Owns 3 restaurants, books live music Fri/Sat nights
- **Event Planner Emma**: Books musicians for weddings, corporate events, private parties
- **Festival Coordinator Frank**: Manages multi-stage events, books 20+ acts per event

## Features

### 2.1 Gig Discovery (Musicians)
**Browse & Search**
- Filter by: location (radius), date range, genre, pay range, venue type
- Map view showing nearby gigs
- Save searches with notifications for new matches
- "Quick Apply" using existing setlist

**Gig Details**
- Venue info: name, address, capacity, photos, vibe
- Requirements: genre, duration, equipment needs, set count
- Compensation: flat fee, door split, percentage, tips
- Application deadline and expected response time

**Smart Matching**
- Algorithm suggests gigs based on:
  - Musician's genre tags from setlists
  - Location preferences
  - Historical booking patterns
  - Rating and reliability score

### 2.2 Gig Posting (Venues)
**Create Posting**
- Event details: date/time, duration, breaks
- Venue profile: capacity, stage specs, PA/backline availability
- Genre/style requirements with examples
- Budget range (flat rate, door split, hybrid)
- Special requirements: original music only, family-friendly, etc.

**Application Management**
- Review applicant profiles and setlists
- Listen to attached demos/videos
- Message applicants with questions
- Send offers and negotiate terms
- Bulk actions (reject, shortlist)

### 2.3 Musician Profiles
**Public Portfolio**
- Bio, photos, demo videos
- Genre tags (generated from setlist content)
- Availability calendar
- Equipment list and stage requirements
- Performance radius (willing to travel X miles)
- Verified performance count and ratings

**Setlist Showcase**
- Make setlists public/private
- Tag setlists by genre/vibe ("Coffee Shop Set", "High Energy Dance")
- Estimated duration based on song count
- Demonstrate repertoire depth

### 2.4 Application & Booking Flow
**Application Submission**
1. Select setlist(s) to showcase
2. Add custom message and availability
3. Attach demo links (YouTube, Spotify, SoundCloud)
4. Propose rate (if range given)
5. Submit with 1-tap using saved profile

**Venue Review Process**
1. Receive applications ranked by match score
2. Review setlist and profile
3. Shortlist, message, or pass
4. Send booking offer with terms

**Confirmation & Contract**
1. Musician accepts/counters offer
2. Terms finalized (date, time, pay, set length)
3. Auto-generated booking agreement
4. Calendar sync for both parties
5. Payment escrow (optional, Phase 2.1)

### 2.5 Booking Management
**Musician Dashboard**
- Active applications (pending, shortlisted, rejected)
- Confirmed bookings with venue contact info
- Past performances with "request review" prompts
- Earnings tracker

**Venue Dashboard**
- Upcoming booked events
- Open postings with application counts
- Musician favorites/blocklist
- Payment tracking

### 2.6 Ratings & Reviews
**Post-Performance**
- Both parties prompted to rate (1-5 stars)
- Review categories:
  - Musicians: professionalism, repertoire match, crowd engagement
  - Venues: communication, payment timeliness, atmosphere
- Badge system: "Verified Performer", "5-Star Venue", "Repeat Booker"

**Trust & Safety**
- Report system for no-shows or disputes
- Verified phone/ID for active users
- Calendar verification (sync with Google/Apple Calendar)

## Technical Architecture

### Database Schema Additions

**Gigs Table**
```sql
CREATE TABLE gigs (
    gig_id UUID PRIMARY KEY,
    venue_user_id UUID REFERENCES users(user_id),
    title VARCHAR(200),
    description TEXT,
    venue_name VARCHAR(200),
    address TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    gig_date TIMESTAMP,
    duration_minutes INT,
    genre_tags VARCHAR[],
    compensation_type VARCHAR(50), -- 'flat', 'door_split', 'percentage', 'tips_only'
    pay_min DECIMAL(10,2),
    pay_max DECIMAL(10,2),
    application_deadline TIMESTAMP,
    status VARCHAR(50), -- 'open', 'in_review', 'filled', 'cancelled'
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Applications Table**
```sql
CREATE TABLE applications (
    application_id UUID PRIMARY KEY,
    gig_id UUID REFERENCES gigs(gig_id),
    musician_user_id UUID REFERENCES users(user_id),
    setlist_ids UUID[],
    message TEXT,
    demo_links TEXT[],
    proposed_rate DECIMAL(10,2),
    status VARCHAR(50), -- 'pending', 'shortlisted', 'offered', 'accepted', 'rejected'
    applied_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

**Bookings Table**
```sql
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY,
    gig_id UUID REFERENCES gigs(gig_id),
    musician_user_id UUID REFERENCES users(user_id),
    venue_user_id UUID REFERENCES users(user_id),
    agreed_rate DECIMAL(10,2),
    contract_terms TEXT,
    status VARCHAR(50), -- 'confirmed', 'completed', 'cancelled', 'disputed'
    performance_date TIMESTAMP,
    created_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

**Reviews Table**
```sql
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY,
    booking_id UUID REFERENCES bookings(booking_id),
    reviewer_user_id UUID REFERENCES users(user_id),
    reviewee_user_id UUID REFERENCES users(user_id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    categories JSONB, -- {'professionalism': 5, 'communication': 4, ...}
    created_at TIMESTAMP DEFAULT NOW()
);
```

**User Profile Extensions**
```sql
ALTER TABLE users ADD COLUMN user_type VARCHAR(50); -- 'musician', 'venue', 'both'
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN location_city VARCHAR(100);
ALTER TABLE users ADD COLUMN location_state VARCHAR(50);
ALTER TABLE users ADD COLUMN latitude DECIMAL(9,6);
ALTER TABLE users ADD COLUMN longitude DECIMAL(9,6);
ALTER TABLE users ADD COLUMN search_radius_miles INT DEFAULT 50;
ALTER TABLE users ADD COLUMN average_rating DECIMAL(3,2);
ALTER TABLE users ADD COLUMN total_reviews INT DEFAULT 0;
ALTER TABLE users ADD COLUMN verified BOOLEAN DEFAULT FALSE;
```

### API Endpoints

**Gig Management**
```
POST   /api/v1/gigs                    - Create gig posting
GET    /api/v1/gigs                    - Search/browse gigs
GET    /api/v1/gigs/{id}               - Get gig details
PUT    /api/v1/gigs/{id}               - Update gig
DELETE /api/v1/gigs/{id}               - Cancel gig
GET    /api/v1/gigs/{id}/applications  - View applications for gig
```

**Applications**
```
POST   /api/v1/applications            - Submit application
GET    /api/v1/applications            - Get my applications
PUT    /api/v1/applications/{id}       - Update application
DELETE /api/v1/applications/{id}       - Withdraw application
POST   /api/v1/applications/{id}/shortlist - Shortlist applicant
POST   /api/v1/applications/{id}/offer - Send booking offer
```

**Bookings**
```
GET    /api/v1/bookings                - Get my bookings
POST   /api/v1/bookings/{id}/accept    - Accept offer
POST   /api/v1/bookings/{id}/cancel    - Cancel booking
POST   /api/v1/bookings/{id}/complete  - Mark as performed
```

**Profiles**
```
GET    /api/v1/profiles/{userId}       - Public profile
PUT    /api/v1/profiles/me             - Update my profile
GET    /api/v1/profiles/me/stats       - My performance stats
```

**Reviews**
```
POST   /api/v1/reviews                 - Submit review
GET    /api/v1/reviews/user/{userId}   - Get user's reviews
```

### Mobile UI Additions

**New Tabs/Screens**
- **Gigs Tab**: Browse/search gigs, map view, saved searches
- **My Gigs**: Applications and bookings split view
- **Profile**: Public portfolio editor

**Enhanced Setlist Screens**
- "Make Public" toggle
- Genre tagging interface
- "Apply to Gig" quick action

## Timeline & Sprints

### Sprint 7-8: Foundation (2 weeks)
- Database schema updates
- User type selection (musician/venue/both)
- Basic profile editor
- Gig posting CRUD (venues)

### Sprint 9-10: Discovery & Applications (2 weeks)
- Gig browse/search with filters
- Map view integration (MapBox/Google Maps)
- Application submission flow
- Application management dashboard (venues)

### Sprint 11-12: Booking & Communication (2 weeks)
- Offer/accept flow
- In-app messaging between musicians and venues
- Booking confirmation and calendar sync
- Email notifications for key events

### Sprint 13-14: Trust & Safety (2 weeks)
- Reviews and ratings system
- Verified badges
- Report/dispute system
- User reputation scores

### Sprint 15: Polish & Launch (1 week)
- Performance optimization
- Analytics and tracking
- Marketing materials
- Beta launch to existing ChordKeeper users

## Monetization

### Commission Model
- **Free to Post**: Venues post gigs for free
- **Free to Apply**: Musicians apply for free
- **Booking Fee**: 8% platform fee on confirmed bookings
  - Split: 5% from musician, 3% from venue
  - Only charged when gig is marked "completed"

### Premium Tiers

**Musician Pro ($14.99/mo)**
- Unlimited applications (free: 10/month)
- Priority placement in search results
- Advanced analytics (application success rate, earnings)
- Featured profile badge
- Early access to new gigs (24hr head start)

**Venue Pro ($29.99/mo)**
- Unlimited active postings (free: 3 at a time)
- Applicant matching AI suggestions
- Bulk message tools
- Calendar integration
- Performance history tracking

### Value-Added Services
- Promoted gig postings: $9.99-$49.99 per listing
- Background-checked musician badge: $19.99/year
- Payment escrow service: +2% fee (protects both parties)

## Risks & Mitigations

**Risk: Chicken-and-egg (need both musicians and venues)**
- **Mitigation**: Launch in specific metro areas sequentially (Nashville, Austin, LA)
- Seed with existing ChordKeeper user base as musicians
- Partner with venue associations for initial gig postings
- Offer free premium for first 3 months to early adopters

**Risk: Payment disputes and no-shows**
- **Mitigation**: Escrow service for high-value bookings
- Clear cancellation policies with penalties
- Insurance option for major events
- Reputation system disincentivizes bad actors

**Risk: Competition from existing platforms (GigSalad, GigMasters)**
- **Mitigation**: Unique integration with setlist management
- Better mobile experience focused on musicians
- Lower fees (8% vs 15-20% industry standard)
- Modern UI/UX tailored to younger musicians

**Risk: Licensing issues with public setlists**
- **Mitigation**: Public setlists show song titles only (no chords/lyrics)
- Clear TOS about user-owned content
- DMCA takedown process

## Success Criteria

**Launch (Month 1)**
- 500+ active musician profiles
- 100+ venue accounts
- 50+ gigs posted
- 200+ applications submitted

**6 Months**
- 5,000 musician profiles
- 500 venue accounts
- 1,000+ confirmed bookings
- $100K GMV (Gross Merchandise Value)
- 4.0+ average platform rating

**12 Months**
- 25,000 musician profiles
- 2,500 venues
- 10,000+ bookings
- $1M GMV
- Profitable in 3 metro areas
- NPS > 50

## Future Enhancements (Phase 3)

- **Payment Processing**: Integrated Stripe/PayPal for direct booking payment
- **Contracts**: Auto-generated legal contracts with e-signature
- **Insurance**: Event liability insurance marketplace
- **Team Booking**: Book entire bands with member management
- **Recurring Gigs**: Set up weekly/monthly regular gigs
- **Festival Mode**: Multi-stage, multi-day event management
- **Talent Agencies**: B2B tools for agencies representing multiple artists
- **Analytics**: Venue foot traffic correlation with music type
- **Dynamic Pricing**: AI-suggested rates based on demand and musician reputation

---

## Appendix: Wireframe Descriptions

### Gig Browse Screen
- Search bar with "Near me" location
- Filter chips: Genre, Date, Pay Range, Distance
- Card layout: Venue name, date, genre, pay, distance
- Map/List toggle
- Saved searches shortcut

### Gig Detail Screen
- Hero image (venue photo)
- Date/time, duration, location (with map pin)
- Compensation details
- Genre tags
- Venue description
- Requirements (equipment, set count)
- "Apply Now" button (floating)
- Similar gigs carousel

### Application Form
- Setlist selector (multi-select with preview)
- Cover message text area
- Demo links (paste URLs)
- Rate proposal (if applicable)
- Availability confirmation
- "Submit Application" button

### Musician Profile (Public View)
- Profile photo and name
- Location and radius badge
- Star rating and review count
- Bio
- Genre tags (from setlists)
- Public setlists grid
- Performance stats (gigs completed, repeat bookings)
- Recent reviews
- "Contact" button (for venues)

### Venue Dashboard
- "Post New Gig" CTA
- Active postings tabs: Open / In Review / Filled
- Application counters per gig
- Quick actions: View, Edit, Close posting
- Calendar view of booked events

### Application Review Screen (Venue)
- Applicant list with match score %
- Quick preview: photo, rating, genres
- Expand to see: full profile, setlists, demos
- Actions: Shortlist, Message, Reject, Send Offer
- Comparison mode (side-by-side)

