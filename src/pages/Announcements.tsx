import { CreateAnnouncementDialog } from "@/components/announcements/CreateAnnouncementDialog";
import { AnnouncementList } from "@/components/announcements/AnnouncementList";

const Announcements = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anons Yönetimi</h1>
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