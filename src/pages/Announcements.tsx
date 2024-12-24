import { NewAnnouncementForm } from "@/components/announcements/NewAnnouncementForm";

const Announcements = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Anons Yönetimi</h2>
        <p className="text-muted-foreground">
          Yeni anons oluşturun ve zamanlamayı ayarlayın
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <NewAnnouncementForm />
      </div>
    </div>
  );
};

export default Announcements;