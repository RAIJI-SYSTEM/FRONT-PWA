import FlowTopBar from '@/components/FlowTopBar';
import ProfileScreen from '@/features/profile/components/ProfileScreen';

export default function ProfilePage() {
  return (
    <>
      <FlowTopBar title="Perfil" backHref="/mais" />
      <ProfileScreen />
    </>
  );
}
