import { GoogleGenAI, Chat } from "@google/genai";
import { Message, Sender } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  private initChat() {
    if (!this.chatSession) {
      this.chatSession = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });
    }
  }

  async sendMessage(text: string, history: Message[]): Promise<string> {
    try {
      this.initChat();

      if (!this.chatSession) {
        throw new Error("Failed to initialize chat session");
      }

      // Note: In a real persistent app, we might sync history more carefully,
      // but for this simple session-based chat, the SDK manages the history 
      // context within the `chatSession` instance automatically. 
      // We just send the new message.

      const result = await this.chatSession.sendMessage({
        message: text
      });

      return result.text || "마음이 흐트러져 내 말이 잘 들리지 않았나 보구나. 다시 한 번 말해줄래?";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("스님과의 연결이 잠시 원활하지 않아. 잠시 후 다시 시도해볼래?");
    }
  }
}