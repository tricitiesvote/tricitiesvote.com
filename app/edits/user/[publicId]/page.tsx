import { UserEditHistoryView } from './UserEditHistoryView';

interface PageProps {
  params: { publicId: string };
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function UserEditsPage({ params, searchParams }: PageProps) {
  return (
    <UserEditHistoryView
      publicId={params.publicId}
      status={undefined}
      searchParams={searchParams}
    />
  );
}
