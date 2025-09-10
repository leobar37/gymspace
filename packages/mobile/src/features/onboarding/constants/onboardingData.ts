import { Dumbbell, TrendingUp, Users, Shield } from 'lucide-react-native';

export interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  Icon: any;
  iconColor: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    title: "Gestiona tu Gimnasio",
    subtitle: "Control total de membresías y clientes en un solo lugar",
    Icon: Dumbbell,
    iconColor: '#8b5cf6', // Purple
  },
  {
    id: 2,
    title: "Seguimiento en Tiempo Real",
    subtitle: "Monitorea asistencias y pagos al instante",
    Icon: TrendingUp,
    iconColor: '#10b981', // Green
  },
  {
    id: 3,
    title: "Gestión de Miembros",
    subtitle: "Administra clientes y sus membresías fácilmente",
    Icon: Users,
    iconColor: '#3b82f6', // Blue
  },
  {
    id: 4,
    title: "Seguro y Confiable",
    subtitle: "Tus datos protegidos en la nube, accesibles desde cualquier lugar",
    Icon: Shield,
    iconColor: '#f59e0b', // Amber
  }
];