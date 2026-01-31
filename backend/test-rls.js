// Test Supabase with a real user
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function testWithRealUser() {
  try {
    console.log("1️⃣ Getting first user from database...");
    
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .limit(1);

    if (userError) {
      console.error("❌ Error fetching users:", userError);
      return;
    }

    if (!users || users.length === 0) {
      console.error("❌ No users in database. You need to register first.");
      return;
    }

    const userId = users[0].id;
    console.log(`✅ Found user: ${users[0].email} (${userId})`);

    console.log("\n2️⃣ Attempting INSERT with this user_id...");
    
    const { data, error } = await supabase
      .from("agents")
      .insert({
        user_id: userId,
        name: "Test Agent " + Date.now(),
        description: "Test Description",
        type: "CONVERSATIONAL",
      })
      .select();

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log("✅ Success! Created agent:", data?.[0]?.id);
  } catch (err) {
    console.error("❌ Exception:", err);
  }
}

testWithRealUser();
