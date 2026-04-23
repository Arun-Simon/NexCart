const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'products_db',
  user: process.env.DB_USER || 'nexcart',
  password: process.env.DB_PASS || 'nexcart_db_pass_2024',
});

const MAX_RETRIES = 10;
const RETRY_DELAY = 3000;

const seedData = async (client) => {
  const { rows: categoriesCount } = await client.query('SELECT COUNT(*) FROM categories');
  if (parseInt(categoriesCount[0].count) > 0) {
    return; // Already seeded
  }

  console.log('Seeding products database...');
  await client.query(`
    INSERT INTO categories (id, name, slug) VALUES 
    (1, 'Electronics', 'electronics'),
    (2, 'Clothing', 'clothing'),
    (3, 'Books', 'books'),
    (4, 'Home & Kitchen', 'home-kitchen')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Set sequence
  await client.query(`SELECT setval('categories_id_seq', 4, true)`);

  const products = [
    [ 'Wireless Headphones', 'High quality noise-canceling headphones', 199.99, 50, 1, 'https://picsum.photos/seed/headphones/400/300' ],
    [ '4K Monitor', '27 inch 4K Ultra HD Monitor', 349.50, 30, 1, 'https://picsum.photos/seed/monitor/400/300' ],
    [ 'Mechanical Keyboard', 'RGB Mechanical Gaming Keyboard', 89.99, 100, 1, 'https://picsum.photos/seed/keyboard/400/300' ],
    
    [ 'Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 19.99, 200, 2, 'https://picsum.photos/seed/tshirt/400/300' ],
    [ 'Denim Jeans', 'Classic fit blue denim jeans', 49.99, 150, 2, 'https://picsum.photos/seed/jeans/400/300' ],
    [ 'Winter Jacket', 'Warm winter jacket with hood', 89.95, 75, 2, 'https://picsum.photos/seed/jacket/400/300' ],
    
    [ 'The Great Gatsby', 'Classic novel by F. Scott Fitzgerald', 9.99, 300, 3, 'https://picsum.photos/seed/gatsby/400/300' ],
    [ 'Clean Code', 'A Handbook of Agile Software Craftsmanship', 39.95, 120, 3, 'https://picsum.photos/seed/cleancode/400/300' ],
    [ 'Design Patterns', 'Elements of Reusable Object-Oriented Software', 45.00, 80, 3, 'https://picsum.photos/seed/patterns/400/300' ],
    
    [ 'Coffee Maker', 'Programmable coffee maker with glass carafe', 59.99, 60, 4, 'https://picsum.photos/seed/coffee/400/300' ],
    [ 'Blender', 'High-speed blender for smoothies', 79.50, 45, 4, 'https://picsum.photos/seed/blender/400/300' ],
    [ 'Air Fryer', '5.8-Quart Air Fryer oven', 119.99, 90, 4, 'https://picsum.photos/seed/airfryer/400/300' ]
  ];

  for (const p of products) {
    await client.query(
      'INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
      p
    );
  }
  console.log('Seeding complete.');
};

const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        stock INTEGER DEFAULT 0,
        category_id INTEGER REFERENCES categories(id),
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Database tables verified/created successfully.');
    await seedData(client);
  } finally {
    client.release();
  }
};

const connectDB = async (attempt = 1) => {
  console.log(`Attempting DB connection... (attempt ${attempt}/${MAX_RETRIES})`);
  try {
    const client = await pool.connect();
    client.release();
    console.log('Connected to PostgreSQL successfully.');
    await initDb();
  } catch (error) {
    console.error(`DB connection failed: ${error.message}`);
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      await connectDB(attempt + 1);
    } else {
      console.error('Max DB connection retries reached. Exiting.');
      process.exit(1);
    }
  }
};

module.exports = { pool, connectDB };
