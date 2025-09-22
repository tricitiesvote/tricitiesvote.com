import { notFound } from 'next/navigation';
import { UserEditHistoryView } from '../UserEditHistoryView';

interface PageProps {
  params: { publicId: string; status: string };
  searchParams: Record<string, string | string[] | undefined>;
}

const ALLOWED_STATUSES = new Set(['pending', 'accepted', 'declined']);

export default async function UserEditsStatusPage({ params, searchParams }: PageProps) {
  if (!ALLOWED_STATUSES.has(params.status)) {
    notFound();
  }

  return (
    <UserEditHistoryView
      publicId={params.publicId}
      status={params.status as 'pending' | 'accepted' | 'declined'}
      searchParams={searchParams}
    />
  );
}
