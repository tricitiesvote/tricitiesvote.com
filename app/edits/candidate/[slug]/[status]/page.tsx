import { notFound } from 'next/navigation';
import { CandidateEditHistoryView } from '../CandidateEditHistoryView';

interface PageProps {
  params: { slug: string; status: string };
  searchParams: Record<string, string | string[] | undefined>;
}

const ALLOWED_STATUSES = new Set(['pending', 'accepted', 'declined']);

export default async function CandidateEditsStatusPage({ params, searchParams }: PageProps) {
  if (!ALLOWED_STATUSES.has(params.status)) {
    notFound();
  }

  return (
    <CandidateEditHistoryView
      slug={params.slug}
      status={params.status as 'pending' | 'accepted' | 'declined'}
      searchParams={searchParams}
    />
  );
}
