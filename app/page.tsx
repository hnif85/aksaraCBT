import { supabase } from '@/lib/supabase'
import ProfilSelector from './profil-selector'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data: profil } = await supabase
    .from('profil')
    .select('*')

  return <ProfilSelector profil={profil || []} />
}
