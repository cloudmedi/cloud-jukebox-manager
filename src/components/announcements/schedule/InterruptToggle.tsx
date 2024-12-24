import { FormField } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";

interface InterruptToggleProps {
  form: UseFormReturn<any>;
}

export const InterruptToggle = ({ form }: InterruptToggleProps) => {
  return (
    <FormField
      control={form.control}
      name="immediateInterrupt"
      render={({ field }) => (
        <div className="flex items-center space-x-2 p-4 border rounded-lg">
          <input
            type="checkbox"
            id="immediateInterrupt"
            checked={field.value}
            onChange={field.onChange}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="immediateInterrupt">
            Çalma sırası geldiğinde mevcut şarkıyı durdur
          </Label>
        </div>
      )}
    />
  );
};