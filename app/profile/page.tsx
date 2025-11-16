import dynamic from "next/dynamic";

const ProfilePageClient = dynamic(() => import("./ProfilePageClient"), { ssr: false });

export default function ProfilePage() {
  return <ProfilePageClient />;
}
