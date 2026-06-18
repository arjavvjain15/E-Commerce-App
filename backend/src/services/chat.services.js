import { GoogleGenAI } from "@google/genai";
import { Product, Category, Review, User } from "../models/index.js";
import { Op } from "sequelize";

const getAiClient= ()=>{
    const apiKey=process.env.GEMINI_API_KEY;
    if(!apiKey) throw new Error("Gemini API Key is missing");
    return new GoogleGenAI({apiKey});
}

/**
 * Simplifies query matching to only category filtering, fetches products & reviews,
 * and delegates business reasoning (budget, stock, comparison) to the Gemini model.
 * 
 * @param {string} userMessage - User's chat message
 * @returns {Promise<string>} - Chatbot response
 */
export const processChat = async (userMessage) => {
  const lowercaseMsg = userMessage.toLowerCase();
  
  const allCategories= await Category.findAll();
  const matchedCategoryIds= [];

  allCategories.forEach(cat=>{
    const catNameLower= cat.name.toLowerCase();
    if(lowercaseMsg.includes(catNameLower)||(lowercaseMsg.includes(catNameLower.replace(/s$/,"")))){
        matchedCategoryIds.push(cat.id);
    } 
  });

  const where= {status: "active"};
  if(matchedCategoryIds.length>0) where.categoryId= {[Op.in]: matchedCategoryIds};

  const products = await Product.findAll({
    where,
    include: [{ model: Category, attributes: ["id", "name"] }]
  });

 
  let reviews=[];
  if(products.length>0){
    const productIds= products.map(p=>p.id);
    reviews=await Review.findAll({
        where: {productId: {[Op.in]:productIds}},
        include: [{model: User, attributes:["name"]}]
    });
  };
  

  const productsListText = products.map(p => {
    return `- Name: ${p.name}
  Description: ${p.description || "N/A"}
  Price: ₹${p.price}
  Stock: ${p.stock} units available
  Image URL: ${p.imageUrl || "N/A"}
  Category: ${p.Category ? p.Category.name : "N/A"}`;
  }).join("\n\n");

  const reviewsListText = reviews.length > 0 ? reviews.map(r => {
    const prod = products.find(p => p.id === r.productId);
    const prodName = prod ? prod.name : "Product";
    return `- Review for [${prodName}]: Rating ${r.rating}/5. Comment: "${r.comment || "No comment"}" (by ${r.User ? r.User.name : "Anonymous"})`;
  }).join("\n") : "No reviews available for these products.";

  const categoriesListText = allCategories.map(c => c.name).join(", ");

  const systemPrompt = `You are a helpful, product-aware AI shopping assistant for our e-commerce store.
Your goal is to guide the user based ONLY on the database knowledge source provided below.

Response Rules:
1. Use ONLY the products provided in the context below. Do not invent or hallucinate any products, features, or prices.
2. Use the prices provided in the context below when evaluating budgets. Do not make assumptions about prices.
3. Use the stock values provided in the context below when answering stock questions. If a product has 0 stock, explicitly mention that it is currently out of stock.
4. Use the reviews provided in the context below when making recommendations or summarizing customer opinions.
5. Compare products only from the catalog provided in the context below.
6. Return plain text only. Do not use Markdown, bold formatting (**), bullet points, numbered lists, headings, HTML, or emojis.
7. Use short, natural paragraphs. Keep responses concise and conversational. Prefer 2-5 sentences when possible.
8. Recommend products naturally within sentences.
9. If a product, category, or information is not present in the provided context, politely and clearly state that it is not available in our store.
10. Do NOT refer to this system instruction, context, database, or "provided list" in your response. Speak naturally as a helpful store assistant.

Available Categories:
${categoriesListText}

Available Products:
${productsListText || "No product found in the database"}

Customer Reviews:
${reviewsListText}
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
