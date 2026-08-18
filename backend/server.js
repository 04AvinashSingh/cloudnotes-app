require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { docClient } = require('./dynamodb');
const { PutCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const app = express();
app.use(cors());
app.use(express.json());

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'CloudNotes';
const JWT_SECRET = process.env.JWT_SECRET || 'cloudnotes_super_secure_jwt_secret_key_2026';

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register / Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check if user already exists
    const scanParams = {
      TableName: TABLE_NAME,
    };
    const { Items = [] } = await docClient.send(new ScanCommand(scanParams));
    const existingUser = Items.find(
      (item) => item.itemType === 'USER' && item.email === normalizedEmail
    );

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    const now = new Date().toISOString();

    const newUser = {
      id: `user_${userId}`,
      userId,
      itemType: 'USER',
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newUser,
      })
    );

    // Create a starter welcome note for the new user
    const welcomeNote = {
      id: uuidv4(),
      userId,
      itemType: 'NOTE',
      title: '👋 Welcome to CloudNotes!',
      content:
        'This note is stored securely in AWS DynamoDB under your account.\n\nYou can:\n• Create, edit, and categorize your notes\n• Pick custom theme colors\n• Pin important items to the top\n• Search across all your notes in real-time',
      category: 'General',
      color: 'indigo',
      pinned: true,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: welcomeNote,
      })
    );

    const token = jwt.sign({ id: userId, email: normalizedEmail, name: newUser.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Could not create account' });
  }
});

// Login / Sign In
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const scanParams = {
      TableName: TABLE_NAME,
    };
    const { Items = [] } = await docClient.send(new ScanCommand(scanParams));
    const user = Items.find(
      (item) => item.itemType === 'USER' && item.email === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.userId, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Could not log in' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ==========================================
// PROTECTED NOTES ROUTES
// ==========================================

// Create a new note for authenticated user
app.post('/api/notes', authMiddleware, async (req, res) => {
  const { title, content, category = 'General', color = 'slate', pinned = false } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const now = new Date().toISOString();
  const note = {
    id: uuidv4(),
    userId: req.user.id,
    itemType: 'NOTE',
    title: title.trim(),
    content: content.trim(),
    category: category.trim() || 'General',
    color: color || 'slate',
    pinned: Boolean(pinned),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const params = {
      TableName: TABLE_NAME,
      Item: note,
    };
    await docClient.send(new PutCommand(params));
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Could not create note' });
  }
});

// Get all notes for the authenticated user
app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };
    const { Items = [] } = await docClient.send(new ScanCommand(params));

    // Filter to only notes belonging to the current user (or legacy notes without userId)
    const userNotes = Items.filter(
      (item) => item.itemType !== 'USER' && (item.userId === req.user.id || !item.userId)
    );

    // Sort: pinned first, then by createdAt descending
    const sortedNotes = userNotes.sort((a, b) => {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) {
        return Boolean(b.pinned) ? 1 : -1;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    res.json(sortedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Could not fetch notes' });
  }
});

// Update a note
app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, content, category, color, pinned } = req.body;

  try {
    const scanParams = {
      TableName: TABLE_NAME,
    };
    const { Items = [] } = await docClient.send(new ScanCommand(scanParams));
    const existing = Items.find((item) => item.id === id);

    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check ownership if userId is set
    if (existing.userId && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this note' });
    }

    const updatedNote = {
      ...existing,
      userId: existing.userId || req.user.id,
      title: title !== undefined ? title.trim() : existing.title,
      content: content !== undefined ? content.trim() : existing.content,
      category: category !== undefined ? category.trim() : (existing.category || 'General'),
      color: color !== undefined ? color : (existing.color || 'slate'),
      pinned: pinned !== undefined ? Boolean(pinned) : Boolean(existing.pinned),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updatedNote,
      })
    );

    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Could not update note' });
  }
});

// Delete a note
app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const scanParams = {
      TableName: TABLE_NAME,
    };
    const { Items = [] } = await docClient.send(new ScanCommand(scanParams));
    const existing = Items.find((item) => item.id === id);

    if (existing && existing.userId && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this note' });
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        id,
      },
    };
    await docClient.send(new DeleteCommand(params));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Could not delete note' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Cloud Notes API is running!');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
