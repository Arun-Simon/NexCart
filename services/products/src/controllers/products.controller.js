const { pool } = require('../db');

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    let values = [];

    if (category) {
      query += ` WHERE c.slug = $1`;
      values.push(category);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    // Count total for pagination
    let countQuery = 'SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id';
    let countValues = [];
    if (category) {
      countQuery += ' WHERE c.slug = $1';
      countValues.push(category);
    }
    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[products] getProducts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[products] getProduct error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category_id, image_url } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category_id, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, price, stock, category_id, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[products] createProduct error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id, image_url } = req.body;
    const result = await pool.query(
      `UPDATE products 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           price = COALESCE($3, price), 
           stock = COALESCE($4, stock), 
           category_id = COALESCE($5, category_id), 
           image_url = COALESCE($6, image_url)
       WHERE id = $7 RETURNING *`,
      [name, description, price, stock, category_id, image_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[products] updateProduct error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body; // absolute new stock value
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const result = await pool.query(
      'UPDATE products SET stock = $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[products] updateStock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('[products] getCategories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
