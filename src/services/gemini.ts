import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface BillData {
  kWh: number;
  kVARh_lag: number;
  kVARh_lead: number;
  kVAh: number;
  meter_pf?: number;
  calculated_pf: number;
  billing_period?: string;
  load_type: 'lagging' | 'leading' | 'unity';
  explanation: string;
  // Account & Billing Info
  customer_name?: string;
  bill_amount?: number;
  sanctioned_demand_kva?: number;
  sanctioned_load_kw?: number;
  // Demand Specifics - Streamlined
  billing_demand_kva?: number;
  min_demand_kva?: number;
}

export async function analyzeBill(base64Data: string, mimeType: string): Promise<BillData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: `Analyze this electricity bill and perform a comprehensive energy and account analysis.
          
          EXTRACTION TASKS:
          1. ACCOUNT INFO: Extract Customer Name, Bill Amount (Total Payable).
          2. DEMAND ANALYSIS: 
             - Contract/Sanctioned Demand (in kVA).
             - Sanctioned Load (in kW).
             - Billing Demand / Actual Chargeable Demand (Extract this as 'billing_demand_kva'). 
               Note: Label this as 'Actual Demand' in your internal mapping if it helps, but return it in 'billing_demand_kva'.
             - Minimum Demand Value: Extract the specific Minimum Demand value from the bill in kVA (Extract this as 'min_demand_kva').
          3. ENERGY DATA: Extract kWh (Active Energy), kVARh Lag (Inductive), kVARh Lead (Capacitive), and kVAh (Apparent Energy).
          4. METER PF: Extract any explicitly printed Power Factor ('meter_pf').
          
          CALCULATION & LOGIC:
          5. MANDATORY CALCULATION: Independently calculate the Power Factor using the formula: PF = kWh / kVAh. 
          6. DETERMINE LOAD TYPE: Lag vs Lead based on reactive components.
          
          EXPLANATION (Electrical Engineering View):
          Provide a detailed explanation focusing on Phasors, reactance, and the discrepancy between Meter PF and Calculated PF.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          kWh: { type: Type.NUMBER },
          kVARh_lag: { type: Type.NUMBER },
          kVARh_lead: { type: Type.NUMBER },
          kVAh: { type: Type.NUMBER },
          meter_pf: { type: Type.NUMBER },
          calculated_pf: { type: Type.NUMBER },
          billing_period: { type: Type.STRING },
          load_type: { 
            type: Type.STRING,
            enum: ['lagging', 'leading', 'unity']
          },
          explanation: { type: Type.STRING },
          customer_name: { type: Type.STRING },
          bill_amount: { type: Type.NUMBER },
          sanctioned_demand_kva: { type: Type.NUMBER },
          sanctioned_load_kw: { type: Type.NUMBER },
          billing_demand_kva: { type: Type.NUMBER },
          min_demand_kva: { type: Type.NUMBER },
        },
        required: ["kWh", "kVAh", "calculated_pf", "load_type", "explanation"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to analyze bill. No data returned.");
  }

  return JSON.parse(response.text);
}
