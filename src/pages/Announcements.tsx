import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnnouncementList from "@/components/announcements/AnnouncementList";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";

const Announcements = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Anons Yönetimi</h2>
        <p className="text-muted-foreground">
          Anonsları oluşturun, düzenleyin ve zamanlayın
        </p>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Anons Listesi</TabsTrigger>
          <TabsTrigger value="create">Yeni Anons</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <AnnouncementList />
        </TabsContent>
        <TabsContent value="create" className="space-y-4">
          <AnnouncementForm 
            announcement={null} 
            onSuccess={() => {
              // Optional: Add any success handling here
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Announcements;