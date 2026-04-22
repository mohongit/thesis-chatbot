const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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

    try {
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

        const { error: dbError } = await supabase.from('interactions').insert([
            { 
                major: studentMajor, 
                user_query: userMessage, 
                bot_response: cleanReply 
            }
        ]);

        if (dbError) {
            console.error("Supabase Insert Error:", dbError.message);
        }

        return {
            reply: cleanReply,
            references: cleanReferences
        };

    } catch (error) {
        console.error("AI Logic Error:", error);
        return {
            reply: "The AI is having trouble connecting. Please try again.",
            references: "Check your API connection."
        };
    }
}

module.exports = { getChatbotResponse };