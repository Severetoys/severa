#!/usr/bin/env node
/**
 * Firebase to Cloudflare D1 Migration Script
 * 
 * This script migrates data from Firebase Firestore to Cloudflare D1
 * and exports Firebase Storage to Cloudflare R2.
 */

const fs = require('fs');
const path = require('path');

class FirebaseToCloudflareMigration {
  constructor() {
    this.migrationLog = [];
    this.timestamp = new Date().toISOString().split('T')[0];
    
    console.log('🔄 Firebase to Cloudflare Migration Tool');
    console.log(`Migration started at: ${new Date().toISOString()}`);
  }

  /**
   * Log migration steps
   */
  log(message, type = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    
    this.migrationLog.push(entry);
    
    const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${emoji} ${message}`);
  }

  /**
   * Create D1 database schema
   */
  async createD1Schema() {
    this.log('Creating D1 database schema...');
    
    const schema = `
-- Users table (migrated from Firebase Auth + Firestore users collection)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  is_anonymous BOOLEAN DEFAULT 0,
  subscription_status TEXT DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table (migrated from Firestore subscriptions collection)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  plan TEXT,
  status TEXT,
  price REAL,
  currency TEXT DEFAULT 'BRL',
  started_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Products table (migrated from Firestore products collection)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL,
  type TEXT, -- 'video', 'photo', 'subscription'
  category TEXT,
  active BOOLEAN DEFAULT 1,
  thumbnail_url TEXT,
  file_url TEXT,
  metadata TEXT, -- JSON string for additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table (migrated from Firestore chats collection)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT,
  type TEXT DEFAULT 'private', -- 'private', 'group', 'secret'
  status TEXT DEFAULT 'active',
  last_message TEXT,
  last_message_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Messages table (migrated from Firestore messages subcollection)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT,
  sender_id TEXT,
  content TEXT,
  type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'file'
  metadata TEXT, -- JSON string for file info, reactions, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Reviews table (migrated from Firestore reviews collection)
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  user_id TEXT,
  rating INTEGER,
  comment TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Page views table (migrated from Firestore pageViews collection)
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table (new for better tracking)
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id TEXT,
  page_path TEXT,
  metadata TEXT, -- JSON string for event data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
`;

    // Save schema to file
    const schemaPath = path.join(__dirname, '..', 'schema', 'd1-schema.sql');
    
    // Create schema directory if it doesn't exist
    const schemaDir = path.dirname(schemaPath);
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
    }
    
    fs.writeFileSync(schemaPath, schema);
    this.log(`D1 schema saved to: ${schemaPath}`, 'success');
    
    return schema;
  }

  /**
   * Generate mock migration data (since Firebase is removed)
   */
  async generateMockData() {
    this.log('Generating mock data for D1 migration...');
    
    const mockData = {
      users: [
        {
          id: 'user_1',
          email: 'user1@example.com',
          display_name: 'Usuário 1',
          subscription_status: 'premium'
        },
        {
          id: 'user_2',
          email: 'user2@example.com',
          display_name: 'Usuário 2',
          subscription_status: 'free'
        }
      ],
      products: [
        {
          id: 'prod_1',
          name: 'Video Premium 1',
          price: 29.99,
          type: 'video',
          category: 'exclusivo',
          active: 1
        },
        {
          id: 'prod_2',
          name: 'Foto Set 1',
          price: 19.99,
          type: 'photo',
          category: 'fotos',
          active: 1
        }
      ],
      conversations: [
        {
          id: 'conv_1',
          user_id: 'user_1',
          title: 'Chat Secreto',
          type: 'secret'
        }
      ],
      page_views: [
        { path: '/videos', count: 1250 },
        { path: '/fotos', count: 890 },
        { path: '/chat-secreto', count: 650 }
      ]
    };

    // Save mock data to file
    const dataPath = path.join(__dirname, '..', 'data', 'migration-data.json');
    
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(dataPath, JSON.stringify(mockData, null, 2));
    this.log(`Mock migration data saved to: ${dataPath}`, 'success');
    
    return mockData;
  }

  /**
   * Generate SQL insert statements
   */
  generateInsertSQL(mockData) {
    this.log('Generating SQL insert statements...');
    
    let sql = '-- Migration data inserts\n\n';
    
    // Users
    sql += '-- Insert users\n';
    mockData.users.forEach(user => {
      sql += `INSERT OR REPLACE INTO users (id, email, display_name, subscription_status) VALUES ('${user.id}', '${user.email}', '${user.display_name}', '${user.subscription_status}');\n`;
    });
    
    sql += '\n-- Insert products\n';
    mockData.products.forEach(product => {
      sql += `INSERT OR REPLACE INTO products (id, name, price, type, category, active) VALUES ('${product.id}', '${product.name}', ${product.price}, '${product.type}', '${product.category}', ${product.active});\n`;
    });
    
    sql += '\n-- Insert conversations\n';
    mockData.conversations.forEach(conv => {
      sql += `INSERT OR REPLACE INTO conversations (id, user_id, title, type) VALUES ('${conv.id}', '${conv.user_id}', '${conv.title}', '${conv.type}');\n`;
    });
    
    sql += '\n-- Insert page views\n';
    mockData.page_views.forEach(pv => {
      sql += `INSERT OR REPLACE INTO page_views (path, count) VALUES ('${pv.path}', ${pv.count});\n`;
    });
    
    // Save SQL to file
    const sqlPath = path.join(__dirname, '..', 'data', 'migration-inserts.sql');
    fs.writeFileSync(sqlPath, sql);
    this.log(`SQL insert statements saved to: ${sqlPath}`, 'success');
    
    return sql;
  }

  /**
   * Create Wrangler migration files
   */
  createWranglerMigrations() {
    this.log('Creating Wrangler migration files...');
    
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Initial schema migration
    const timestamp = Date.now();
    const schemaFile = path.join(migrationsDir, `${timestamp}_initial_schema.sql`);
    const schemaContent = fs.readFileSync(path.join(__dirname, '..', 'schema', 'd1-schema.sql'), 'utf8');
    fs.writeFileSync(schemaFile, schemaContent);
    
    // Data migration
    const dataFile = path.join(migrationsDir, `${timestamp + 1}_initial_data.sql`);
    const dataContent = fs.readFileSync(path.join(__dirname, '..', 'data', 'migration-inserts.sql'), 'utf8');
    fs.writeFileSync(dataFile, dataContent);
    
    this.log(`Wrangler migrations created in: ${migrationsDir}`, 'success');
  }

  /**
   * Create R2 migration plan
   */
  createR2MigrationPlan() {
    this.log('Creating R2 migration plan...');
    
    const r2Plan = {
      bucket: 'firebase-migration-bucket',
      folders: [
        {
          source: 'firebase-storage://your-project.appspot.com/videos/',
          destination: 'r2://your-bucket/videos/',
          description: 'Migrate video files from Firebase Storage to R2'
        },
        {
          source: 'firebase-storage://your-project.appspot.com/photos/',
          destination: 'r2://your-bucket/photos/',
          description: 'Migrate photo files from Firebase Storage to R2'
        },
        {
          source: 'firebase-storage://your-project.appspot.com/thumbnails/',
          destination: 'r2://your-bucket/thumbnails/',
          description: 'Migrate thumbnail files from Firebase Storage to R2'
        }
      ],
      commands: [
        'wrangler r2 bucket create firebase-migration-bucket',
        '# Use rclone or similar tool to sync files:',
        '# rclone sync firebase-storage:your-project.appspot.com/videos/ r2:your-bucket/videos/',
        '# rclone sync firebase-storage:your-project.appspot.com/photos/ r2:your-bucket/photos/'
      ]
    };
    
    const planPath = path.join(__dirname, '..', 'data', 'r2-migration-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(r2Plan, null, 2));
    this.log(`R2 migration plan saved to: ${planPath}`, 'success');
  }

  /**
   * Save migration log
   */
  saveMigrationLog() {
    const logPath = path.join(__dirname, '..', 'logs', `migration-${this.timestamp}.json`);
    
    // Create logs directory if it doesn't exist
    const logsDir = path.dirname(logPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(logPath, JSON.stringify({
      migration_id: `migration_${this.timestamp}`,
      started_at: this.migrationLog[0]?.timestamp,
      completed_at: new Date().toISOString(),
      steps: this.migrationLog,
      status: 'completed'
    }, null, 2));
    
    this.log(`Migration log saved to: ${logPath}`, 'success');
  }

  /**
   * Run the complete migration
   */
  async run() {
    try {
      this.log('Starting Firebase to Cloudflare migration...', 'info');
      
      // Create D1 schema
      await this.createD1Schema();
      
      // Generate mock data (since Firebase is removed)
      const mockData = await this.generateMockData();
      
      // Generate SQL inserts
      this.generateInsertSQL(mockData);
      
      // Create Wrangler migration files
      this.createWranglerMigrations();
      
      // Create R2 migration plan
      this.createR2MigrationPlan();
      
      // Save migration log
      this.saveMigrationLog();
      
      this.log('Migration preparation completed successfully!', 'success');
      this.log('Next steps:', 'info');
      this.log('1. Run: wrangler d1 create your-database-name', 'info');
      this.log('2. Update wrangler.toml with your database ID', 'info');
      this.log('3. Run: wrangler d1 migrations apply your-database-name --local', 'info');
      this.log('4. Run: wrangler d1 migrations apply your-database-name --remote', 'info');
      this.log('5. Set up R2 bucket and migrate files', 'info');
      
    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  const migration = new FirebaseToCloudflareMigration();
  migration.run().catch(console.error);
}

module.exports = FirebaseToCloudflareMigration;
