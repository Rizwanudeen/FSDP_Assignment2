// Test the /conversations/latest/:agentId endpoint with a complete flow
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const base = "http://localhost:3000/api";

async function testLatestConversationEndpoint() {
  console.log("=== Testing /conversations/latest/:agentId endpoint ===\n");

  try {
    // 1. Register a user
    console.log("1️⃣ Registering new user...");
    const email = `test${Date.now()}@example.com`;
    const registerRes = await fetch(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "TestPass123!",
        name: "Test User",
      }),
    });

    const registerData = await registerRes.json();
    const token = registerData.data?.token;

    if (!token) {
      console.error("Failed to register user");
      return;
    }

    console.log(`✅ Registered: ${email}`);
    console.log("   Token:", token.substring(0, 20) + "...");

    // 2. Create an agent
    console.log("\n2️⃣ Creating agent...");
    const createAgentRes = await fetch(`${base}/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Test Agent",
        description: "Test Description",
        type: "CONVERSATIONAL",
      }),
    });

    const agentData = await createAgentRes.json();
    const agentId = agentData.data?.id;

    if (!agentId) {
      console.error("Failed to create agent:", agentData);
      return;
    }

    console.log(`✅ Created agent: ${agentId}`);

    // 3. Test the endpoint - should return 404 (no conversation yet)
    console.log(`\n3️⃣ Testing GET /api/conversations/latest/${agentId} (no conversation yet)`);
    const latestRes1 = await fetch(`${base}/conversations/latest/${agentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`   Status: ${latestRes1.status}`);
    const latestData1 = await latestRes1.json();

    if (latestRes1.status === 404) {
      console.log("✅ Correct: 404 (no conversation found)");
    } else {
      console.log("   Response:", latestData1);
    }

    // 4. Create a conversation
    console.log("\n4️⃣ Creating conversation...");
    const msgRes = await fetch(`${base}/conversations/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        agentId: agentId,
        message: "Hello!",
      }),
    });

    const msgData = await msgRes.json();
    const conversationId = msgData.conversationId;
    console.log(`✅ Created message in conversation: ${conversationId}`);

    // 5. Now test the endpoint again - should return 200 with conversation
    console.log(`\n5️⃣ Testing GET /api/conversations/latest/${agentId} (with conversation)`);
    const latestRes2 = await fetch(`${base}/conversations/latest/${agentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`   Status: ${latestRes2.status}`);
    const latestData2 = await latestRes2.json();

    if (latestRes2.status === 200) {
      console.log("✅ SUCCESS! Endpoint works correctly");
      console.log(`   Conversation ID: ${latestData2.data?.id}`);
      console.log(`   Messages: ${latestData2.data?.messages?.length || 0}`);
    } else {
      console.error("❌ Unexpected status:", latestRes2.status);
      console.error("   Response:", latestData2);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

testLatestConversationEndpoint();
