import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ระบบจองวันตรวจสุขภาพประจำปี | โรงพยาบาลท่าสองยาง',
    short_name: 'ตรวจสุขภาพ',
    description: 'บริการจองคิวตรวจสุขภาพประจำปีสำหรับบุคลากร สะดวก รวดเร็ว เลือกวันและแพ็กเกจได้ตามสะดวก',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0d9488',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
