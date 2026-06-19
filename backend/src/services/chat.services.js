import { GoogleGenAI } from "@google/genai";
import { Product, Category} from "../models/index.js";

const getAiClient= ()=>{
    const apiKey=process.env.GEMINI_API_KEY;
    if(!apiKey) throw new Error("Gemini API Key is missing");
    return new GoogleGenAI({apiKey});
};

export const processChat = async (userMessage) => {

    const allCategories = await Category.findAll();
    const products = await Product.findAll({
    where: { status: "active" },
    include: [{ model: Category, attributes: ["id", "name"] }]
  });

  const productsListText = products.map(p => {
    return `- Name: ${p.name}
  Description: ${p.description || "N/A"}
  Price: ₹${p.price}
  Stock: ${p.stock} units available
  Category: ${p.Category ? p.Category.name : "N/A"}`;
  }).join("\n\n");

  const categoriesListText = allCategories.map(c => c.name).join(", ");

  const systemPrompt = 
  `You are an AI shopping assistant for our e-commerce store.

  The store catalog below is the source of truth for:
  * Product existence
  * Product availability
  * Product prices
  * Product stock values
  
  Rules:
  1. Only recommend products that exist in the provided catalog.
  2. Never invent products that are not present in the catalog.
  3. Never invent prices, stock values, discounts, ratings, reviews, or availability.
  4. If a product is not present in the catalog, explain that it is not currently available in our store.
  5. Use the catalog information as authoritative whenever it conflicts with general knowledge.
  6. You may use generally known information about a product model to provide additional context, comparisons, or recommendations when you are reasonably confident that the product refers to the same model.
  7. Do not invent technical specifications that are uncertain or unavailable.
  8. If you are not confident about a specification, state that the information is unavailable.
  9. For budget questions, use catalog prices only.
  10. For availability questions, use catalog stock values only.
  11. When comparing products, prioritize catalog information first, then supplement with generally known product characteristics when helpful.
  12. If the catalog description is sparse, use the product name and generally known characteristics to help explain strengths and use cases.
  13. If the user asks for the best product for gaming, photography, productivity, battery life, or similar use cases, you may use generally known characteristics of the products present in the catalog to make recommendations.
  14. Never claim information came from the internet, web search, training data, or external sources.
  15. Keep responses concise, conversational, and customer-focused.
  16. Return plain text only.
  17. Do not use Markdown, HTML, emojis, bullet points, or numbered lists.
  18. Respond naturally as a shopping assistant for the store.
  
  Available Categories:
  ${categoriesListText}
  
  Available Products:
  ${productsListText || "No active products found in database."}
  
  User Question:
  ${userMessage}
  `;
  

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: systemPrompt + `\n\nUser Question:\n${userMessage}` }] }
    ]
  });

  return response.text || "Sorry, your request cannot be handled at this moment";
};
