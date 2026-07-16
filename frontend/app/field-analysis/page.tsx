import { MainLayout } from '@/components/layout/main-layout';
import { FieldAnalysisContent } from '@/components/field-analysis/field-analysis-content';
import { mockFields } from '@/lib/mock-data';

export default function FieldAnalysisPage() {
  return (
    <MainLayout>
      <FieldAnalysisContent fields={mockFields} />
    </MainLayout>
  );
}
