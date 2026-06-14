# UPCRM 🚀

### AI-Powered Customer Re-engagement Platform

UPCRM is an AI-native CRM platform that helps businesses identify inactive customers, create personalized campaigns, automate customer communication, and monitor campaign performance through real-time analytics.

Built as an end-to-end full-stack system using **React + TypeScript + FastAPI + MySQL**, UPCRM combines AI agents with CRM workflows to deliver personalized re-engagement at scale.

---

# ✨ Features

* 🤖 AI Campaign Copilot (Natural Language Campaign Creation)
* 👥 Customer Segmentation Engine
* 📩 Personalized Message Generation
* 📧 Email Channel Integration (SMTP)
* 📱 SMS & WhatsApp Architecture Support
* 🔄 Asynchronous Callback Pipeline
* 📊 Analytics Dashboard
* 🗄 Database Viewer
* 🔍 Search & Filtering
* 📈 Campaign Performance Tracking
* 📝 Campaign Event Logging
* 🔌 Provider-Agnostic Architecture

---

# 🏗 Architecture

```text
Data Ingestion
      ↓
AI Copilot
      ↓
Segmentation Engine
      ↓
Personalization
      ↓
Campaign Creation
      ↓
Channel Service
      ↓
Receipt Callback
      ↓
Database Update
      ↓
Analytics Dashboard
```

---

# ⚙️ Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Recharts
* Framer Motion

## Backend

* FastAPI
* SQLAlchemy
* Pydantic
* AsyncIO

## Database

* MySQL

## AI Stack

* Gemini 2.5 Flash
* Groq (Fallback)
* Tool Calling Agent

## Data Processing

* Pandas

## Communication Layer

* Gmail SMTP
* Twilio SMS (Production Ready)
* Twilio WhatsApp API (Production Ready)

---

# 📂 Database Schema

## Customers

Stores:

* Customer information
* Total spending
* Favorite category
* Channel preference
* Churn status
* Communication status

---

## Orders

Stores:

* Purchase history
* Product category
* Amount
* Quantity
* Payment information

---

## Campaigns

Stores:

* Campaign metadata
* Segment
* Message
* Channel
* Delivery metrics

---

## Campaign Events

Acts as an audit log.

Stores:

* Sent
* Delivered
* Opened
* Clicked
* Failed

events for every communication.

---

# 🤖 AI Copilot

Marketers can create campaigns using natural language.

Example:

```text
Re-engage customers inactive for 90 days with a 10% discount.
```

The AI Agent:

1. Understands user intent.
2. Selects appropriate segment.
3. Generates personalized content.
4. Creates and launches campaigns.
5. Updates analytics automatically.

---

# 🎯 Customer Segmentation

UPCRM identifies:

### Inactive Customers

```python
days_since_last_order > 90
```

### High Value Customers

```python
total_spent > 10000
```

### At-Risk Customers

Based on:

* Order frequency
* Purchase patterns
* Existing churn labels

---

# 💬 Personalization Engine

Messages are dynamically generated using:

* Customer name
* Favorite category
* Spending behavior
* Preferred channel

Example:

```text
Hi John,

We've missed you!

Enjoy 10% OFF on your next purchase from Electronics.

Use code WELCOME10.

Regards,
UPCRM Team
```

---

# 📬 Multi-Channel Communication

Supported channels:

### Email

* Gmail SMTP
* Real implementation

### SMS

* Simulated workflow
* Twilio-ready architecture

### WhatsApp

* Simulated workflow
* Twilio WhatsApp API ready

---

# 🔄 Event Lifecycle

Each campaign follows:

```text
Sent
 ↓
Delivered
 ↓
Opened
 ↓
Clicked
```

or

```text
Failed
```

Callbacks update:

* Customer status
* Last contacted time
* Campaign metrics
* Event logs

---

# 📊 Analytics Dashboard

Visualizations include:

* Revenue Trends
* Campaign Funnel
* Open Rate
* Click Rate
* Delivery Metrics
* Segment Distribution
* Category Analytics

Built using Recharts.

---

# 🗄 Database Viewer

Supports:

### Customers

Search and filter customer records.

### Orders

View purchase history.

### Campaigns

Track campaign metrics.

### Campaign Events

Inspect message lifecycle events.

---

# 📧 SMTP Email Delivery

To avoid disturbing real dataset users, real email delivery is redirected to the developer email address while preserving the same campaign execution workflow.

Dataset email addresses are never contacted directly.

---

# 🔐 Design Philosophy

UPCRM follows:

* Modular architecture
* Provider agnostic communication layer
* Explainable segmentation
* AI-assisted workflows
* Scalable event-driven design

---

# 🚀 Future Enhancements

* XGBoost churn prediction model
* Redis queue
* Celery workers
* Twilio SMS integration
* WhatsApp Business API integration
* Kafka event streaming
* PostgreSQL migration
* Role-based access control
* Multi-tenant support

---

# 📸 Workflow

```text
CSV Upload
     ↓
AI Copilot
     ↓
Segmentation
     ↓
Personalization
     ↓
Campaign Creation
     ↓
Email / SMS / WhatsApp
     ↓
Receipt Callback
     ↓
Campaign Events
     ↓
Analytics Dashboard
```

---

# 👨‍💻 Author

**Soubhik Sadhu**

B.Tech CSE (AI & ML)

SRM Institute of Science and Technology

GitHub: **SoubhLance**

---

### UPCRM — AI-powered customer re-engagement made simple.
