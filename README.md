# Collaborative Task Manager

A full-stack, real-time Collaborative Task Manager application featuring Role-Based Access Control (RBAC), an interactive drag-and-drop Kanban board, and instant WebSockets synchronization. Built to satisfy all core and bonus requirements.

## 🚀 Overview of Features Implemented

* **User Authentication & RBAC**: Secure JWT-based session management across the application.
  * **Managers** have elevated privileges to create, assign, edit, and delete tasks.
  * **Users** have focused access to view and update the status of tasks explicitly assigned to them.
* **Real-Time Kanban Board (Bonus)**: A premium, interactive Drag-and-Drop task board implemented using `@hello-pangea/dnd` for fluid state manipulation.
* **Live Synchronization (Bonus)**: Powered natively by `socket.io`. When a user drags a task into a new column, the updated status is instantly broadcasted to all other connected clients, dynamically invalidating caches without needing a page refresh.
* **Activity Logging Tracker**: An audit trail that tracks recent task history, recording exactly who created, updated, or removed tasks.
* **Analytics Dashboard**: A sleek graphical dashboard visualizing task distribution and prioritizing overdue or high-priority items.
* **Dark Mode UI**: A fully responsive, modern aesthetic built with Tailwind CSS that supports robust light and dark themes.

## 🛠️ Instructions on Running the Project

### Prerequisites
* Node.js (v18 or higher)
* [pnpm](https://pnpm.io/installation) package manager
* A running instance of PostgreSQL

### 1. Environment Setup
Create a `.env` file at the root of the project (alongside `pnpm-workspace.yaml`) and add your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/rareminds
```

### 2. Install Dependencies
Run the following command at the root of the project to install all necessary monorepo workspace packages:
```bash
pnpm install
```

### 3. Initialize the Database
Push the Drizzle ORM schema to your specified PostgreSQL database to generate the tables:
```bash
pnpm run db:push
```

### 4. Start the Application
Boot up both the Vite frontend and Express backend development servers concurrently:
```bash
pnpm run dev
```
* **Frontend Access**: Navigate to `http://localhost:5173`
* **Backend API**: Running natively at `http://localhost:3000`

---

## 🤖 AI Model Documentation

*Note: As per the specific problem statement of the "Collaborative Task Manager", no external AI models (e.g., LLMs, generative APIs) were utilized or required for this web application. To demonstrate advanced technical competency, the development focus was heavily dedicated toward fulfilling the complex **Bonus Requirements** instead, specifically implementing real-time bidirectional networking via WebSockets and intricate client-side Drag-and-Drop state reconciliation.*
