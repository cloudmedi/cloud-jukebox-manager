import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GroupBasicInfoProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const GroupBasicInfo = ({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: GroupBasicInfoProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Grup Adı</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Grup adını girin"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="description">Açıklama</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Grup açıklaması girin"
          className="mt-1.5"
        />
      </div>
    </div>
  );
};