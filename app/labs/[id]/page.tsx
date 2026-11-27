import { notFound } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { allLabs, getLab } from '@/lib/labs';
import LabRunner from '@/components/lab/LabRunner';

export function generateStaticParams() {
  return allLabs.map((lab) => ({ id: lab.id }));
}

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lab = getLab(id);
  if (!lab) notFound();

  return (
    <ReactFlowProvider>
      <LabRunner lab={lab} />
    </ReactFlowProvider>
  );
}
