import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_FILE = path.join(process.cwd(), 'data.json');

let db: any = {
  users: [],
  logs: [],
  accounts: []
};

async function loadData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    db = JSON.parse(data);
  } catch (e) {
    await saveData();
  }
}

async function saveData() {
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
}

// Ensure ADMIN user exists
function ensureAdmin() {
  const adminExists = db.users.find((u: any) => u.email === 'anikhossain333866@gmail.com');
  if (!adminExists) {
    db.users.push({
      id: 'admin_001',
      email: 'anikhossain333866@gmail.com',
      password: 'admin', // Default password, can be changed
      status: 'approved',
      role: 'full_admin',
      expiryDate: null,
      createdAt: Date.now(),
      successCount: 0
    });
    saveData();
  }
}

// API Routes
app.get("/api/state", (req, res) => {
  res.json(db);
});

app.post("/api/action", async (req, res) => {
  const { type, payload } = req.body;
  
  try {
    switch (type) {
      case 'REGISTER':
        db.users.push(payload);
        break;
      case 'UPDATE_USERS':
        db.users = payload;
        break;
      case 'UPDATE_LOGS':
        db.logs = payload;
        break;
      case 'UPDATE_ACCOUNTS':
        db.accounts = payload;
        break;
      case 'LOG':
        db.logs.unshift(payload);
        if (db.logs.length > 500) db.logs = db.logs.slice(0, 500);
        break;
      case 'SAVE_ACCOUNT':
        db.accounts.push(payload);
        if (payload.createdBy !== 'ADMIN' && payload.createdBy !== 'anikhossain333866@gmail.com') {
          const user = db.users.find((u: any) => u.email === payload.createdBy);
          if (user) {
            user.successCount = (user.successCount || 0) + 1;
          }
        }
        break;
      case 'INCREMENT_SUCCESS':
        const user = db.users.find((u: any) => u.email === payload.email);
        if (user) {
          user.successCount = (user.successCount || 0) + 1;
        }
        break;
      default:
        return res.status(400).json({ error: 'Unknown action type' });
    }
    
    await saveData();
    res.json({ success: true, db });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function startServer() {
  await loadData();
  ensureAdmin();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
