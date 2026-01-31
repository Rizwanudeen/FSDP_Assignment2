import jwt from "jsonwebtoken";
// Use the same secret your backend uses
const JWT_SECRET = "devsecret123"; // match your backend .env

// Payload for testing
const payload = {
  user_id: 1,      
  full_name: "Dev User",
  email: "dev@example.com",
  role: "admin",
};

// Expiration (optional)
const options = { expiresIn: "1d" };

// Generate token
const token = jwt.sign(payload, JWT_SECRET, options);

console.log("Dev JWT Token:");
console.log(token);