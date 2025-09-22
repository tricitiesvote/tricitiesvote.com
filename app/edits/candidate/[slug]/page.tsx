import { CandidateEditHistoryView } from './CandidateEditHistoryView';

interface PageProps {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function CandidateEditsPage({ params, searchParams }: PageProps) {
  return (
    <CandidateEditHistoryView
      slug={params.slug}
      status={undefined}
      searchParams={searchParams}
    />
  );
}
