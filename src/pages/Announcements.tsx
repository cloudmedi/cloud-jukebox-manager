import { CreateAnnouncementDialog } from "@/components/announcements/CreateAnnouncementDialog";
import { AnnouncementList } from "@/components/announcements/AnnouncementList";

const Announcements = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Anons Yönetimi</h1>
          <p className="text-muted-foreground">
            Yeni anons oluşturun ve zamanlamayı ayarlayın
          </p>
        </div>
        <CreateAnnouncementDialog />
      </div>

      <AnnouncementList />
    </div>
  );
};

export default Announcements;