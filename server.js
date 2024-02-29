const express = require('express')
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 3000
const { Pool } = require('pg')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
require('dotenv').config()

app.use(cors())
app.use(bodyParser.json())

const secretKey = crypto.randomBytes(32).toString('hex') // Secret key for JWT

// PostgreSQL configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
})

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err)
  } else {
    console.log('Connected to the database')
  }
})

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body

  // Query the database to check if the username and password match
  pool.query('SELECT name FROM users WHERE rno = $1 AND password = $2', [username, password], (err, result) => {
    if (err) {
      console.error('Error executing query:', err)
      res.status(500).json({ success: false, message: 'Internal Server Error' })
    } else {
      if (result.rows.length > 0) {
        const user = result.rows[0]; // Assuming there's only one user with the provided username/password
        // Authentication successful, generate JWT token
        const token = jwt.sign({ username: username, name: user.name }, secretKey, { expiresIn: '1h' });
        res.json({ success: true, token: token });
      } else {
        // Authentication failed
        res.json({ success: false, message: 'Invalid username or password' })
      }
    }
  })
})

// Dashboard endpoint
app.get('/dashboard', verifyToken, (req, res) => {
  // Get username from decoded token
  const { username, name } = req.decoded
  console.log('login:'+username+',')
  // You can fetch additional user details from the database if needed
  res.json({ success: true, message: 'Welcome to the dashboard', rno: username, name: name })
})

// Dashboard endpoint
app.get('/download', verifyToken, (req, res) => {
    // Get username from decoded token
    const { username, name } = req.decoded
    console.log('download:'+username+',')
    // You can fetch additional user details from the database if needed
    res.json({ success: true, rno: username , name})
  })
  

// Middleware function to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Failed to authenticate token' })
    }

    // If token is valid, save decoded token to request object
    req.decoded = decoded
    next()
  })
}

app.listen(process.env.PORT || PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
