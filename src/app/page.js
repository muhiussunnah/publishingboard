import { getBoardData } from './actions';
import { BACKEND } from '@/lib/data/store';
import Board from '@/components/Board';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await getBoardData();
  return <Board initialData={data} backend={BACKEND} />;
}
