import { getBoardData } from '../actions';
import { BACKEND } from '@/lib/data/store';
import Board from '@/components/Board';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Publishing Board · Famies' };

export default async function BoardPage() {
  const data = await getBoardData();
  return <Board initialData={data} backend={BACKEND} />;
}
