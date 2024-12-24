import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { sendSOL, solana } from "@goat-sdk/wallet-solana";
import { Connection, Keypair } from "@solana/web3.js";
import { jupiter } from "@goat-sdk/plugin-jupiter";
import { splToken } from "@goat-sdk/plugin-spl-token";
import base58 from "bs58";
import * as readline from 'readline';
import * as fs from 'fs';
import OpenAI from 'openai';

require("dotenv").config();

const connection = new Connection(process.env.SOLANA_RPC_URL as string);
const keypair = Keypair.fromSecretKey(base58.decode(process.env.SOLANA_PRIVATE_KEY as string));

// Initialize OpenAI client
const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Function to encode image to base64
function encodeImage(imagePath: string) {
    const image = fs.readFileSync(imagePath);
    return Buffer.from(image).toString('base64');
}

async function analyzeImage(imagePath: string) {
    try {
        const base64Image = encodeImage(imagePath);
        const response = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Determine the following:\nTrading pair\n\nTrading direction, wheter its a long or short\nEntry point\nStop loss level\nTake profit target\nProvide specific price levels.\nDont provide any reasoning or explanation or anything else."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error analyzing image:', error);
        return "Sorry, I couldn't analyze the image. Please try again.";
    }
}

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function chat() {
    const tools = await getOnChainTools({
        wallet: solana({
            keypair,
            connection,
        }),
        plugins: [sendSOL(), jupiter(), splToken()],
    });

    console.log("Chat started! Type 'exit' to quit.");
    console.log("Type 'analyze trade.jpg' to analyze the trading chart.");
    
    const askQuestion = () => {
        rl.question('\nYou: ', async (prompt) => {
            if (prompt.toLowerCase() === 'exit') {
                rl.close();
                return;
            }

            try {
                if (prompt.toLowerCase() === 'analyze trade.jpg') {
                    console.log('\nAI: Analyzing trading chart...');
                    const analysis = await analyzeImage('trade.jpg');
                    console.log('\nAI:', analysis);
                } else {
                    const result = await generateText({
                        model: openai("gpt-4o-mini"),
                        tools: tools,
                        maxSteps: 10,
                        prompt: prompt,
                    });
                    console.log('\nAI:', result.text);
                }
            } catch (error) {
                console.error('Error:', error);
            }

            // Continue the conversation
            askQuestion();
        });
    };

    askQuestion();
}

// Handle readline close
rl.on('close', () => {
    console.log('\nChat ended. Goodbye!');
    process.exit(0);
});

// Start the chat
chat().catch(console.error);