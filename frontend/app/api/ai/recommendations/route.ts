export const runtime = 'nodejs';

interface RecommendationRequest {
  fieldId: string;
  fieldName: string;
  crop: string;
  moisture: number;
  temperature: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  soilType: string;
}

export async function POST(request: Request) {
  try {
    const data: RecommendationRequest = await request.json();

    let title = "Maintain Current Strategy";
    let description = `All soil parameters for ${data.fieldName} are currently in the optimal range. Continue regular monitoring.`;
    let urgency: "high" | "medium" | "low" = "low";
    let category: "irrigation" | "fertilization" | "pest-control" | "harvest" = "irrigation";
    let metrics = [
      `Moisture: ${data.moisture}% (Ideal)`,
      `pH: ${data.ph} (Optimal)`
    ];

    // Simple rule-based static recommendation logic
    if (data.moisture < 60) {
      title = "Urgent Irrigation Required";
      description = `Soil moisture in ${data.fieldName} is low (${data.moisture}%). Alternate Wetting and Drying strategy suggests flooding to 3cm depth immediately to avoid crop stress.`;
      urgency = "high";
      category = "irrigation";
      metrics = [
        `Current moisture: ${data.moisture}%`,
        `Target moisture: 75%`,
        `Forecast: 3 days dry`
      ];
    } else if (data.nitrogen < 40) {
      title = "Apply Nitrogen Fertilizer";
      description = `Nitrogen level is below optimal (${data.nitrogen} ppm) in ${data.fieldName}. Apply Urea or organic compost to support leaf growth.`;
      urgency = "medium";
      category = "fertilization";
      metrics = [
        `Nitrogen: ${data.nitrogen} ppm`,
        `Target: 50 ppm`,
        `Urgency: Next 5 days`
      ];
    } else if (data.ph < 6.0) {
      title = "Apply Lime to Soil";
      description = `Soil pH is slightly acidic (${data.ph}). Recommended to apply agricultural lime (calcium carbonate) to raise pH toward optimal range.`;
      urgency = "medium";
      category = "fertilization";
      metrics = [
        `Current pH: ${data.ph}`,
        `Target pH: 6.5`,
        `Application rate: 2t/ha`
      ];
    } else if (data.moisture > 82) {
      title = "Drain Field";
      description = `Excessive moisture detected (${data.moisture}%). If crop is in grain-filling stage, initiate drainage to prevent root rot.`;
      urgency = "medium";
      category = "irrigation";
      metrics = [
        `Moisture: ${data.moisture}%`,
        `Target: 70%`,
        `Growth stage: Tillering`
      ];
    }

    return Response.json({
      id: `rec-${Date.now()}`,
      fieldId: data.fieldId,
      title,
      description,
      urgency,
      category,
      metrics,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating static recommendation:', error);
    return Response.json(
      {
        error: 'Failed to generate recommendation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
