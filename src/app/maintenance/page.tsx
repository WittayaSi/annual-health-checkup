import { MaintenanceNotice } from '@/components/maintenance/MaintenanceNotice';
import { getActiveUserAction, getAllUsersAction } from '@/app/actions';

export const metadata = {
  title: 'ปิดปรับปรุงระบบชั่วคราว | ระบบตรวจสุขภาพประจำปี โรงพยาบาลท่าสองยาง',
  description: 'ระบบอยู่ระหว่างการปิดปรับปรุงชั่วคราวเพื่ออัปเกรดประสิทธิภาพการให้บริการ',
};

export default async function MaintenancePage() {
  const activeUser = await getActiveUserAction();
  const allUsers = await getAllUsersAction();

  return <MaintenanceNotice activeUser={activeUser} allUsers={allUsers} />;
}
