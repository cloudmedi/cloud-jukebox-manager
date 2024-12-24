import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";

const Announcements = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Anons Yönetimi</h1>
        <p className="text-muted-foreground">
          Yeni anons oluşturun ve zamanlamayı ayarlayın
        </p>
      </div>

      <AnnouncementForm />
    </div>
  );
};

export default Announcements;