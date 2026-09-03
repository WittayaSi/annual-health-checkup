import { getActiveUserAction, getCampaignAction } from '@/app/actions';
import { CheckupGuideGraphic } from '@/components/staff/CheckupGuideGraphic';

export default async function HomePage() {
  const activeUser = await getActiveUserAction();
  const campaign = await getCampaignAction(activeUser?.organization, activeUser?.department);

  return (
    <div>
      <CheckupGuideGraphic activeUser={activeUser} campaign={campaign} />
    </div>
  );
}
