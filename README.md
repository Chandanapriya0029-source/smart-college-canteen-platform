# Campus Canteen OS · Smart Management Platform & Gemini AI

A capacity-controlled smart college canteen management and ordering platform for ~200 students with real-time inventory visibility, 5-minute reservation TTL holds, scheduled pickup slot throttling, and **Google Gemini AI** demand intelligence.

---

## 🚀 Live Cloud Deployment Options (No Local Drive Needed)

You can deploy this project live to the web in under 2 minutes using any of the following free platforms:

### Option 1: Deploy to Vercel (Recommended - 1 Click)
1. Push this folder to a GitHub repository (e.g. `https://github.com/your-username/canteen-platform`).
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository.
4. (Optional) In **Environment Variables**, add:
   - `GEMINI_API_KEY` = `your_gemini_api_key_from_google_ai_studio`
5. Click **Deploy**. Your app is live instantly with a public `.vercel.app` URL!

---

### Option 2: Deploy to Netlify (Drag & Drop or Git)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the `canteen-platform` folder into Netlify.
3. Your site goes live instantly on a free `.netlify.app` domain.
4. Click the **"🔑 Gemini API Key"** button in the app header and paste your key.

---

### Option 3: Deploy to Render / Railway / Google Cloud Run
1. Connect your GitHub repository to [render.com](https://render.com) (Web Service).
2. Set Build Command: `npm install`
3. Set Start Command: `npm start`
4. Add Environment Variable:
   - `GEMINI_API_KEY` = `your_key`

---

## ✨ Connecting Google Gemini API

1. Get a free Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open your deployed canteen app.
3. Click the **"🔑 Gemini API Key"** button in the top navigation bar.
4. Paste your key and click **Save & Activate**.

### What Gemini AI Does in the Platform:
- **👨‍🍳 Smart Kitchen Batch Prep Forecast:** Analyzes live slot fill rates (e.g. 7:00, 7:15, 7:30 peak) and recommends batch cooking quantities before kitchen queues form.
- **💬 Student Meal Advisor:** Helps students find healthy meals, high-protein combos, or budget meals under ₹100 with zero wait time.
