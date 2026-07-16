import { MainLayout } from '@/components/layout/main-layout';
import { RecommendationsContent } from '@/components/recommendations/recommendations-content';
import { mockFields, mockRecommendations } from '@/lib/mock-data';

export default function RecommendationsPage() {
  return (
    <MainLayout>
      <RecommendationsContent
        fields={mockFields}
        recommendations={mockRecommendations}
      />
    </MainLayout>
  );
}
