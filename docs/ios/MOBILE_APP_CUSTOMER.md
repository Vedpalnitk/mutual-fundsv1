# Sparrow Invest - Customer Mobile App

## Overview

A mobile application for retail investors to discover, invest, and track mutual fund investments with AI-powered personalized recommendations.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [User Personas](#2-user-personas)
3. [User Stories](#3-user-stories)
4. [App Structure](#4-app-structure)
5. [Screen Specifications](#5-screen-specifications)
6. [Navigation Flow](#6-navigation-flow)
7. [Technical Stack](#7-technical-stack)

---

## 1. Product Vision

### Mission
Simplify mutual fund investing for everyday Indians by providing personalized, goal-based recommendations powered by AI.

### Key Differentiators
- **AI-Powered Recommendations**: Personalized fund selection based on risk profile and goals
- **Goal-Based Investing**: Link investments to life goals (retirement, education, wealth)
- **Simplified Experience**: No jargon, clear explanations, guided journey
- **Transparency**: Show why funds are recommended with clear reasoning

### Target Users
- First-time investors (25-35 years)
- Existing MF investors looking for better recommendations
- Goal-oriented savers wanting structured investment plans

---

## 2. User Personas

### Persona 1: Priya - The First-Time Investor
- **Age**: 26
- **Occupation**: Software Engineer
- **Income**: ₹12 LPA
- **Goals**: Start investing, build emergency fund, save for travel
- **Pain Points**: Confused by too many fund options, doesn't understand risk
- **Needs**: Simple guidance, small SIP amounts, education

### Persona 2: Rahul - The Goal-Oriented Saver
- **Age**: 32
- **Occupation**: Product Manager
- **Income**: ₹25 LPA
- **Goals**: Child's education (15 years), Home down payment (5 years)
- **Pain Points**: Scattered investments, no clear plan, wants consolidation
- **Needs**: Goal tracking, rebalancing suggestions, consolidated view

### Persona 3: Meera - The Experienced Investor
- **Age**: 45
- **Occupation**: Business Owner
- **Income**: ₹50 LPA
- **Goals**: Retirement corpus, tax saving, wealth preservation
- **Pain Points**: Wants better returns, tired of relationship manager bias
- **Needs**: Advanced analytics, direct plans, low expense ratios

---

## 3. User Stories

### Epic 1: Onboarding & KYC

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-1.1 | As a new user, I want to sign up with my phone number so that I can create an account quickly | P0 | OTP verification, <30 sec flow |
| US-1.2 | As a new user, I want to complete KYC using my Aadhaar/PAN so that I can start investing | P0 | DigiLocker integration, eKYC flow |
| US-1.3 | As a new user, I want to link my bank account so that I can make investments | P0 | UPI autopay, netbanking mandate |
| US-1.4 | As a new user, I want to skip KYC initially and explore the app so that I can decide if I want to invest | P1 | Guest mode with limited features |
| US-1.5 | As a user, I want to see my KYC status so that I know what's pending | P1 | Status tracker with steps |

### Epic 2: Risk Profiling & Persona

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-2.1 | As a user, I want to answer simple questions about my risk tolerance so that I get personalized recommendations | P0 | 5-7 questions, visual options |
| US-2.2 | As a user, I want to understand my investor persona so that I know my investment style | P0 | Persona card with description |
| US-2.3 | As a user, I want to retake the risk assessment if my situation changes | P1 | Reset option in settings |
| US-2.4 | As a user, I want to see how my persona affects my recommendations | P1 | Explainer screen |

### Epic 3: Goal-Based Investing

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-3.1 | As a user, I want to create investment goals (retirement, education, house) so that I can track progress | P0 | Goal templates + custom goals |
| US-3.2 | As a user, I want to set target amount and timeline for each goal | P0 | Calculator with projections |
| US-3.3 | As a user, I want to see recommended SIP amount for each goal | P0 | Based on expected returns |
| US-3.4 | As a user, I want to track progress towards each goal | P0 | Progress bar, projected vs actual |
| US-3.5 | As a user, I want to get alerts if I'm falling behind on a goal | P1 | Push notifications |
| US-3.6 | As a user, I want to adjust my goals if my plans change | P1 | Edit goal parameters |

### Epic 4: Fund Discovery & Recommendations

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-4.1 | As a user, I want to see AI-recommended funds based on my profile so that I don't have to research | P0 | Top 5-10 funds with reasoning |
| US-4.2 | As a user, I want to understand why a fund is recommended to me | P0 | Clear bullet points |
| US-4.3 | As a user, I want to browse all available funds by category | P1 | Filter by equity/debt/hybrid |
| US-4.4 | As a user, I want to search for a specific fund by name | P1 | Search with autocomplete |
| US-4.5 | As a user, I want to compare two or more funds side by side | P2 | Comparison table |
| US-4.6 | As a user, I want to see fund details (returns, risk, holdings) | P0 | Fund detail page |
| US-4.7 | As a user, I want to add funds to my watchlist | P1 | Heart/bookmark icon |

### Epic 5: Investment Actions

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-5.1 | As a user, I want to start a SIP in a recommended fund | P0 | Amount, date selection, UPI autopay |
| US-5.2 | As a user, I want to make a lump sum investment | P0 | One-time payment flow |
| US-5.3 | As a user, I want to invest in a recommended portfolio (multiple funds) | P0 | One-click invest in basket |
| US-5.4 | As a user, I want to modify my SIP amount | P1 | Increase/decrease/pause |
| US-5.5 | As a user, I want to pause or stop a SIP | P1 | Pause with reminder, stop with confirmation |
| US-5.6 | As a user, I want to set up a step-up SIP (annual increase) | P2 | % increase annually |
| US-5.7 | As a user, I want to redeem (withdraw) from my investments | P1 | Partial/full redemption |

### Epic 6: Portfolio Tracking

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-6.1 | As a user, I want to see my total portfolio value and returns | P0 | Dashboard summary |
| US-6.2 | As a user, I want to see returns in absolute (₹) and percentage (%) | P0 | Toggle option |
| US-6.3 | As a user, I want to see fund-wise breakdown of my portfolio | P0 | List with allocation % |
| US-6.4 | As a user, I want to see asset allocation (equity/debt/gold) | P0 | Pie chart |
| US-6.5 | As a user, I want to see historical performance of my portfolio | P1 | Line chart (1M, 6M, 1Y, All) |
| US-6.6 | As a user, I want to see XIRR (actual returns) of my portfolio | P1 | Calculated returns |
| US-6.7 | As a user, I want to import my external MF holdings via CAS | P2 | CAMS/Karvy statement upload |

### Epic 7: Transactions & Statements

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-7.1 | As a user, I want to see all my transactions (SIP, lump sum, redemption) | P0 | Transaction history list |
| US-7.2 | As a user, I want to filter transactions by fund, type, date | P1 | Filter options |
| US-7.3 | As a user, I want to download my account statement | P1 | PDF download |
| US-7.4 | As a user, I want to see upcoming SIP dates | P1 | Calendar view |
| US-7.5 | As a user, I want to see failed transactions and retry | P1 | Error handling |

### Epic 8: Notifications & Alerts

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-8.1 | As a user, I want to receive SIP debit reminders | P0 | 1 day before notification |
| US-8.2 | As a user, I want to be notified when SIP is successful/failed | P0 | Push notification |
| US-8.3 | As a user, I want alerts when my portfolio drops significantly | P1 | Configurable threshold |
| US-8.4 | As a user, I want to receive goal progress updates monthly | P1 | Summary notification |
| US-8.5 | As a user, I want to get rebalancing suggestions | P2 | When allocation drifts |

### Epic 9: Education & Support

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-9.1 | As a new user, I want to learn basics of mutual funds | P1 | Bite-sized articles/videos |
| US-9.2 | As a user, I want to understand terms (NAV, CAGR, expense ratio) | P1 | Glossary with examples |
| US-9.3 | As a user, I want to contact support via chat | P1 | In-app chat |
| US-9.4 | As a user, I want to see FAQs | P1 | FAQ section |
| US-9.5 | As a user, I want tooltips explaining features | P2 | Contextual help |

### Epic 10: Settings & Profile

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|---------------------|
| US-10.1 | As a user, I want to view and edit my profile | P0 | Name, email, phone |
| US-10.2 | As a user, I want to manage my linked bank accounts | P1 | Add/remove banks |
| US-10.3 | As a user, I want to set my notification preferences | P1 | Toggle notifications |
| US-10.4 | As a user, I want to enable app lock (PIN/biometric) | P1 | Security settings |
| US-10.5 | As a user, I want to nominate a beneficiary | P2 | Nomination form |
| US-10.6 | As a user, I want to download tax reports (capital gains) | P2 | Financial year wise |

---

## 4. App Structure

### 4.1 Information Architecture

```
Sparrow Invest App
│
├── 🏠 Home (Dashboard)
│   ├── Portfolio Summary Card
│   ├── Goal Progress Cards
│   ├── Quick Actions (Invest, SIP, Redeem)
│   ├── AI Recommendations
│   └── Market Movers
│
├── 🎯 Goals
│   ├── My Goals List
│   ├── Create New Goal
│   │   ├── Goal Templates
│   │   └── Custom Goal
│   ├── Goal Detail
│   │   ├── Progress Tracker
│   │   ├── Linked Investments
│   │   └── Adjust Goal
│   └── Goal Insights
│
├── 💼 Portfolio
│   ├── Holdings Overview
│   │   ├── Total Value
│   │   ├── Today's Change
│   │   └── Total Returns
│   ├── Fund-wise Holdings
│   ├── Asset Allocation Chart
│   ├── Performance Chart
│   └── Transactions History
│
├── 🔍 Explore
│   ├── AI Recommendations
│   │   ├── For You
│   │   └── By Goal
│   ├── Browse Categories
│   │   ├── Equity Funds
│   │   ├── Debt Funds
│   │   ├── Hybrid Funds
│   │   ├── Tax Saver (ELSS)
│   │   ├── Index Funds
│   │   └── Gold Funds
│   ├── Search Funds
│   ├── Fund Detail Page
│   │   ├── Overview
│   │   ├── Performance
│   │   ├── Holdings
│   │   ├── Fund Manager
│   │   └── Invest Button
│   ├── Compare Funds
│   └── Watchlist
│
├── 📋 SIPs
│   ├── Active SIPs
│   ├── SIP Calendar
│   ├── Paused SIPs
│   ├── SIP History
│   └── Create New SIP
│
└── 👤 Profile
    ├── My Profile
    ├── KYC Status
    ├── Bank Accounts
    ├── Risk Profile
    ├── Notifications Settings
    ├── Security (PIN/Biometric)
    ├── Help & Support
    ├── Tax Reports
    └── Logout
```

### 4.2 Tab Bar Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      [Screen Content]                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🏠        🎯        💰        🔍        👤                │
│  Home     Goals    Invest    Explore   Profile              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 File Structure (Expo Router)

```
mobile/
├── app/
│   ├── _layout.tsx                 # Root layout with providers
│   ├── index.tsx                   # Splash/Entry point
│   │
│   ├── (auth)/                     # Auth flow (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx             # Welcome/Intro screens
│   │   ├── login.tsx               # Phone number entry
│   │   ├── verify-otp.tsx          # OTP verification
│   │   ├── signup.tsx              # Basic details
│   │   └── kyc/
│   │       ├── index.tsx           # KYC options
│   │       ├── pan.tsx             # PAN verification
│   │       ├── aadhaar.tsx         # Aadhaar/DigiLocker
│   │       └── bank.tsx            # Bank account linking
│   │
│   ├── (onboarding)/               # First-time user flow
│   │   ├── _layout.tsx
│   │   ├── risk-profile.tsx        # Risk assessment quiz
│   │   ├── persona-result.tsx      # Show persona
│   │   ├── set-goal.tsx            # First goal setup
│   │   └── first-investment.tsx    # Guided first investment
│   │
│   ├── (tabs)/                     # Main app (authenticated)
│   │   ├── _layout.tsx             # Tab bar layout
│   │   │
│   │   ├── index.tsx               # Home/Dashboard
│   │   │
│   │   ├── goals/
│   │   │   ├── index.tsx           # Goals list
│   │   │   ├── create.tsx          # Create new goal
│   │   │   └── [id].tsx            # Goal detail
│   │   │
│   │   ├── invest/
│   │   │   ├── index.tsx           # Quick invest options
│   │   │   ├── sip/
│   │   │   │   ├── index.tsx       # Active SIPs
│   │   │   │   ├── create.tsx      # New SIP
│   │   │   │   └── [id].tsx        # SIP detail
│   │   │   ├── lumpsum.tsx         # Lump sum investment
│   │   │   └── cart.tsx            # Investment cart
│   │   │
│   │   ├── explore/
│   │   │   ├── index.tsx           # Recommendations + categories
│   │   │   ├── search.tsx          # Search funds
│   │   │   ├── category/[slug].tsx # Category listing
│   │   │   ├── compare.tsx         # Fund comparison
│   │   │   └── watchlist.tsx       # Saved funds
│   │   │
│   │   └── profile/
│   │       ├── index.tsx           # Profile menu
│   │       ├── edit.tsx            # Edit profile
│   │       ├── kyc-status.tsx      # KYC details
│   │       ├── bank-accounts.tsx   # Manage banks
│   │       ├── risk-profile.tsx    # View/retake assessment
│   │       ├── notifications.tsx   # Notification settings
│   │       ├── security.tsx        # PIN/biometric
│   │       ├── help.tsx            # Help & FAQ
│   │       └── tax-reports.tsx     # Download reports
│   │
│   ├── fund/
│   │   └── [code].tsx              # Fund detail page
│   │
│   ├── portfolio/
│   │   ├── index.tsx               # Portfolio overview
│   │   ├── holdings.tsx            # Detailed holdings
│   │   ├── transactions.tsx        # Transaction history
│   │   └── import.tsx              # Import external MF
│   │
│   ├── redeem/
│   │   └── [code].tsx              # Redemption flow
│   │
│   └── payment/
│       ├── index.tsx               # Payment options
│       ├── upi.tsx                 # UPI payment
│       ├── netbanking.tsx          # Net banking
│       └── status.tsx              # Payment status
│
├── components/
│   ├── ui/                         # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Chart.tsx
│   │   └── Modal.tsx
│   │
│   ├── home/
│   │   ├── PortfolioSummary.tsx
│   │   ├── GoalProgressCard.tsx
│   │   ├── QuickActions.tsx
│   │   ├── RecommendationCard.tsx
│   │   └── MarketMovers.tsx
│   │
│   ├── goals/
│   │   ├── GoalCard.tsx
│   │   ├── GoalProgressRing.tsx
│   │   ├── GoalTemplates.tsx
│   │   └── GoalCalculator.tsx
│   │
│   ├── funds/
│   │   ├── FundCard.tsx
│   │   ├── FundListItem.tsx
│   │   ├── FundMetrics.tsx
│   │   ├── FundChart.tsx
│   │   ├── HoldingsList.tsx
│   │   └── RecommendationReason.tsx
│   │
│   ├── portfolio/
│   │   ├── HoldingCard.tsx
│   │   ├── AllocationChart.tsx
│   │   ├── PerformanceChart.tsx
│   │   └── TransactionItem.tsx
│   │
│   ├── invest/
│   │   ├── SIPCard.tsx
│   │   ├── AmountInput.tsx
│   │   ├── DatePicker.tsx
│   │   └── PaymentMethod.tsx
│   │
│   └── onboarding/
│       ├── RiskQuestion.tsx
│       ├── PersonaCard.tsx
│       └── ProgressIndicator.tsx
│
├── services/
│   ├── api.ts                      # API client setup
│   ├── auth.service.ts             # Auth APIs
│   ├── funds.service.ts            # Fund data APIs
│   ├── portfolio.service.ts        # Portfolio APIs
│   ├── goals.service.ts            # Goals APIs
│   ├── invest.service.ts           # Investment APIs
│   └── user.service.ts             # User/profile APIs
│
├── store/                          # State management (Zustand)
│   ├── useAuthStore.ts
│   ├── usePortfolioStore.ts
│   ├── useGoalsStore.ts
│   └── useFundsStore.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── usePortfolio.ts
│   ├── useFunds.ts
│   └── useGoals.ts
│
├── constants/
│   ├── theme.ts                    # Colors, spacing, typography
│   ├── goals.ts                    # Goal templates
│   └── categories.ts               # Fund categories
│
├── utils/
│   ├── format.ts                   # Number, date formatting
│   ├── calculations.ts             # XIRR, CAGR calculations
│   └── validation.ts               # Form validations
│
└── types/
    ├── fund.ts
    ├── portfolio.ts
    ├── goal.ts
    └── user.ts
```

---

## 5. Screen Specifications

### 5.1 Home Screen

```
┌─────────────────────────────────────────┐
│ ☰  Sparrow Invest              🔔  👤  │
├─────────────────────────────────────────┤
│                                         │
│  Good morning, Priya 👋                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  YOUR PORTFOLIO                 │   │
│  │  ₹2,45,680                      │   │
│  │  ↑ ₹12,450 (5.3%) all time     │   │
│  │                                 │   │
│  │  Today: +₹890 (+0.36%)         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌──────────┐ ┌──────────┐             │
│  │ + Invest │ │ Withdraw │             │
│  └──────────┘ └──────────┘             │
│                                         │
│  MY GOALS                    See all → │
│  ┌─────────────────────────────────┐   │
│  │ 🏠 Home Down Payment            │   │
│  │ ████████░░░░░░░ 62%            │   │
│  │ ₹3.1L of ₹5L • 2 yrs left      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  RECOMMENDED FOR YOU         See all → │
│  ┌─────────────────────────────────┐   │
│  │ Parag Parikh Flexi Cap          │   │
│  │ Equity • Flexi Cap              │   │
│  │ 3Y: 18.7% │ Rating: ★★★★★      │   │
│  │ "Matches your moderate risk..." │   │
│  │                    [Invest →]   │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 5.2 Fund Detail Screen

```
┌─────────────────────────────────────────┐
│ ←  Fund Details                    ♡   │
├─────────────────────────────────────────┤
│                                         │
│  Parag Parikh Flexi Cap Fund           │
│  Direct Growth                          │
│                                         │
│  NAV: ₹78.45  •  -0.23% today          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         [Performance Chart]      │   │
│  │    1M   3M   6M   1Y   3Y   5Y  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  RETURNS                                │
│  ┌────────┬────────┬────────┐          │
│  │  1Y    │  3Y    │  5Y    │          │
│  │ 22.4%  │ 18.7%  │ 19.2%  │          │
│  └────────┴────────┴────────┘          │
│                                         │
│  WHY THIS FUND?                         │
│  ✓ Excellent risk-adjusted returns     │
│  ✓ Consistent long-term performer      │
│  ✓ Low expense ratio (0.63%)           │
│  ✓ Matches your risk profile           │
│                                         │
│  FUND DETAILS                           │
│  Category        Flexi Cap              │
│  AUM             ₹48,520 Cr             │
│  Expense Ratio   0.63%                  │
│  Fund Manager    Rajeev Thakkar         │
│  Min SIP         ₹1,000                 │
│                                         │
│  TOP HOLDINGS                  See all →│
│  HDFC Bank           8.2%               │
│  ICICI Bank          6.5%               │
│  Infosys             5.8%               │
│                                         │
├─────────────────────────────────────────┤
│  [  Start SIP  ]  [  Invest Once  ]    │
└─────────────────────────────────────────┘
```

### 5.3 Goal Creation Screen

```
┌─────────────────────────────────────────┐
│ ←  Create Goal                          │
├─────────────────────────────────────────┤
│                                         │
│  What are you saving for?               │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │   🏠    │ │   🎓    │ │   🚗    │   │
│  │  Home   │ │Education│ │   Car   │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │   ✈️    │ │   👶    │ │   💰    │   │
│  │ Vacation│ │  Child  │ │ Wealth  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐                            │
│  │   ✨    │                            │
│  │ Custom  │                            │
│  └─────────┘                            │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Goal Name                              │
│  ┌─────────────────────────────────┐   │
│  │ Dream Home Down Payment         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Target Amount                          │
│  ┌─────────────────────────────────┐   │
│  │ ₹ 5,00,000                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Target Date                            │
│  ┌─────────────────────────────────┐   │
│  │ December 2027 (3 years)         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  RECOMMENDED SIP                        │
│  ₹12,500/month                          │
│  Based on 12% expected returns          │
│                                         │
├─────────────────────────────────────────┤
│        [  Create Goal & Invest  ]       │
└─────────────────────────────────────────┘
```

### 5.4 Risk Assessment Screen

```
┌─────────────────────────────────────────┐
│      Risk Assessment    Step 3 of 5     │
│      ●●●○○                              │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│  If your investment drops 20%           │
│  in one month, what would you do?       │
│                                         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  😰                              │   │
│  │  Sell everything immediately     │   │
│  │  I can't handle losses           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  😟                              │   │
│  │  Sell some, keep some            │   │
│  │  I'd reduce my risk              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  😐  ✓                           │   │
│  │  Hold and wait                   │   │
│  │  Markets recover eventually      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🤑                              │   │
│  │  Invest more!                    │   │
│  │  Great buying opportunity        │   │
│  └─────────────────────────────────┘   │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  [ Back ]              [ Continue → ]   │
└─────────────────────────────────────────┘
```

---

## 6. Navigation Flow

### 6.1 New User Flow

```
App Launch
    │
    ▼
Welcome Screen (3 slides)
    │
    ▼
Login (Phone + OTP)
    │
    ▼
Basic Details (Name, Email, DOB)
    │
    ▼
┌─────────────────────┐
│ KYC Required?       │
│   │                 │
│   ├── Yes ──────────┼──► PAN → Aadhaar → Bank → Risk Assessment
│   │                 │
│   └── Skip for now ─┼──► Guest Mode (limited features)
└─────────────────────┘
    │
    ▼
Risk Assessment (5 questions)
    │
    ▼
Persona Result
    │
    ▼
First Goal Setup (optional)
    │
    ▼
Home Screen
```

### 6.2 Investment Flow

```
Fund Detail / Recommendation Card
    │
    ▼
┌─────────────────────┐
│ Investment Type?    │
│   │                 │
│   ├── SIP ──────────┼──► Amount → Date → Frequency → Payment
│   │                 │
│   └── Lump Sum ─────┼──► Amount → Payment
└─────────────────────┘
    │
    ▼
Payment Method (UPI / Net Banking)
    │
    ▼
Payment Gateway
    │
    ▼
┌─────────────────────┐
│ Status?             │
│   │                 │
│   ├── Success ──────┼──► Confirmation → Home
│   │                 │
│   └── Failed ───────┼──► Retry Option
└─────────────────────┘
```

### 6.3 Redemption Flow

```
Portfolio / Holding Detail
    │
    ▼
Tap "Redeem"
    │
    ▼
┌─────────────────────┐
│ Redemption Type?    │
│   │                 │
│   ├── Full ─────────┼──► Confirmation
│   │                 │
│   └── Partial ──────┼──► Enter Amount/Units → Confirmation
└─────────────────────┘
    │
    ▼
Review (Tax implications shown)
    │
    ▼
Confirm Redemption
    │
    ▼
Success (T+1/T+3 credit info)
```

---

## 7. Technical Stack

### 7.1 Frontend

| Component | Technology |
|-----------|------------|
| Framework | React Native (Expo) |
| Routing | Expo Router v3 |
| State Management | Zustand |
| Data Fetching | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Charts | react-native-gifted-charts |
| UI Components | Custom + React Native Paper |
| Animations | React Native Reanimated |
| Storage | AsyncStorage + SecureStore |

### 7.2 Backend Integration

| Service | Endpoint |
|---------|----------|
| Auth | `POST /api/v1/auth/login`, `/verify-otp`, `/register` |
| User | `GET/PUT /api/v1/user/profile`, `/risk-profile` |
| Funds | `GET /api/v1/funds`, `/funds/{code}`, `/funds/recommend` |
| Portfolio | `GET /api/v1/portfolio`, `/holdings`, `/transactions` |
| Goals | `GET/POST/PUT /api/v1/goals` |
| Invest | `POST /api/v1/invest/sip`, `/lumpsum`, `/redeem` |
| KYC | `POST /api/v1/kyc/pan`, `/aadhaar`, `/bank` |

### 7.3 Third-Party Integrations

| Service | Purpose | Provider |
|---------|---------|----------|
| KYC | eKYC, Video KYC | DigiLocker, Hyperverge |
| Payments | UPI, Net Banking | Razorpay, PayU |
| MF Transactions | Order placement | BSE StAR MF, MFU |
| CAS Import | External holdings | CAMS, Karvy |
| Notifications | Push notifications | Firebase Cloud Messaging |
| Analytics | User behavior | Mixpanel, Amplitude |
| Crash Reporting | Error tracking | Sentry |

---

## Appendix A: API Response Examples

### Portfolio Summary

```json
{
  "total_value": 245680,
  "total_invested": 233230,
  "total_returns": 12450,
  "returns_percentage": 5.34,
  "today_change": 890,
  "today_change_percentage": 0.36,
  "xirr": 14.2,
  "asset_allocation": {
    "equity": 72,
    "debt": 18,
    "hybrid": 7,
    "gold": 3
  },
  "holdings_count": 8
}
```

### Fund Recommendation

```json
{
  "recommendations": [
    {
      "scheme_code": 119598,
      "scheme_name": "Parag Parikh Flexi Cap Fund Direct Growth",
      "category": "Flexi Cap",
      "asset_class": "equity",
      "returns": {
        "1y": 22.4,
        "3y": 18.7,
        "5y": 19.2
      },
      "risk_rating": 4,
      "expense_ratio": 0.63,
      "min_sip": 1000,
      "score": 0.87,
      "reasons": [
        "Excellent risk-adjusted returns (Sharpe: 1.1)",
        "Consistent outperformance over 5+ years",
        "Low expense ratio - 37% below category average",
        "Matches your moderate risk profile"
      ],
      "suggested_allocation": 0.25
    }
  ]
}
```

---

## Appendix B: Goal Templates

| Goal | Icon | Default Target | Default Timeline | Risk Level |
|------|------|----------------|------------------|------------|
| Retirement | 🏖️ | ₹1 Cr | 25 years | Moderate |
| Child Education | 🎓 | ₹25 L | 15 years | Moderate |
| Home Down Payment | 🏠 | ₹10 L | 5 years | Low-Moderate |
| Car Purchase | 🚗 | ₹5 L | 3 years | Low |
| Vacation | ✈️ | ₹2 L | 1 year | Low |
| Emergency Fund | 🏥 | 6x expenses | 1 year | Very Low |
| Wedding | 💒 | ₹15 L | 3 years | Low-Moderate |
| Wealth Creation | 💰 | - | 10+ years | As per profile |

---

## Appendix C: Notification Templates

| Event | Title | Body |
|-------|-------|------|
| SIP Reminder | SIP Due Tomorrow | Your ₹5,000 SIP for Parag Parikh Flexi Cap is due tomorrow |
| SIP Success | SIP Successful ✓ | ₹5,000 invested in Parag Parikh Flexi Cap. Units: 63.72 |
| SIP Failed | SIP Payment Failed | Your SIP payment failed. Tap to retry. |
| Goal Progress | Goal Update 🎯 | You're 62% towards your Home goal! ₹3.1L of ₹5L saved. |
| Market Alert | Portfolio Update | Your portfolio is down 3.2% today. Stay invested for long term gains. |
| Rebalance | Rebalancing Suggested | Your equity allocation has drifted to 78%. Consider rebalancing. |
