import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ระบบจองวันตรวจสุขภาพประจำปี เจ้าหน้าที่โรงพยาบาล',
    short_name: 'ตรวจสุขภาพ',
    description: 'ระบบจองคิวและวันเข้ารับการตรวจสุขภาพประจำปีสำหรับบุคลากรและเจ้าหน้าที่โรงพยาบาล',
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
