import { type Express } from "express";
import Retell from "retell-sdk";

export function registerRetellConfigRoute(app: Express) {
  app.post("/api/retell/create-web-call", async (req, res) => {
    try {
      const retellApiKey = process.env.RETELL_API_KEY;
      const retellAgentId = process.env.RETELL_AGENT_ID;

      if (!retellApiKey || !retellAgentId) {
        return res.status(500).json({ error: "Retell AI configuration not found" });
      }

      const client = new Retell({
        apiKey: retellApiKey
      });

      const webCallResponse = await client.call.createWebCall({
        agent_id: retellAgentId
      });

      res.json({
        access_token: webCallResponse.access_token,
        call_id: webCallResponse.call_id
      });
    } catch (error) {
      console.error("Error creating Retell web call:", error);
      res.status(500).json({ error: "Failed to create web call" });
    }
  });
}
