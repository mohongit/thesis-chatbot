const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4ZnN5ZGp4bnZpZXZraWxmYXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTg1NzUsImV4cCI6MjA5MjA3NDU3NX0.WlqIsIJ7yw08I0OeYh0S5fnaxegEXUgJ1Ksq1y2l6c4");

async function getChatbotResponse(userMessage, studentMajor) {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        systemInstruction: `
            ROLE: Professional Academic Coach.
            
            CONSTRAINTS:
            - NO conversational filler. Start directly.
            - Relate all logic to the field of ${studentMajor}.
            - Provide structured, high-level academic guidance.
            - AT THE END, after a '---' separator, list 2-3 specific academic references, 
              textbook chapters, or authoritative sources that support your answer.
        `
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(userMessage);
    const fullText = result.response.text();
    
    const parts = fullText.split('---');
    let reply = parts[0].trim();
    let rawReferences = parts[1] ? parts[1].trim() : `Foundational concepts in ${studentMajor}`;

    const cleanReply = reply.replace(/\*\*/g, '');

    const cleanReferences = rawReferences
        .replace(/\*\*(Academic\s)?References:\*\*/gi, '')
        .replace(/(Academic\s)?References:/gi, '')       
        .replace(/\*\*/g, '')                            
        .trim();

    try {
        await supabase.from('interactions').insert([
            { 
                major: studentMajor, 
                user_query: userMessage, 
                bot_response: cleanReply 
            }
        ]);
    } catch (dbError) {
        console.error("Database logging failed:", dbError);
    }

    return {
        reply: cleanReply,
        references: cleanReferences
    };
}

module.exports = { getChatbotResponse };